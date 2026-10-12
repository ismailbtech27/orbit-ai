import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Target, Search, Activity, Cpu, ShieldAlert, ShieldCheck } from 'lucide-react';

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
      <div className="flex-row justify-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>ML Threat Detection Pipeline</h2>
          <p className="text-muted">
            Execute manual anomaly detection on unclassified security events.
          </p>
        </div>
      </div>

      <div className="flex-row" style={{ alignItems: 'flex-start', gap: '2rem' }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Search size={18} color="var(--info-color)" />
                <h3 style={{ margin: 0 }}>Select Telemetry for Inspection</h3>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Unanalyzed Events Queue</label>
              <div className="flex-col">
                <select 
                  value={selectedEventId} 
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  disabled={analyzing}
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                >
                  <option value="">-- Select an event --</option>
                  {events.map(e => (
                    <option key={e.eventId} value={e.eventId}>
                      {e.eventId.substring(0, 8)}... - {e.eventType} ({e.sourceIp})
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleAnalyze} 
                  disabled={!selectedEventId || analyzing}
                  style={{ width: '100%', padding: '0.75rem', display: 'flex', justifyContent: 'center' }}
                >
                  {analyzing ? <><Activity size={16} className="lucide-spin" style={{ animation: 'spin 2s linear infinite' }} /> Processing Pipeline...</> : <><Cpu size={16} /> Execute ML Pipeline</>}
                </button>
              </div>
            </div>
          </div>

          <div style={{ flex: 1.5 }}>
            {analyzing && (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Activity size={32} color="var(--info-color)" className="lucide-spin" style={{ animation: 'spin 2s linear infinite', marginBottom: '1rem' }} />
                <div style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Extracting features & running inference...</div>
              </div>
            )}

            {result && (
              <div className="card" style={{ borderTop: result.threatDetected ? '4px solid var(--critical-color)' : '4px solid var(--success-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <Target size={20} color="var(--info-color)" />
                    <h3 style={{ margin: 0 }}>Detection Engine Output</h3>
                </div>
                
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                     <div>
                         <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Analyzed Event Reference</div>
                         <div style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{result.eventId}</div>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Classification</div>
                        <span className={`badge ${result.threatDetected ? 'badge-critical' : 'badge-success'}`}>
                          {result.threatDetected ? 'THREAT DETECTED' : 'BENIGN'}
                        </span>
                     </div>
                  </div>
                  
                  {result.threatDetected && (
                    <div style={{ marginTop: '1.5rem', background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div className="flex-row justify-between" style={{ marginBottom: '1rem' }}>
                          <div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Identified Threat Vector</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}><ShieldAlert size={16} color="var(--critical-color)" /> {result.threatType}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Severity</div>
                              <span className={`text-${result.severity.toLowerCase()}`} style={{ fontWeight: 600 }}>{result.severity}</span>
                          </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--panel-bg)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Model Confidence Score</span>
                          <span style={{ fontWeight: 'bold', color: 'var(--critical-color)', fontSize: '1.25rem' }}>{result.confidence}%</span>
                      </div>
                    </div>
                  )}
                  
                  {!result.threatDetected && (
                    <div style={{ marginTop: '1.5rem', padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <ShieldCheck size={32} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
                      <div style={{ color: 'var(--success-color)', fontWeight: 500 }}>
                        No malicious activity detected in this event.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!analyzing && !result && (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem', borderStyle: 'dashed' }}>
                  <Target size={48} opacity={0.2} />
                  <div>Select an event to run through the detection pipeline.</div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
