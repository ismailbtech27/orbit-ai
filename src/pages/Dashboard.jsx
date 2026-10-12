import { useEffect, useState } from 'react';
import { Activity, ShieldAlert, AlertTriangle, Shield, Clock, Search, Server } from 'lucide-react';
import { apiService } from '../services/apiService';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [engineStatus, setEngineStatus] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const dashboardStats = await apiService.getDashboardStats();
        setStats(dashboardStats);
        
        try {
          const status = await fetch('/api/engine-status').then(r => r.json());
          setEngineStatus(status);
        } catch (e) {
          console.error("Engine status fetch failed", e);
        }
        
        const events = await apiService.getEvents();
        setRecentEvents(events.slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboard();
    
    // Auto-refresh every 5 seconds for the demo
    const interval = setInterval(loadDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Activity className="lucide-spin" style={{ animation: 'spin 2s linear infinite' }} /> Loading Security Telemetry...</div>;

  return (
    <div>
      <div className="flex-row justify-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>Security Operations Center</h2>
          <p className="text-muted">
            Real-time Threat Telemetry and System Overview
          </p>
        </div>
        <div>
          <button 
            className="btn-secondary" 
            onClick={async () => {
              await fetch('/api/demo/fast-forward', { method: 'POST' });
              alert('Time accelerated by 5 minutes. Refreshing data...');
            }}
            style={{ fontSize: '0.85rem', borderColor: 'var(--medium-color)', color: 'var(--medium-color)' }}
          >
            <Clock size={16} /> Fast-Forward 5 Min
          </button>
        </div>
      </div>

      <div className="grid-cards">
        <div className="card stat-card info">
          <div className="flex-row justify-between">
             <h3>Total Events</h3>
             <Server size={20} color="var(--info-color)" />
          </div>
          <div className="value">{stats?.totalEvents || 0}</div>
        </div>
        <div className="card stat-card critical">
          <div className="flex-row justify-between">
             <h3>Detected Threats</h3>
             <AlertTriangle size={20} color="var(--critical-color)" />
          </div>
          <div className="value text-critical">{stats?.detectedThreats || 0}</div>
        </div>
        <div className="card stat-card high">
          <div className="flex-row justify-between">
             <h3>Active Incidents</h3>
             <ShieldAlert size={20} color="var(--high-color)" />
          </div>
          <div className="value text-high">{stats?.activeIncidents || 0}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Engine Health & Diagnostics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Predictive Engine</div>
            <div style={{ fontWeight: 600, color: engineStatus?.predictiveEngine === 'ACTIVE' ? 'var(--success-color)' : 'var(--text-main)' }}>{engineStatus?.predictiveEngine || 'UNKNOWN'}</div>
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>ML Engine</div>
            <div style={{ fontWeight: 600, color: engineStatus?.mlEngine === 'ACTIVE' ? 'var(--success-color)' : engineStatus?.mlEngine === 'FALLBACK' ? 'var(--medium-color)' : 'var(--critical-color)' }}>
              {engineStatus?.mlEngine || 'UNAVAILABLE'}
            </div>
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Risk Engine</div>
            <div style={{ fontWeight: 600, color: engineStatus?.riskEngine === 'ACTIVE' ? 'var(--success-color)' : 'var(--text-main)' }}>{engineStatus?.riskEngine || 'UNKNOWN'}</div>
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Database</div>
            <div style={{ fontWeight: 600, color: engineStatus?.database === 'CONNECTED' ? 'var(--info-color)' : 'var(--text-main)' }}>{engineStatus?.database || 'DISCONNECTED'}</div>
          </div>
          
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Search size={18} color="var(--text-muted)" />
             <h3 style={{ margin: 0 }}>Recent Telemetry</h3>
         </div>
         <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source IP</th>
                  <th>User</th>
                  <th>Event Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No recent events recorded in the system.</td></tr>
                ) : (
                    recentEvents.map(event => (
                      <tr key={event.eventId}>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(event.timestamp).toLocaleTimeString()}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--info-color)' }}>{event.sourceIp}</td>
                        <td style={{ fontWeight: 500 }}>{event.username}</td>
                        <td>{event.eventType}</td>
                        <td>
                          <span className={`badge ${event.threatDetected ? 'badge-critical' : 'badge-neutral'}`}>
                            {event.status}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
