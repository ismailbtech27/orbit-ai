import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await apiService.getAlerts();
        // Sort by most critical severity first, then by timestamp
        const severityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        
        data.sort((a, b) => {
          if (severityWeight[b.severity] !== severityWeight[a.severity]) {
            return severityWeight[b.severity] - severityWeight[a.severity];
          }
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        setAlerts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  if (loading) return <div>Loading alerts...</div>;

  return (
    <div>
      <h2>Threat Alert Generation</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        Active security alerts prioritized by severity.
      </p>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Timestamp</th>
              <th>Threat Type</th>
              <th>Source</th>
              <th>Confidence</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, index) => (
              <tr key={alert.alertId}>
                <td>{alert.alertId}</td>
                <td>{new Date(alert.timestamp).toLocaleString()}</td>
                <td>{alert.threatType}</td>
                <td>{alert.sourceIp}</td>
                <td>{alert.confidence}%</td>
                <td>
                  <span className={`badge badge-${alert.severity.toLowerCase()}`}>
                    {alert.severity}
                  </span>
                </td>
                <td>{alert.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No active alerts at this time.
          </div>
        )}
      </div>
    </div>
  );
}
