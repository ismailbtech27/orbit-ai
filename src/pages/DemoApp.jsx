import { useState, useEffect } from 'react';

export default function DemoApp() {
  const [username, setUsername] = useState('demo_user');
  const [password, setPassword] = useState('Orbit@123');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('files');
  
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

  const sendEvent = async (eventType, file = null, severity = 'LOW', status = 'NORMAL', resourceClassification = 'NORMAL') => {
    const eventPayload = {
      eventType,
      username,
      sourceIp: '192.168.1.55',
      status,
      severity,
      file,
      resourceClassification
    };
    try {
      const res = await fetch('/api/security-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      });
      if (res.status === 403) {
        return 'BLOCKED';
      }
      return 'SUCCESS';
    } catch (e) {
      console.error(e);
      return 'ERROR';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    await checkSecurityStatus();
    
    if (securityStatus?.status === 'BLOCKED') {
      setMessage('Account access has been blocked due to a security incident. Please contact the security administrator.');
      return;
    }
    if (securityStatus?.status === 'TEMPORARILY_RESTRICTED' || cooldown > 0) {
      setMessage(`Access temporarily restricted for security monitoring. Remaining: ${cooldown}s`);
      return;
    }

    const isSuccess = password === 'Orbit@123';
    
    const result = await sendEvent(isSuccess ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED', null, isSuccess ? 'LOW' : 'MEDIUM', isSuccess ? 'SUCCESS' : 'FAILED');

    if (result === 'BLOCKED') {
       setMessage('Account access has been blocked due to a security incident. Please contact the security administrator.');
       setSecurityStatus({...securityStatus, status: 'BLOCKED'});
       return;
    }

    if (isSuccess) {
      setIsLoggedIn(true);
      setMessage('');
    } else {
      setMessage('Invalid username or password.');
    }
  };

  const handleFileAccess = async (filename, classification) => {
    await checkSecurityStatus();
    if (securityStatus?.status === 'BLOCKED' || cooldown > 0) {
        alert("Access Denied: Account restricted.");
        return;
    }

    const eventType = classification !== 'NORMAL' ? 'SENSITIVE_FILE_ACCESS' : 'FILE_ACCESS';
    const severity = classification !== 'NORMAL' ? 'HIGH' : 'LOW';
    
    await sendEvent(eventType, filename, severity, 'SUCCESS', classification);
    setMessage(`Opened file: ${filename}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const simulateAdminAttack = async () => {
    await sendEvent('UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', '/admin', 'CRITICAL', 'FAILED', 'HIGHLY_CONFIDENTIAL');
    setMessage('Simulated unauthorized admin access attempt.');
    setTimeout(() => setMessage(''), 3000);
  };

  if (securityStatus?.status === 'BLOCKED' && !isLoggedIn) {
      return (
          <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
              <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px', textAlign: 'center' }}>
                  <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>ACCOUNT ACCESS BLOCKED</h2>
                  <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>Your account is currently unavailable.</p>
                  <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>Please contact the security administrator.</p>
                  <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', background: '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Refresh Status</button>
              </div>
          </div>
      );
  }

  if (isLoggedIn) {
    if (securityStatus?.status === 'BLOCKED') {
        setIsLoggedIn(false); // Force out if blocked while logged in
    }

    if (cooldown > 0) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
                <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '450px', textAlign: 'center' }}>
                    <h2 style={{ color: '#d97706', marginBottom: '1rem' }}>ACCOUNT TEMPORARILY RESTRICTED</h2>
                    <p style={{ color: '#4b5563', marginBottom: '1rem' }}>Your account has been temporarily restricted while a security event is being reviewed.</p>
                    <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>Access will be monitored during this period.</p>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706', marginBottom: '1.5rem' }}>00:{cooldown.toString().padStart(2, '0')}</div>
                    <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', background: '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Refresh</button>
                </div>
            </div>
        );
    }

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif', color: '#1f2937' }}>
        <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', color: '#2563eb', margin: 0, fontWeight: 700 }}>Acme Corp Portal</h1>
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none', color: activeTab === 'dashboard' ? '#2563eb' : '#6b7280', fontWeight: 500, cursor: 'pointer', padding: 0 }}>Dashboard</button>
              <button onClick={() => setActiveTab('files')} style={{ background: 'none', border: 'none', color: activeTab === 'files' ? '#2563eb' : '#6b7280', fontWeight: 500, cursor: 'pointer', padding: 0 }}>My Files</button>
              <button onClick={() => setActiveTab('profile')} style={{ background: 'none', border: 'none', color: activeTab === 'profile' ? '#2563eb' : '#6b7280', fontWeight: 500, cursor: 'pointer', padding: 0 }}>Profile</button>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>Logged in as <strong>{username}</strong></span>
            <button style={{ padding: '0.4rem 0.8rem', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => {
              setIsLoggedIn(false);
              setPassword('Orbit@123'); // Reset password for easy demo
              sendEvent('LOGOUT', null, 'LOW');
            }}>Logout</button>
          </div>
        </header>

        <main style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
          {message && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
              {message}
            </div>
          )}

          {activeTab === 'files' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Enterprise File Directory</h2>
              
              <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f3f4f6' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>File Name</th>
                      <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Type</th>
                      <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Classification</th>
                      <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>project-report.pdf</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#6b7280' }}>Document</td>
                      <td style={{ padding: '1rem 1.5rem' }}><span style={{ padding: '0.25rem 0.5rem', background: '#f3f4f6', color: '#4b5563', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>NORMAL</span></td>
                      <td style={{ padding: '1rem 1.5rem' }}><button onClick={() => handleFileAccess('project-report.pdf', 'NORMAL')} style={{ padding: '0.3rem 0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Open</button></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>team-notes.txt</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#6b7280' }}>Text</td>
                      <td style={{ padding: '1rem 1.5rem' }}><span style={{ padding: '0.25rem 0.5rem', background: '#f3f4f6', color: '#4b5563', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>NORMAL</span></td>
                      <td style={{ padding: '1rem 1.5rem' }}><button onClick={() => handleFileAccess('team-notes.txt', 'NORMAL')} style={{ padding: '0.3rem 0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Open</button></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>development-guide.pdf</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#6b7280' }}>Document</td>
                      <td style={{ padding: '1rem 1.5rem' }}><span style={{ padding: '0.25rem 0.5rem', background: '#f3f4f6', color: '#4b5563', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>NORMAL</span></td>
                      <td style={{ padding: '1rem 1.5rem' }}><button onClick={() => handleFileAccess('development-guide.pdf', 'NORMAL')} style={{ padding: '0.3rem 0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Open</button></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fffbeb' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>employee-data.csv</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#6b7280' }}>Data</td>
                      <td style={{ padding: '1rem 1.5rem' }}><span style={{ padding: '0.25rem 0.5rem', background: '#fef3c7', color: '#b45309', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>CONFIDENTIAL</span></td>
                      <td style={{ padding: '1rem 1.5rem' }}><button onClick={() => handleFileAccess('employee-data.csv', 'CONFIDENTIAL')} style={{ padding: '0.3rem 0.75rem', background: '#b45309', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Open</button></td>
                    </tr>
                    <tr style={{ backgroundColor: '#fef2f2' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>financial-records.csv</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#6b7280' }}>Data</td>
                      <td style={{ padding: '1rem 1.5rem' }}><span style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>HIGHLY CONFIDENTIAL</span></td>
                      <td style={{ padding: '1rem 1.5rem' }}><button onClick={() => handleFileAccess('financial-records.csv', 'HIGHLY_CONFIDENTIAL')} style={{ padding: '0.3rem 0.75rem', background: '#b91c1c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Open</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Dashboard Overview</h2>
              <p style={{ color: '#6b7280' }}>Welcome to the Acme Corp Portal. Use the tabs above to navigate.</p>
              
              <div style={{ marginTop: '3rem', padding: '1.5rem', border: '1px dashed #d1d5db', borderRadius: '8px', backgroundColor: '#f3f4f6' }}>
                 <h4 style={{ color: '#4b5563', marginBottom: '1rem' }}>Simulation Controls (Academic Demo Only)</h4>
                 <button onClick={simulateAdminAttack} style={{ padding: '0.5rem 1rem', background: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Simulate Admin Access Attempt (Deviation)
                 </button>
              </div>
            </div>
          )}
          
          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>User Profile</h2>
              <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <p style={{ marginBottom: '0.5rem' }}><strong>Name:</strong> Demo User</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> {username}@acmecorp.demo</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Department:</strong> Engineering</p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ width: '400px', backgroundColor: 'white', borderRadius: '8px', padding: '2.5rem 2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: '#2563eb', margin: 0, fontWeight: 700, fontSize: '1.75rem' }}>Acme Corp</h2>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>Enterprise Employee Portal</div>
        </div>
        
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderLeft: '3px solid #64748b', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#475569' }}>
          Access to this system is monitored for security purposes.
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              required
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                  disabled={cooldown > 0 || securityStatus?.status === 'BLOCKED'}>
            {cooldown > 0 ? `Wait ${cooldown}s...` : securityStatus?.status === 'BLOCKED' ? 'BLOCKED' : 'Sign In'}
          </button>
        </form>

        {message && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '0.75rem', 
            textAlign: 'center',
            fontSize: '0.85rem',
            backgroundColor: message.includes('success') ? '#d1fae5' : '#fee2e2',
            color: message.includes('success') ? '#065f46' : '#991b1b',
            borderRadius: '4px'
          }}>
            {message}
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Demo Credentials: demo_user / Orbit@123</p>
        </div>
      </div>
    </div>
  );
}
