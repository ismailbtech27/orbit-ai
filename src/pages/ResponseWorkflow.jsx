import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

export default function ResponseWorkflow() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const data = await apiService.getAlerts();
      data.sort((a, b) => {
        if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
        if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (alertId, action) => {
    setProcessingId(alertId);
    try {
      if (action === 'approve') {
        await apiService.approveResponse(alertId);
      } else {
        await apiService.rejectResponse(alertId);
      }
      await loadAlerts();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && alerts.length === 0) return <div>Loading policies...</div>;

  return (
    <div>
      <h2>Policy-Guided Response Workflow</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        Review recommended actions and approve automated responses.
      </p>

      {alerts.map(alert => (
        <div key={alert.alertId} className="card" style={{ borderLeft: alert.status === 'SIMULATED' ? '4px solid var(--success-color)' : alert.status === 'REJECTED' ? '4px solid #c53030' : '4px solid var(--primary-color)' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>{alert.threatType}</h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Event ID: {alert.relatedEventId} | Source: {alert.sourceIp}</div>
            </div>
            <div>
              <span className={`badge ${alert.status === 'SIMULATED' ? 'badge-success' : alert.status === 'REJECTED' ? 'badge-critical' : 'badge-high'}`}>
                {alert.status}
              </span>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
            <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Policy Matched: </strong> 
                  {alert.severity === 'Critical' ? 'High-risk malicious activity' : 'Suspicious behavior threshold exceeded'}
                </div>
                <div>
                  <strong>Recommended Action: </strong> 
                  <span style={{ color: 'var(--critical-color)', fontWeight: 'bold' }}>{alert.recommendedAction}</span>
                </div>
              </div>
              
              <div>
                <button 
                  onClick={() => handleAction(alert.alertId, 'approve')}
                  disabled={alert.status !== 'OPEN' || processingId === alert.alertId}
                  style={{ 
                    backgroundColor: alert.status === 'SIMULATED' ? 'var(--success-color)' : 'var(--primary-color)',
                    marginRight: '1rem'
                  }}
                >
                  {processingId === alert.alertId ? 'Processing...' : 
                   alert.status === 'SIMULATED' ? 'Approved & Mitigated' : 'APPROVE & MITIGATE'}
                </button>
                <button 
                  onClick={() => handleAction(alert.alertId, 'reject')}
                  disabled={alert.status !== 'OPEN' || processingId === alert.alertId}
                  className="btn-secondary"
                  style={{
                    backgroundColor: alert.status === 'REJECTED' ? '#fed7d7' : undefined,
                    color: alert.status === 'REJECTED' ? '#c53030' : undefined
                  }}
                >
                  {alert.status === 'REJECTED' ? 'REJECTED' : 'REJECT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {alerts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No active alerts requiring response.
        </div>
      )}
    </div>
  );
}
