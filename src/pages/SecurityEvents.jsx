import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

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
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.eventId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.sourceIp.includes(searchTerm) ||
                          e.eventType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || e.eventType === filterType;
    const matchesStatus = filterStatus === 'All' || e.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const eventTypes = ['All', ...new Set(events.map(e => e.eventType))];
  const eventStatuses = ['All', ...new Set(events.map(e => e.status))];

  if (loading) return <div>Loading events...</div>;

  return (
    <div>
      <h2>Security Event Collection</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        View and filter raw security events collected from network sources.
      </p>

      <div className="card">
        <div className="filters-bar">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search (ID, IP, Type)</label>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Event Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {eventStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event ID</th>
              <th>Source IP</th>
              <th>Dest IP</th>
              <th>Event Type</th>
              <th>Protocol</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(event => (
              <tr key={event.eventId}>
                <td>{new Date(event.timestamp).toLocaleString()}</td>
                <td>{event.eventId}</td>
                <td>{event.sourceIp}:{event.sourcePort}</td>
                <td>{event.destIp}:{event.destPort}</td>
                <td>{event.eventType}</td>
                <td>{event.protocol}</td>
                <td>
                  <span className={`badge ${event.status.includes('Alert') ? 'badge-high' : 'badge-neutral'}`}>
                    {event.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No events found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
