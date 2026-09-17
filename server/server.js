import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sequelize, User, SecurityEvent, Alert, AuditLog } from './models/index.js';
import { calculateRisk } from './engines/riskEngine.js';
import { evaluateAction } from './engines/policyEngine.js';
import { getAgentRecommendation } from './engines/agentEngine.js';

const app = express();
app.use(helmet()); // Basic security headers
app.use(cors());
app.use(express.json());

// Basic Rate Limiting to prevent easy DoS on API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

const generateId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

// Setup Database and Seed Demo Data
async function initDb() {
  try {
    await sequelize.sync({ force: true }); // Reset for dev Phase 2
    console.log('Database synced.');

    // Seed Demo User
    await User.create({
      username: 'demo_user',
      status: 'ACTIVE'
    });
    console.log('Demo user seeded.');
    
    // Seed an initial event so the dashboard isn't completely empty
    await SecurityEvent.create({
      eventId: generateId('EVT'),
      eventType: "LOGIN_SUCCESS",
      username: "demo_user",
      sourceIp: "10.0.0.5",
      status: "SUCCESS",
      severity: "LOW",
      analyzed: true,
      threatDetected: false
    });

  } catch (err) {
    console.error('Failed to sync DB:', err);
  }
}

// ----------------------------------------------------------------------
// Phase 2 Placeholder Logic (To keep frontend working before ML/Agent integration)
// ----------------------------------------------------------------------

const enforceAccountState = async (username) => {
  const account = await User.findOne({ where: { username } });
  if (!account) return;

  const now = new Date();

  if (account.status === 'TEMPORARILY_RESTRICTED' && account.restrictionExpiresAt && now > account.restrictionExpiresAt) {
    account.status = 'ACTIVE';
    account.restrictionExpiresAt = null;
    await account.save();
    await AuditLog.create({
      action: 'COOLDOWN_EXPIRED', targetEntity: 'User', targetId: username, details: 'User cooldown expired, status set to ACTIVE.'
    });
  }

  if (account.firstSuspiciousActivityAt && account.status !== 'BLOCKED') {
    const elapsedMinutes = (now - account.firstSuspiciousActivityAt) / 60000;
    if (elapsedMinutes >= 5 && account.suspiciousEventCount >= 5) {
      account.status = 'BLOCKED';
      account.blockedAt = now;
      await account.save();
      await AuditLog.create({
        action: 'ACCOUNT_BLOCKED', targetEntity: 'User', targetId: username, details: '5-minute threshold reached.'
      });
    }
  }
};

const analyzeEventSequence = async (username, sourceIp) => {
  const account = await User.findOne({ where: { username } }) || await User.findOne({ where: { username: 'demo_user' } });
  if (!account) return;

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Feature Extraction
  // 1. recent_failed_logins
  const failedLogins = await SecurityEvent.count({
    where: {
      username,
      eventType: "LOGIN_FAILED",
      timestamp: {
        // Simple mock for "greater than" query since we don't have Op imported, we can do it manually or just fetch and count
      }
    }
  });
  
  // Since we didn't import Op from sequelize, let's just do a manual filter for simplicity
  const recentEvents = await SecurityEvent.findAll({
    where: { username },
    order: [['timestamp', 'DESC']]
  });
  
  const recentFailedLogins = recentEvents.filter(e => 
    e.eventType === "LOGIN_FAILED" && 
    (now.getTime() - new Date(e.timestamp).getTime()) <= 3600000
  ).length;

  // 2. unusual_ip_flag (if this IP only appeared in the very recent events, mark as unusual)
  const previousIps = new Set(recentEvents.slice(1).map(e => e.sourceIp));
  const unusual_ip_flag = (previousIps.size > 0 && !previousIps.has(sourceIp)) ? 1 : 0;

  // 3. event_hour
  const event_hour = now.getHours();

  // 4. sensitive_file_access
  const latestEvent = recentEvents[0];
  const sensitive_file_access = (latestEvent && latestEvent.eventType === "SUSPICIOUS_FILE_ACTIVITY") ? 1 : 0;

  try {
    // Call Python ML Microservice
    const mlResponse = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recent_failed_logins: recentFailedLogins,
        unusual_ip_flag,
        event_hour,
        sensitive_file_access
      })
    });
    
    if (!mlResponse.ok) {
        console.error("[Orbit AI] ML Service returned an error status.");
        return;
    }

    const mlData = await mlResponse.json();
    
    // Update event analysis status
    if (latestEvent) {
      latestEvent.analyzed = true;
      latestEvent.threatDetected = mlData.is_threat;
      await latestEvent.save();
    }

    // If a threat is predicted, create an Alert
    if (mlData.is_threat) {
      const existingAlert = await Alert.findOne({ where: { sourceIp, status: "OPEN" } });
      
      if (!existingAlert) {
        const alertId = generateId('ALT');
        
        // Phase 4: Calculate Deterministic Risk
        // For now, we assume event severity is HIGH and asset criticality is MEDIUM
        const riskResult = calculateRisk("HIGH", mlData.confidence, "MEDIUM");
        
        // Phase 5: Agentic AI Layer dynamically recommends action
        const validActions = ['LOG_ONLY', 'INVESTIGATE', 'RESTRICT_ACCOUNT', 'BLOCK_ACCOUNT', 'ISOLATE_ASSET'];
        const agentRecommendation = await getAgentRecommendation(
          { threatType: "Anomaly Detected / Account Compromise", severity: "HIGH", sourceIp, mlConfidence: mlData.confidence },
          riskResult,
          validActions
        );
        
        const agentAction = agentRecommendation.recommendedAction;
        const agentReasoning = agentRecommendation.reasoning;
        
        // Phase 4: Evaluate Policy
        const policyResult = evaluateAction(agentAction, riskResult.score, riskResult.level, "MEDIUM");

        await Alert.create({
          alertId,
          threatType: "Anomaly Detected / Account Compromise",
          relatedEventId: latestEvent ? latestEvent.eventId : null,
          severity: "HIGH",
          sourceIp,
          mlConfidence: mlData.confidence,
          status: "OPEN",
          agentRecommendedAction: agentAction,
          agentReasoning: agentReasoning,
          policyDecision: policyResult.decision, // ALLOWED, REQUIRES_HUMAN_APPROVAL, REJECTED
          riskScore: riskResult.score,
          riskLevel: riskResult.level,
          priority: riskResult.level === 'CRITICAL' ? 'P1' : 'P2'
        });

        account.status = account.status === 'ACTIVE' ? 'SUSPICIOUS' : account.status;
        account.firstSuspiciousActivityAt = account.firstSuspiciousActivityAt || now;
        account.suspiciousEventCount += recentFailedLogins || 1;
        account.incidentId = alertId;
        await account.save();

        await AuditLog.create({
          action: 'ALERT_CREATED', targetEntity: 'Alert', targetId: alertId, details: `ML predicted threat. Risk: ${riskResult.level} (${riskResult.score}). Policy Engine determined action '${agentAction}' is ${policyResult.decision}. Reason: ${policyResult.reason}`
        });
      }
    }
  } catch (error) {
    console.error("[Orbit AI] Failed to contact ML Service:", error.message);
  }
};

// ----------------------------------------------------------------------
// REST APIs (Backed by DB)
// ----------------------------------------------------------------------

app.get('/api/accounts/:username/security-status', async (req, res) => {
  const { username } = req.params;
  await enforceAccountState(username);
  
  const account = await User.findOne({ where: { username } });
  if (!account) return res.json({ status: 'ACTIVE' });
  
  let cooldownRemaining = 0;
  if (account.status === 'TEMPORARILY_RESTRICTED' && account.restrictionExpiresAt) {
    cooldownRemaining = Math.max(0, Math.ceil((account.restrictionExpiresAt.getTime() - new Date().getTime()) / 1000));
  }

  res.json({
    status: account.status,
    cooldownRemaining,
    blockedAt: account.blockedAt,
    incidentId: account.incidentId
  });
});

app.post('/api/security-events', async (req, res) => {
  const { eventType, username, sourceIp, status, severity, file } = req.body;
  
  await enforceAccountState(username);
  let account = await User.findOne({ where: { username } });
  
  if (!account) {
    account = await User.create({ username, status: 'ACTIVE' });
  }
  
  if ((eventType === "LOGIN_SUCCESS" || eventType === "LOGIN_FAILED") && account) {
    if (account.status === 'BLOCKED' || account.status === 'TEMPORARILY_RESTRICTED') {
      const blockedEvent = await SecurityEvent.create({
        eventId: generateId('EVT'),
        eventType: "BLOCKED_LOGIN_ATTEMPT",
        username,
        sourceIp,
        status: "BLOCKED",
        severity: "HIGH",
        analyzed: true,
        threatDetected: true
      });
      account.suspiciousEventCount += 1;
      await account.save();
      return res.status(403).json(blockedEvent);
    }
  }
  
  const newEvent = await SecurityEvent.create({
    eventId: generateId('EVT'),
    eventType,
    username,
    sourceIp,
    status,
    severity,
    file
  });
  
  await analyzeEventSequence(username, sourceIp);
  res.status(201).json(newEvent);
});

app.get('/api/security-events', async (req, res) => {
  const events = await SecurityEvent.findAll({ order: [['timestamp', 'DESC']] });
  res.json(events);
});

app.get('/api/alerts', async (req, res) => {
  const alerts = await Alert.findAll({ order: [['timestamp', 'DESC']] });
  res.json(alerts);
});

app.get('/api/alerts/:id', async (req, res) => {
  const alert = await Alert.findOne({ where: { alertId: req.params.id } });
  if (alert) res.json(alert);
  else res.status(404).json({ error: "Alert not found" });
});

app.get('/api/risk/:alertId', async (req, res) => {
  const alert = await Alert.findOne({ where: { alertId: req.params.alertId } });
  if (alert) {
    res.json({ alertId: alert.alertId, riskScore: alert.riskScore, riskLevel: alert.riskLevel, priority: alert.priority });
  } else {
    res.status(404).json({ error: "Risk data not found" });
  }
});

// Attack path mock (Will be implemented properly later)
app.get('/api/attack-path/:alertId', (req, res) => {
  res.json({
    observedStages: ["Repeated Login Failures"],
    predictedStages: ["Account Compromise", "Suspicious Data Access"],
    deviationDetected: false
  });
});

app.post('/api/response/:alertId/:action', async (req, res) => {
  const { alertId, action } = req.params;
  const alert = await Alert.findOne({ where: { alertId } });
  
  if (alert) {
    if (action === 'approve') {
      alert.status = "SIMULATED";
      await alert.save();
      
      const account = await User.findOne({ where: { username: 'demo_user' } });
      if (account) {
        account.status = 'TEMPORARILY_RESTRICTED';
        account.restrictionExpiresAt = new Date(Date.now() + 60000);
        await account.save();
      }
      
      await SecurityEvent.create({
        eventId: generateId('EVT'),
        eventType: "ACCOUNT_ACCESS_RESTRICTION",
        username: "demo_user",
        sourceIp: alert.sourceIp,
        status: "HUMAN_APPROVED",
        severity: "HIGH",
        analyzed: true,
        threatDetected: true
      });
      
    } else if (action === 'reject') {
      alert.status = "REJECTED";
      await alert.save();
    }
    res.json(alert);
  } else {
    res.status(404).json({ error: "Alert not found" });
  }
});

app.get('/api/stats', async (req, res) => {
  const totalEvents = await SecurityEvent.count();
  const detectedThreats = await Alert.count();
  const activeIncidents = await Alert.count({ where: { status: 'OPEN' } });
  
  res.json({
    totalEvents,
    detectedThreats,
    activeIncidents,
    critical: 0, high: detectedThreats, medium: 0, low: 0 // Mock counts for now
  });
});

app.post('/api/accounts/:username/restore', async (req, res) => {
  const { username } = req.params;
  const account = await User.findOne({ where: { username } });
  
  if (account) {
    account.status = 'ACTIVE';
    account.restrictionExpiresAt = null;
    account.blockedAt = null;
    account.firstSuspiciousActivityAt = null;
    account.suspiciousEventCount = 0;
    
    if (account.incidentId) {
      const alert = await Alert.findOne({ where: { alertId: account.incidentId } });
      if (alert) {
        alert.status = "RESOLVED";
        await alert.save();
      }
      account.incidentId = null;
    }
    await account.save();
    await AuditLog.create({ action: 'ACCOUNT_RESTORED', targetEntity: 'User', targetId: username });
    res.json({ message: "Account restored." });
  } else {
    res.status(404).json({ error: "Account not found" });
  }
});

app.get('/api/handlers/blocked-accounts', async (req, res) => {
  const blocked = await User.findAll({ where: { status: 'BLOCKED' } });
  res.json(blocked);
});

app.post('/api/demo/fast-forward', async (req, res) => {
  const account = await User.findOne({ where: { username: 'demo_user' } });
  if (account && account.firstSuspiciousActivityAt) {
    account.firstSuspiciousActivityAt = new Date(account.firstSuspiciousActivityAt.getTime() - (5 * 60000));
    await account.save();
    await enforceAccountState('demo_user');
    res.json({ message: "Time accelerated by 5 minutes." });
  } else {
    res.json({ message: "No active suspicious timeline to accelerate." });
  }
});

const PORT = 3001;
initDb().then(() => {
  app.listen(PORT, () => console.log(`Orbit AI Backend running on port ${PORT}`));
});
