import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

export default function AttackPath() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlertId, setSelectedAlertId] = useState('');
  const [attackPath, setAttackPath] = useState(null);

  useEffect(() => {
    async function loadAlerts() {
      const data = await apiService.getAlerts();
      setAlerts(data);
    }
    loadAlerts();
  }, []);

  const loadAttackPath = async (alertId) => {
    setSelectedAlertId(alertId);
    const path = await apiService.getAttackPath(alertId);
    setAttackPath(path);
  };

  return (
    <div>
      <h2>Attack Path / Prediction</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        Visualize observed attack stages and predict the attacker's next moves.
      </p>

      <div className="flex-row" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: 1 }}>
          <h3>Select Active Alert</h3>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <select 
              value={selectedAlertId}
              onChange={(e) => loadAttackPath(e.target.value)}
            >
              <option value="" disabled>-- Select an Alert --</option>
              {alerts.map(a => (
                <option key={a.alertId} value={a.alertId}>
                  {a.alertId} - {a.threatType}
                </option>
              ))}
            </select>
          </div>
        </div>

        {attackPath && (
          <div className="card" style={{ flex: 2 }}>
            <h3>Path Analysis</h3>
            
            {attackPath.deviationDetected && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fed7d7', color: '#c53030', borderRadius: '4px', borderLeft: '4px solid #c53030' }}>
                <strong>ATTACK PATH DEVIATION DETECTED</strong>
                <p style={{ margin: 0, marginTop: '0.5rem', fontSize: '0.9rem' }}>The attacker did not follow the original prediction. The event sequence has been re-analyzed and the prediction updated.</p>
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attackPath.observedStages.map((stage, i) => (
                  <div key={`obs-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#e2e8f0', borderRadius: '4px', flex: 1, borderLeft: '4px solid var(--secondary-color)' }}>
                      <strong>[ OBSERVED ]</strong> {stage}
                    </div>
                  </div>
                ))}
                
                {attackPath.predictedStages.map((stage, i) => (
                  <div key={`pred-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#fffaf0', borderRadius: '4px', flex: 1, borderLeft: '4px solid var(--high-color)' }}>
                      <strong style={{ color: 'var(--high-color)' }}>[ PREDICTED ]</strong> {stage}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Note: This is a prototype prediction simulation based on known attack patterns.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
