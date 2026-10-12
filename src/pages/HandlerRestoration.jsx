import { useEffect, useState } from 'react';
import { Users, Unlock, Lock, UserX, UserCheck } from 'lucide-react';

export default function HandlerRestoration() {
  const [blockedAccounts, setBlockedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
    const interval = setInterval(loadAccounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/handlers/blocked-accounts', {
        headers: { 'x-user-role': 'ADMIN' }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setBlockedAccounts(data);
      } else {
        setBlockedAccounts([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (username) => {
    try {
      await fetch(`/api/accounts/${username}/restore`, { 
        method: 'POST',
        headers: { 'x-user-role': 'ADMIN' }
      });
      await loadAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && blockedAccounts.length === 0) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading blocked accounts list...</div>;

  return (
    <div>
      <div className="flex-row justify-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>Account Security Handlers</h2>
          <p className="text-muted">
            Review escalated incidents and manually manage access for restricted accounts.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {blockedAccounts.map(account => (
          <div key={account.username} className="card" style={{ borderTop: '4px solid var(--critical-color)', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Lock size={18} color="var(--critical-color)" />
                    {account.username}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Escalated Incident ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{account.incidentId || 'N/A'}</span>
                </div>
              </div>
              <span className="badge badge-critical">{account.status}</span>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '4px', borderLeft: '2px solid var(--critical-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>Automated Reasoning</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Repeated suspicious activity detected. Account escalated to BLOCKED state after cooldown violation.</div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                   Blocked: {account.blockedAt ? new Date(account.blockedAt).toLocaleString() : 'Unknown'}
                </div>
                <button 
                  onClick={() => handleRestore(account.username)}
                  style={{ backgroundColor: 'var(--success-color)' }}
                >
                  <Unlock size={16} /> Restore Access
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {blockedAccounts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <UserCheck size={48} opacity={0.2} />
          <div>No accounts are currently blocked or requiring handler intervention.</div>
        </div>
      )}
    </div>
  );
}
