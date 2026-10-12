import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Shield, ShieldCheck, ShieldAlert, Cpu, CheckCircle, XCircle } from 'lucide-react';

export default function ResponseWorkflow() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadAlerts() {
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

  if (loading && alerts.length === 0) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading AI recommendations...</div>;

  return (
    <div>
      <div className="flex-row justify-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>Agentic Response Workflow</h2>
          <p className="text-muted">
            Review AI-recommended mitigation strategies and approve automated responses.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="badge badge-prediction" style={{ padding: '0.4rem 0.8rem' }}><Cpu size={12} style={{ marginRight: '4px' }} /> AGENT ENGINE ACTIVE</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {alerts.map(alert => (
          <div key={alert.alertId} className="card" style={{ borderLeft: alert.status === 'SIMULATED' ? '4px solid var(--success-color)' : alert.status === 'REJECTED' ? '4px solid var(--critical-color)' : '4px solid var(--primary-color)' }}>
            <div className="flex-row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   {alert.status === 'SIMULATED' ? <ShieldCheck size={18} color="var(--success-color)"/> : alert.status === 'REJECTED' ? <ShieldAlert size={18} color="var(--critical-color)"/> : <Shield size={18} color="var(--info-color)"/>}
                   {alert.threatType}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Event Reference: <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{alert.relatedEventId}</span> | Entity: <span style={{ fontFamily: 'monospace', color: 'var(--info-color)' }}>{alert.sourceIp}</span></div>
              </div>
              <div>
                <span className={`badge ${alert.status === 'SIMULATED' ? 'badge-success' : alert.status === 'REJECTED' ? 'badge-critical' : 'badge-high'}`}>
                  {alert.status}
                </span>
              </div>
            </div>
            
            <div style={{ padding: '1.25rem', backgroundColor: 'rgba(139, 92, 246, 0.05)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div className="flex-row justify-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '2rem' }}>
                  <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cpu size={16} color="var(--prediction-color)" />
                    <strong style={{ color: 'var(--prediction-color)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Agentic Reasoning</strong> 
                  </div>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                    {alert.reasoning || 'System identified a sequence of events matching known malicious patterns. Automated mitigation is recommended to prevent further lateral movement.'}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Recommended Action: </strong> 
                    <span className="badge badge-high" style={{ border: 'none', backgroundColor: 'var(--high-color)', color: 'white' }}>{alert.recommendedAction}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '200px' }}>
                  <button 
                    onClick={() => handleAction(alert.alertId, 'approve')}
                    disabled={alert.status !== 'OPEN' || processingId === alert.alertId}
                    style={{ 
                      backgroundColor: alert.status === 'SIMULATED' ? 'var(--success-color)' : 'var(--info-color)',
                      width: '100%'
                    }}
                  >
                    {processingId === alert.alertId ? 'Processing...' : 
                     alert.status === 'SIMULATED' ? <><CheckCircle size={16} /> Approved & Mitigated</> : <><CheckCircle size={16} /> Approve & Mitigate</>}
                  </button>
                  <button 
                    onClick={() => handleAction(alert.alertId, 'reject')}
                    disabled={alert.status !== 'OPEN' || processingId === alert.alertId}
                    className="btn-secondary"
                    style={{
                      backgroundColor: alert.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : undefined,
                      color: alert.status === 'REJECTED' ? 'var(--critical-color)' : undefined,
                      borderColor: alert.status === 'REJECTED' ? 'var(--critical-color)' : undefined,
                      width: '100%'
                    }}
                  >
                    {alert.status === 'REJECTED' ? <><XCircle size={16} /> Rejected</> : <><XCircle size={16} /> Reject</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Shield size={48} opacity={0.2} />
          <div>No active incidents requiring manual SOC intervention.</div>
        </div>
      )}
    </div>
  );
}
