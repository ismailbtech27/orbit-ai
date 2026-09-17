import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const dashboardStats = await apiService.getDashboardStats();
        setStats(dashboardStats);
        
        const events = await apiService.getEvents();
        // Just take the first 5 for recent events
        setRecentEvents(events.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboard();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>Security Monitoring Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            System Overview and Real-time Threat Statistics
          </p>
        </div>
        <div>
          <button 
            className="btn-secondary" 
            onClick={async () => {
              await fetch('/api/demo/fast-forward', { method: 'POST' });
              alert('Time accelerated by 5 minutes. Refresh to see escalated blocks.');
            }}
            style={{ fontSize: '0.85rem', border: '1px solid #dd6b20', color: '#dd6b20' }}
          >
            [DEMO] Fast-Forward 5 Minutes
          </button>
        </div>
      </div>

      <div className="grid-cards">
        <div className="card stat-card" style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3>Total Events</h3>
          <div className="value">{stats.totalEvents}</div>
        </div>
        <div className="card stat-card" style={{ borderTop: '4px solid var(--critical-color)' }}>
          <h3>Detected Threats</h3>
          <div className="value" style={{ color: 'var(--critical-color)' }}>{stats.detectedThreats}</div>
        </div>
        <div className="card stat-card" style={{ borderTop: '4px solid var(--high-color)' }}>
          <h3>Active Incidents</h3>
          <div className="value" style={{ color: 'var(--high-color)' }}>{stats.activeIncidents}</div>
        </div>
      </div>

      <div className="grid-cards">
        <div className="card stat-card">
          <h3>Critical Threats</h3>
          <div className="value text-critical">{stats.critical}</div>
        </div>
        <div className="card stat-card">
          <h3>High Risk</h3>
          <div className="value text-high">{stats.high}</div>
        </div>
        <div className="card stat-card">
          <h3>Medium Risk</h3>
          <div className="value text-medium">{stats.medium}</div>
        </div>
        <div className="card stat-card">
          <h3>Low Risk</h3>
          <div className="value" style={{ color: 'var(--low-color)' }}>{stats.low}</div>
        </div>
      </div>

      <div className="card">
        <h3>Recent Security Events</h3>
        <table style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Timestamp</th>
              <th>Source IP</th>
              <th>Event Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentEvents.map(event => (
              <tr key={event.eventId}>
                <td>{event.eventId}</td>
                <td>{new Date(event.timestamp).toLocaleString()}</td>
                <td>{event.sourceIp}</td>
                <td>{event.eventType}</td>
                <td>
                  <span className={`badge ${event.threatDetected ? 'badge-critical' : 'badge-neutral'}`}>
                    {event.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
