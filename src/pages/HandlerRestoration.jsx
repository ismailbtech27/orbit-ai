import { useEffect, useState } from 'react';

export default function HandlerRestoration() {
  const [blockedAccounts, setBlockedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/handlers/blocked-accounts');
      const data = await res.json();
      setBlockedAccounts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (username) => {
    try {
      await fetch(`/api/accounts/${username}/restore`, { method: 'POST' });
      await loadAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading handler queue...</div>;

  return (
    <div>
      <h2>Security Handler / Administrator</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        Review escalated incidents and manually restore access for blocked accounts.
      </p>

      {blockedAccounts.map(account => (
        <div key={account.username} className="card" style={{ borderLeft: '4px solid #c53030' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3>Account: {account.username}</h3>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                <strong>Status:</strong> <span className="badge badge-critical">{account.status}</span>
              </div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                <strong>Reason:</strong> Repeated suspicious activity detected (Escalated after cooldown)
              </div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                <strong>Blocked At:</strong> {new Date(account.blocked_at).toLocaleString()}
              </div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                <strong>Related Incident:</strong> {account.incident_id || 'N/A'}
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <button 
                onClick={() => handleRestore(account.username)}
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                RESTORE ACCOUNT ACCESS
              </button>
            </div>
          </div>
        </div>
      ))}

      {blockedAccounts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No accounts are currently blocked.
        </div>
      )}
    </div>
  );
}
