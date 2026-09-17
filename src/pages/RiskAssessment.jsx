import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

export default function RiskAssessment() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    async function loadAlerts() {
      const data = await apiService.getAlerts();
      setAlerts(data);
    }
    loadAlerts();
  }, []);

  const getRiskLevel = (score) => {
    if (score >= 80) return { level: 'Critical', color: 'var(--critical-color)' };
    if (score >= 60) return { level: 'High', color: 'var(--high-color)' };
    if (score >= 40) return { level: 'Medium', color: 'var(--medium-color)' };
    return { level: 'Low', color: 'var(--low-color)' };
  };

  return (
    <div>
      <h2>Risk Assessment</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        Evaluate the potential impact and calculated risk score of detected threats.
      </p>

      <div className="flex-row" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: 1 }}>
          <h3>Select Threat for Assessment</h3>
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
          <div className="card" style={{ flex: 2 }}>
            <h3>Assessment Report: {selectedAlert.alertId}</h3>
            <div style={{ marginTop: '1.5rem' }}>
              <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Risk Score</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getRiskLevel(selectedAlert.riskScore).color }}>
                    {selectedAlert.riskScore}/100
                  </div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Risk Level</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getRiskLevel(selectedAlert.riskScore).color }}>
                    {selectedAlert.riskLevel}
                  </div>
                </div>
              </div>

              <h4>Calculation Factors (Prototype Demo)</h4>
              <table style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                <tbody>
                  <tr>
                    <td>Threat Severity</td>
                    <td>{selectedAlert.severity}</td>
                  </tr>
                  <tr>
                    <td>Detection Confidence</td>
                    <td>{selectedAlert.confidence}%</td>
                  </tr>
                  <tr>
                    <td>Potential Impact</td>
                    <td>{selectedAlert.severity === 'Critical' || selectedAlert.severity === 'HIGH' ? 'System Compromise' : 'Data Exposure / Service Disruption'}</td>
                  </tr>
                  <tr>
                    <td>Target asset</td>
                    <td>Authentication Service (10.0.0.50:443)</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ padding: '1rem', borderLeft: `4px solid ${getRiskLevel(selectedAlert.riskScore).color}`, backgroundColor: '#fffaf0' }}>
                <strong>Priority:</strong> {selectedAlert.priority === 'P1' ? 'Immediate Review Required' : 'Standard Queue'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
