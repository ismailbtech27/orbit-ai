import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sequelize, User, SecurityEvent, Alert, AuditLog } from './models/index.js';
import { calculateRisk } from './engines/riskEngine.js';
import { evaluateAction } from './engines/policyEngine.js';
import { getAgentRecommendation } from './engines/agentEngine.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Increased significantly for academic demo to prevent UI crash from constant polling
  message: { error: 'Too many requests from this IP.' }
});
app.use('/api', limiter);

const generateId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

async function initDb() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced.');

    await User.create({ username: 'demo_user', role: 'USER', status: 'ACTIVE' });
    await User.create({ username: 'soc_admin', role: 'ADMIN', status: 'ACTIVE' });
    await User.create({ username: 'SYSTEM', role: 'ADMIN', status: 'ACTIVE' });
    console.log('Demo users seeded.');
    
    await SecurityEvent.create({
      eventId: generateId('EVT'),
      eventType: "SYSTEM_START",
      username: "SYSTEM",
      sourceIp: "127.0.0.1",
      status: "SUCCESS",
      severity: "LOW",
      analyzed: true,
      threatDetected: false
    });
  } catch (err) {
    console.error('Failed to sync DB:', err);
  }
}

// Simulated RBAC Middleware (usually uses JWT, but simplified for prototype)
const requireAdmin = async (req, res, next) => {
  const username = req.headers['x-user-role'];
  if (username === 'ADMIN' || username === 'SOC_ANALYST') {
    next();
  } else {
    res.status(403).json({ error: "Unauthorized: Requires ADMIN or SOC_ANALYST role." });
  }
};

const enforceAccountState = async (username) => {
  const account = await User.findOne({ where: { username } });
  if (!account) return;

  const now = new Date();

  if (account.status === 'TEMPORARILY_RESTRICTED' && account.restrictionExpiresAt && now > account.restrictionExpiresAt) {
    account.status = 'MONITORING';
    account.restrictionExpiresAt = null;
    await account.save();
    await AuditLog.create({
      action: 'COOLDOWN_EXPIRED', targetEntity: 'User', targetId: username, details: 'User restriction expired, status set to MONITORING.'
    });
  }

  // Auto-block logic if suspicious activity continues
  if (account.firstSuspiciousActivityAt && account.status !== 'BLOCKED' && account.status !== 'TEMPORARILY_RESTRICTED') {
    const elapsedMinutes = (now - account.firstSuspiciousActivityAt) / 60000;
    if (elapsedMinutes >= 5 && account.suspiciousEventCount >= 10) {
      account.status = 'BLOCKED';
      account.blockedAt = now;
      await account.save();
      await AuditLog.create({
        action: 'ACCOUNT_BLOCKED', targetEntity: 'User', targetId: username, details: 'Escalation condition reached.'
      });
    }
  }
};

const performAttackPathPrediction = (eventSequence) => {
  // Deterministic Fallback Logic
  const sequenceStr = eventSequence.map(e => e.eventType).join('->');
  
  let threatType = "Suspicious Activity";
  let isThreat = false;
  let severity = "LOW";
  let confidence = 50;
  let currentStage = "Monitoring";
  let predictedStage = "Monitoring";
  let observedPath = ["Normal Activity"];
  let predictedPath = ["None"];

  const failedLogins = eventSequence.filter(e => e.eventType === 'LOGIN_FAILED').length;
  
  if (sequenceStr.includes("UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT")) {
    isThreat = true;
    threatType = "Unauthorized Privileged Access Attempt";
    severity = "CRITICAL";
    confidence = 95;
    currentStage = "Admin Access Attempt";
    predictedStage = "Privilege Escalation";
    observedPath = ["Authentication Anomaly", "Admin Access Attempt"];
    predictedPath = ["Privilege Escalation", "Administrative Resource Access"];
  }
  else if (sequenceStr.includes("LOGIN_FAILED") && sequenceStr.includes("LOGIN_SUCCESS") && sequenceStr.includes("SENSITIVE_FILE_ACCESS")) {
    isThreat = true;
    threatType = "Suspicious Account Activity";
    severity = "HIGH";
    confidence = 88;
    currentStage = "Sensitive Data Access";
    predictedStage = "Data Collection";
    observedPath = ["Authentication Anomaly", "Account Access", "Sensitive Data Access"];
    predictedPath = ["Further Data Collection", "Possible Exfiltration"];
  } 
  else if (sequenceStr.includes("LOGIN_FAILED") && failedLogins >= 3 && !sequenceStr.includes("LOGIN_SUCCESS")) {
    isThreat = true;
    threatType = "Repeated Authentication Failures";
    severity = "MEDIUM";
    confidence = 75;
    currentStage = "Authentication Anomaly";
    predictedStage = "Account Compromise";
    observedPath = ["Repeated Authentication Failures"];
    predictedPath = ["Account Compromise", "Resource Access"];
  } 

  return { isThreat, threatType, severity, confidence, currentStage, predictedStage, observedPath, predictedPath, engine: 'fallback' };
};

const analyzeEventSequence = async (username, sourceIp) => {
  const account = await User.findOne({ where: { username } });
  if (!account) return;

  const recentEvents = await SecurityEvent.findAll({
    where: { username },
    order: [['timestamp', 'DESC']],
    limit: 15
  });
  
  // Reverse to get chronological order for prediction
  const eventSequence = recentEvents.reverse(); 
  
  let prediction;
  let deviation = false;

  try {
    // Attempt to call the Python ML Engine
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const mlResponse = await fetch('http://localhost:8000/predict_sequence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventSequence }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!mlResponse.ok) throw new Error('ML Engine returned non-200');
    
    const mlData = await mlResponse.json();
    
    // Convert ML response to internal prediction format
    prediction = {
      isThreat: mlData.is_threat,
      threatType: mlData.threat_type,
      severity: mlData.severity,
      confidence: mlData.confidence,
      currentStage: mlData.current_stage,
      predictedStage: mlData.predicted_stage,
      observedPath: eventSequence.map(e => e.eventType),
      predictedPath: [mlData.predicted_stage], // Basic mapping for the UI
      engine: 'ml'
    };
  } catch (error) {
    // If ML is unavailable, use Deterministic Fallback
    prediction = performAttackPathPrediction(eventSequence);
  }
  
  const latestEvent = eventSequence[eventSequence.length - 1];
  
  if (latestEvent) {
    latestEvent.analyzed = true;
    latestEvent.threatDetected = prediction.isThreat;
    await latestEvent.save();
  }

  if (prediction.isThreat) {
    let alert = await Alert.findOne({ where: { sourceIp, status: "OPEN" } });
    
    // Path Deviation Logic
    if (alert && alert.predictedStage && alert.predictedStage !== prediction.currentStage && alert.predictedStage !== prediction.predictedStage) {
       deviation = true;
    }
    
    const riskResult = calculateRisk(prediction.severity, prediction.confidence, "HIGH");

    if (!alert) {
      const alertId = generateId('ALT');
      
      const validActions = ['LOG_ONLY', 'INVESTIGATE', 'RESTRICT_ACCOUNT', 'BLOCK_ACCOUNT', 'ISOLATE_ASSET'];
      const agentRecommendation = await getAgentRecommendation(
        { threatType: prediction.threatType, severity: prediction.severity, sourceIp, mlConfidence: prediction.confidence },
        riskResult,
        validActions
      );
      
      const policyResult = evaluateAction(agentRecommendation.recommendedAction, riskResult.score, riskResult.level, "HIGH");

      alert = await Alert.create({
        alertId,
        threatType: prediction.threatType,
        relatedEventId: latestEvent ? latestEvent.eventId : null,
        severity: prediction.severity,
        sourceIp,
        mlConfidence: prediction.confidence,
        status: "OPEN",
        agentRecommendedAction: agentRecommendation.recommendedAction,
        agentReasoning: agentRecommendation.reasoning,
        policyDecision: policyResult.decision,
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        priority: riskResult.level === 'CRITICAL' ? 'P1' : 'P2',
        currentStage: prediction.currentStage,
        predictedStage: prediction.predictedStage,
        observedPath: JSON.stringify(prediction.observedPath),
        predictedPath: JSON.stringify(prediction.predictedPath),
        pathDeviationDetected: deviation
      });

      account.status = account.status === 'ACTIVE' ? 'SUSPICIOUS' : account.status;
      account.firstSuspiciousActivityAt = account.firstSuspiciousActivityAt || new Date();
      account.incidentId = alertId;
    } else {
      // Update existing alert with new prediction
      alert.threatType = prediction.threatType;
      alert.currentStage = prediction.currentStage;
      alert.predictedStage = prediction.predictedStage;
      alert.observedPath = JSON.stringify(prediction.observedPath);
      alert.predictedPath = JSON.stringify(prediction.predictedPath);
      alert.pathDeviationDetected = alert.pathDeviationDetected || deviation;
      alert.riskScore = Math.min(100, alert.riskScore + 5); // Risk compounds
      if (alert.riskScore >= 80) alert.riskLevel = 'CRITICAL';
      alert.mlConfidence = prediction.confidence; // Update confidence
      await alert.save();
    }
    
    account.suspiciousEventCount += 1;
    await account.save();
  }
};
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

app.get('/api/engine-status', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const mlResponse = await fetch('http://localhost:8000/health', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (mlResponse.ok) {
       return res.json({ predictiveEngine: 'ACTIVE', mlEngine: 'ACTIVE', riskEngine: 'ACTIVE', database: 'CONNECTED', api: 'HEALTHY' });
    }
    throw new Error('ML Engine not OK');
  } catch (error) {
    return res.json({ predictiveEngine: 'ACTIVE', mlEngine: 'FALLBACK', riskEngine: 'ACTIVE', database: 'CONNECTED', api: 'HEALTHY' });
  }
});

app.post('/api/security-events', async (req, res) => {
  const { eventType, username, sourceIp, status, severity, file, resourceClassification } = req.body;
  
  await enforceAccountState(username);
  let account = await User.findOne({ where: { username } });
  
  if (!account) {
    account = await User.create({ username, status: 'ACTIVE', role: 'USER' });
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
    file,
    resourceClassification
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

app.post('/api/response/:alertId/:action', requireAdmin, async (req, res) => {
  const { alertId, action } = req.params;
  const alert = await Alert.findOne({ where: { alertId } });
  
  if (alert) {
    const handler = req.headers['x-username'] || 'SOC_ADMIN';
    if (action === 'approve') {
      alert.status = "APPROVED";
      await alert.save();
      
      const account = await User.findOne({ where: { incidentId: alertId } });
      if (account) {
        account.status = 'BLOCKED';
        account.blockedAt = new Date();
        account.restrictionExpiresAt = null; // Clear any temporary holds
        await AuditLog.create({ action: 'ACCOUNT_BLOCKED', targetEntity: 'User', targetId: account.username, performedBy: handler, details: `Incident ${alertId} mitigation approved. Manual restoration required.` });
        await account.save();
      }
      
      await SecurityEvent.create({
        eventId: generateId('EVT'),
        eventType: "MITIGATION_APPLIED",
        username: account ? account.username : "SYSTEM",
        sourceIp: alert.sourceIp,
        status: "SUCCESS",
        severity: "INFO",
        analyzed: true,
        threatDetected: false
      });
      
    } else if (action === 'reject') {
      alert.status = "REJECTED";
      await alert.save();
      await AuditLog.create({ action: 'MITIGATION_REJECTED', targetEntity: 'Alert', targetId: alertId, performedBy: handler });
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
  const critical = await Alert.count({ where: { riskLevel: 'CRITICAL' } });
  
  res.json({
    totalEvents,
    detectedThreats,
    activeIncidents,
    critical, high: detectedThreats - critical, medium: 0, low: 0 
  });
});

app.post('/api/accounts/:username/restore', requireAdmin, async (req, res) => {
  const { username } = req.params;
  const account = await User.findOne({ where: { username } });
  const handler = req.headers['x-username'] || 'SOC_ADMIN';
  
  if (account) {
    account.status = 'RESTORED';
    account.restrictionExpiresAt = null;
    account.blockedAt = null;
    account.firstSuspiciousActivityAt = null;
    account.suspiciousEventCount = 0;
    account.handler = handler;
    account.handlerRestoredAt = new Date();
    
    if (account.incidentId) {
      const alert = await Alert.findOne({ where: { alertId: account.incidentId } });
      if (alert) {
        alert.status = "RESOLVED";
        await alert.save();
      }
      account.incidentId = null;
    }
    await account.save();
    
    // Switch state to ACTIVE next so RESTORED acts as a bridge state for UI occasionally, but active is safer.
    account.status = 'ACTIVE';
    await account.save();
    
    await AuditLog.create({ action: 'ACCOUNT_RESTORED', targetEntity: 'User', targetId: username, performedBy: handler });
    res.json({ message: "Account restored." });
  } else {
    res.status(404).json({ error: "Account not found" });
  }
});

app.get('/api/handlers/blocked-accounts', requireAdmin, async (req, res) => {
  const blocked = await User.findAll({ where: { status: 'BLOCKED' } });
  res.json(blocked);
});

app.get('/api/audit-logs', requireAdmin, async (req, res) => {
  const logs = await AuditLog.findAll({ order: [['timestamp', 'DESC']] });
  res.json(logs);
});

const PORT = 3001;
initDb().then(() => {
  app.listen(PORT, () => console.log(`Orbit AI Backend running on port ${PORT}`));
});
