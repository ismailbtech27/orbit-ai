import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { List, Filter, Search } from 'lucide-react';

export default function SecurityEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await apiService.getEvents();
        setEvents(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
    
    const interval = setInterval(async () => {
      const data = await apiService.getEvents();
      setEvents(data);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(e => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = e.eventId.toLowerCase().includes(term) ||
                          e.sourceIp.includes(term) ||
                          e.eventType.toLowerCase().includes(term) ||
                          (e.username && e.username.toLowerCase().includes(term));
    const matchesType = filterType === 'All' || e.eventType === filterType;
    const matchesStatus = filterStatus === 'All' || e.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const eventTypes = ['All', ...new Set(events.map(e => e.eventType))];
  const eventStatuses = ['All', ...new Set(events.map(e => e.status))];

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading security event telemetry...</div>;

  return (
    <div>
      <div className="flex-row justify-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>Security Event Telemetry</h2>
          <p className="text-muted">
            Raw event logs collected from distributed system sensors.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <div className="flex-row" style={{ gap: '1.5rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Search size={14}/> Search Log Data</label>
              <input 
                type="text" 
                placeholder="ID, IP, User, Type..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Filter size={14}/> Event Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Filter size={14}/> Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                {eventStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event ID</th>
                  <th>Entity / IP</th>
                  <th>User</th>
                  <th>Event Type</th>
                  <th>Target Resource</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => (
                  <tr key={event.eventId}>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(event.timestamp).toLocaleString()}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{event.eventId.substring(0, 8)}...</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--info-color)' }}>{event.sourceIp}</td>
                    <td style={{ fontWeight: 500 }}>{event.username || 'System'}</td>
                    <td>{event.eventType}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{event.details?.file || event.details?.endpoint || 'N/A'}</td>
                    <td>
                      <span className={`badge ${event.status === 'FAILED' ? 'badge-high' : event.status === 'SUCCESS' ? 'badge-success' : 'badge-neutral'}`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        {filteredEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <List size={48} opacity={0.2} />
            <div>No events found matching your filter criteria.</div>
          </div>
        )}
      </div>
    </div>
  );
}
