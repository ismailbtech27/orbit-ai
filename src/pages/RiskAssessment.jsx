import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { ShieldAlert, BarChart2, Search, Target, AlertCircle } from 'lucide-react';

export default function RiskAssessment() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    async function loadAlerts() {
      const data = await apiService.getAlerts();
      setAlerts(data);
    }
    loadAlerts();
    
    const interval = setInterval(async () => {
      const data = await apiService.getAlerts();
      setAlerts(data);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getRiskLevel = (score) => {
    if (score >= 80) return { level: 'Critical', color: 'var(--critical-color)', bg: 'rgba(239, 68, 68, 0.1)' };
    if (score >= 60) return { level: 'High', color: 'var(--high-color)', bg: 'rgba(249, 115, 22, 0.1)' };
    if (score >= 40) return { level: 'Medium', color: 'var(--medium-color)', bg: 'rgba(234, 179, 8, 0.1)' };
    return { level: 'Low', color: 'var(--low-color)', bg: 'rgba(59, 130, 246, 0.1)' };
  };

  return (
    <div>
      <div className="flex-row justify-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>Risk Assessment & Quantification</h2>
          <p className="text-muted">
            Evaluate the potential impact and calculated risk score of detected threat vectors.
          </p>
        </div>
      </div>

      <div className="flex-row" style={{ alignItems: 'flex-start', gap: '2rem' }}>
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Search size={18} color="var(--info-color)" />
              <h3 style={{ margin: 0 }}>Select Threat Vector</h3>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <select 
              onChange={async (e) => {
                const alertId = e.target.value;
                const alert = alerts.find(a => a.alertId === alertId);
                
                // Fetch risk details from the backend
                const riskData = await apiService.getRiskAssessment(alertId);
                if (riskData && alert) {
                  setSelectedAlert({ ...alert, ...riskData });
                }
              }}
              defaultValue=""
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
            >
              <option value="" disabled>-- Select a detected threat --</option>
              {alerts.map(a => (
                <option key={a.alertId} value={a.alertId}>
                  {a.threatType} ({a.sourceIp})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedAlert && (
          <div className="card" style={{ flex: 2, padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <BarChart2 size={20} color="var(--info-color)" />
                <h3 style={{ margin: 0 }}>Assessment Report: <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{selectedAlert.alertId}</span></h3>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <div className="grid-cards" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                <div style={{ padding: '1.5rem', background: getRiskLevel(selectedAlert.riskScore).bg, borderRadius: '6px', textAlign: 'center', border: `1px solid ${getRiskLevel(selectedAlert.riskScore).color}` }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Calculated Risk Score</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '700', color: getRiskLevel(selectedAlert.riskScore).color }}>
                    {selectedAlert.riskScore}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
                  </div>
                </div>
                <div style={{ padding: '1.5rem', background: getRiskLevel(selectedAlert.riskScore).bg, borderRadius: '6px', textAlign: 'center', border: `1px solid ${getRiskLevel(selectedAlert.riskScore).color}` }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aggregate Risk Level</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: getRiskLevel(selectedAlert.riskScore).color, marginTop: '0.5rem' }}>
                    {selectedAlert.riskLevel}
                  </div>
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={16} color="var(--text-muted)" /> Calculation Factors</h4>
              <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                  <table>
                    <tbody>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Initial Threat Severity</td>
                        <td style={{ fontWeight: 500 }}>{selectedAlert.severity}</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Event Sequence Correlation</td>
                        <td style={{ fontWeight: 500 }}>Verified Pattern (Deterministic)</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Potential Business Impact</td>
                        <td style={{ fontWeight: 500 }}>{selectedAlert.severity === 'Critical' || selectedAlert.severity === 'HIGH' ? 'System Compromise & Privilege Escalation' : 'Data Exposure / Service Disruption'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Target Asset Classification</td>
                        <td style={{ fontWeight: 500 }}>{selectedAlert.severity === 'Critical' ? 'Administrative Interface (Tier 0)' : 'Production Endpoint (Tier 2)'}</td>
                      </tr>
                    </tbody>
                  </table>
              </div>

              <div style={{ padding: '1rem', borderRadius: '4px', borderLeft: `4px solid ${getRiskLevel(selectedAlert.riskScore).color}`, backgroundColor: 'var(--panel-bg)', borderTop: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={20} color={getRiskLevel(selectedAlert.riskScore).color} />
                <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Analyst Priority</strong>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedAlert.priority === 'P1' || selectedAlert.riskScore >= 80 ? 'Immediate Review Required (P1)' : 'Standard Queue (P2)'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
