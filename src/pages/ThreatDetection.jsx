import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

export default function ThreatDetection() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadEvents() {
      const data = await apiService.getEvents();
      // Only show events that are not yet analyzed for the demo selection
      setEvents(data.filter(e => !e.analyzed));
    }
    loadEvents();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedEventId) return;
    
    setAnalyzing(true);
    setResult(null);
    
    try {
      const analyzedEvent = await apiService.analyzeEvent(selectedEventId);
      setResult(analyzedEvent);
      // Remove from the unanalyzed dropdown
      setEvents(events.filter(e => e.eventId !== selectedEventId));
      setSelectedEventId('');
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <h2>ML Threat Detection Workflow</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        Run sample security events through the ML detection model (simulated).
      </p>

      <div className="card" style={{ maxWidth: '600px' }}>
        <h3>Select Event for Analysis</h3>
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Unanalyzed Events</label>
          <div className="flex-row">
            <select 
              value={selectedEventId} 
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={analyzing}
            >
              <option value="">-- Select an event --</option>
              {events.map(e => (
                <option key={e.eventId} value={e.eventId}>
                  {e.eventId} - {e.eventType} ({e.sourceIp})
                </option>
              ))}
            </select>
            <button 
              onClick={handleAnalyze} 
              disabled={!selectedEventId || analyzing}
              style={{ whiteSpace: 'nowrap' }}
            >
              {analyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        </div>
      </div>

      {analyzing && (
        <div className="card" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Running feature extraction and model inference...</p>
          {/* Simple simulated progress bar via CSS animation could be added here, but text is fine */}
        </div>
      )}

      {result && (
        <div className="card" style={{ maxWidth: '600px', borderTop: result.threatDetected ? '4px solid var(--critical-color)' : '4px solid var(--success-color)' }}>
          <h3>Detection Result</h3>
          
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}><strong>Analyzed Event:</strong> {result.eventId}</div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Status:</strong>{' '}
              <span className={`badge ${result.threatDetected ? 'badge-critical' : 'badge-success'}`}>
                {result.threatDetected ? 'Threat Detected' : 'Benign'}
              </span>
            </div>
            
            {result.threatDetected && (
              <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ marginBottom: '0.5rem' }}><strong>Threat Type:</strong> {result.threatType}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong>Confidence:</strong> {result.confidence}%</div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Severity:</strong> <span className={`text-${result.severity.toLowerCase()}`}>{result.severity}</span>
                </div>
              </div>
            )}
            
            {!result.threatDetected && (
              <p style={{ marginTop: '1rem', color: 'var(--success-color)' }}>
                No malicious activity detected in this event.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
