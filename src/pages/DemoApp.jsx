import { useState, useEffect } from 'react';

export default function DemoApp() {
  const [username, setUsername] = useState('demo_user');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [securityStatus, setSecurityStatus] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    checkSecurityStatus();
    const interval = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkSecurityStatus = async () => {
    try {
      const res = await fetch(`/api/accounts/${username}/security-status`);
      const data = await res.json();
      setSecurityStatus(data);
      if (data.cooldownRemaining > 0) {
        setCooldown(data.cooldownRemaining);
      }
    } catch (e) {
      console.error("Failed to check security status");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    await checkSecurityStatus();
    
    // Check if blocked or in cooldown
    if (securityStatus?.status === 'BLOCKED') {
      setMessage('ACCOUNT BLOCKED. Reason: Repeated suspicious activity detected.');
      return;
    }
    if (securityStatus?.status === 'TEMPORARILY_RESTRICTED' && cooldown > 0) {
      setMessage(`Account temporarily restricted. Please wait: ${cooldown} seconds`);
      return;
    }

    const isSuccess = username === 'demo_user' && password === 'Orbit@123';
    
    const eventPayload = {
      eventType: isSuccess ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      username,
      sourceIp: '192.168.1.20',
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      severity: isSuccess ? 'LOW' : 'MEDIUM'
    };

    try {
      const res = await fetch('/api/security-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      });
      
      if (res.status === 403) {
        setMessage('ACCOUNT BLOCKED by Security Policy.');
        return;
      }
    } catch (err) {
      console.error(err);
    }

    if (isSuccess) {
      setIsLoggedIn(true);
      setMessage('');
    } else {
      setMessage('Invalid username or password');
    }
  };

  const sendEvent = async (eventType, file, severity = 'LOW', status = 'NORMAL') => {
    const eventPayload = {
      eventType,
      username,
      sourceIp: '192.168.1.20',
      status,
      severity,
      file
    };
    try {
      await fetch('/api/security-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      });
      setMessage(`Event sent: ${eventType}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRepeatedAccess = async () => {
    setMessage('Simulating repeated access...');
    for(let i=0; i<4; i++) {
      await sendEvent('FILE_ACCESS', 'project-source.zip', 'LOW');
      await new Promise(r => setTimeout(r, 200));
    }
  };

  const handleUnusualAccess = async () => {
    await sendEvent('UNUSUAL_ACCOUNT_ACTIVITY', null, 'MEDIUM', 'WARNING');
    await new Promise(r => setTimeout(r, 500));
    await sendEvent('SUSPICIOUS_FILE_ACTIVITY', 'financial-records.csv', 'HIGH', 'WARNING');
  };

  if (isLoggedIn) {
    return (
      <div style={{ padding: '2rem', backgroundColor: '#e2e8f0', minHeight: '100vh' }}>
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2>User Dashboard: {username}</h2>
            <button className="btn-secondary" onClick={() => {
              setIsLoggedIn(false);
              setPassword('');
              sendEvent('LOGOUT', null, 'LOW');
            }}>Logout</button>
          </div>

          {message && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#ebf8ff', color: '#2b6cb0', borderRadius: '4px' }}>
              {message}
            </div>
          )}

          <h3>File Access Area</h3>
          <div className="grid-cards" style={{ marginTop: '1rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <h4>Normal Files</h4>
              <button className="btn-secondary" style={{ display: 'block', width: '100%', marginBottom: '0.5rem' }} 
                onClick={() => sendEvent('FILE_ACCESS', 'project-report.pdf', 'LOW')}>
                Access project-report.pdf
              </button>
              <button className="btn-secondary" style={{ display: 'block', width: '100%' }} 
                onClick={() => sendEvent('FILE_ACCESS', 'system-config.txt', 'LOW')}>
                Access system-config.txt
              </button>
            </div>
            
            <div className="card" style={{ padding: '1rem', borderTop: '4px solid #dd6b20' }}>
              <h4>Demo Threat Scenarios</h4>
              <button style={{ display: 'block', width: '100%', marginBottom: '0.5rem', backgroundColor: '#dd6b20' }} 
                onClick={() => sendEvent('SUSPICIOUS_FILE_ACTIVITY', 'employee-data.csv', 'HIGH', 'WARNING')}>
                [Simulate] Access Sensitive Data
              </button>
              <button style={{ display: 'block', width: '100%', marginBottom: '0.5rem', backgroundColor: '#dd6b20' }} 
                onClick={handleRepeatedAccess}>
                [Simulate] Repeated File Access
              </button>
              <button style={{ display: 'block', width: '100%', backgroundColor: '#c53030' }} 
                onClick={handleUnusualAccess}>
                [Simulate] Unusual Account Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' }}>
      <div className="card" style={{ width: '400px', backgroundColor: 'white' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#2d3748' }}>Security Demo Application</h2>
        <div style={{ padding: '1rem', backgroundColor: '#fffaf0', borderLeft: '4px solid var(--medium-color)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <strong>Note:</strong> Controlled academic simulation.
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={{ width: '100%', marginTop: '1rem', backgroundColor: '#4a5568' }}
                  disabled={cooldown > 0 || securityStatus?.status === 'BLOCKED'}>
            {cooldown > 0 ? `Wait ${cooldown}s...` : securityStatus?.status === 'BLOCKED' ? 'BLOCKED' : 'Login'}
          </button>
        </form>

        {message && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            textAlign: 'center',
            backgroundColor: message.includes('success') ? '#c6f6d5' : '#fed7d7',
            color: message.includes('success') ? '#22543d' : '#c53030',
            borderRadius: '4px'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
