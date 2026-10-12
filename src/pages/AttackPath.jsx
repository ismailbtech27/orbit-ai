import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Target, ActivitySquare, AlertTriangle, ArrowDown, Search, Crosshair } from 'lucide-react';

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
    
    // Auto-refresh for the demo
    const interval = setInterval(async () => {
      const data = await apiService.getAlerts();
      setAlerts(data);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAttackPath = async (alertId) => {
    setSelectedAlertId(alertId);
    const path = await apiService.getAttackPath(alertId);
    setAttackPath(path);
  };

  return (
    <div>
      <div className="flex-row justify-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>Attack Path & Behavioral Prediction</h2>
          <p className="text-muted">
            Visualize observed threat stages and AI-predicted adversary movements.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="badge badge-prediction" style={{ padding: '0.4rem 0.8rem' }}><Crosshair size={12} style={{ marginRight: '4px' }} /> PREDICTIVE ENGINE ACTIVE</span>
        </div>
      </div>

      <div className="flex-row" style={{ alignItems: 'flex-start', gap: '2rem' }}>
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Search size={18} color="var(--info-color)" />
              <h3 style={{ margin: 0 }}>Select Security Incident</h3>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <select 
              value={selectedAlertId}
              onChange={(e) => loadAttackPath(e.target.value)}
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
            >
              <option value="" disabled>-- Select an Incident Context --</option>
              {alerts.map(a => (
                <option key={a.alertId} value={a.alertId}>
                  {a.alertId} - {a.threatType} [{a.severity}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {attackPath && (
          <div className="card" style={{ flex: 2, padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <ActivitySquare size={20} color="var(--info-color)" />
                <h3 style={{ margin: 0 }}>Path Analysis Engine</h3>
            </div>
            
            {attackPath.deviationDetected && (
              <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'var(--medium-color)', borderRadius: '4px', borderLeft: '4px solid var(--medium-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <AlertTriangle size={24} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prediction Deviation Detected</strong>
                  <span style={{ fontSize: '0.9rem' }}>The adversary deviated from the initial predicted sequence. The AI engine has re-calibrated the attack path.</span>
                </div>
              </div>
            )}
            
            <div style={{ margin: '0 auto', maxWidth: '500px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {attackPath.observedStages.map((stage, i) => (
                  <div key={`obs-${i}`} style={{ width: '100%' }}>
                    <div className="path-node observed">
                       <div style={{ fontSize: '0.7rem', color: 'var(--critical-color)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 700 }}>OBSERVED BEHAVIOR</div>
                       {stage}
                    </div>
                    {/* Add arrow unless it's the last stage and there are no predictions */}
                    {(i < attackPath.observedStages.length - 1 || attackPath.predictedStages.length > 0) && (
                        <div className="path-arrow">
                           <ArrowDown size={24} />
                        </div>
                    )}
                  </div>
                ))}
                
                {attackPath.predictedStages.map((stage, i) => (
                  <div key={`pred-${i}`} style={{ width: '100%' }}>
                    <div className="path-node predicted">
                       <div style={{ fontSize: '0.7rem', color: 'var(--prediction-color)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 700 }}>PREDICTED NEXT MOVE</div>
                       {stage}
                    </div>
                    {/* Add arrow unless it's the last prediction stage */}
                    {i < attackPath.predictedStages.length - 1 && (
                        <div className="path-arrow">
                           <ArrowDown size={24} />
                        </div>
                    )}
                  </div>
                ))}

                {attackPath.predictedStages.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                      <Target size={32} color="var(--critical-color)" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
