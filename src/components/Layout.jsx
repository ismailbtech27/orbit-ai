import { NavLink, Outlet } from 'react-router-dom';
import { Shield, Activity, Search, AlertTriangle, ActivitySquare, ShieldAlert, Users, List, Play } from 'lucide-react';

export default function Layout() {
  const currentRole = localStorage.getItem('orbit_role') || 'SOC_ANALYST';

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>ORBIT AI</h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--info-color)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Security Intelligence</div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <Activity size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <List size={18} />
            <span>Security Events</span>
          </NavLink>
          <NavLink to="/detection" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Search size={18} />
            <span>Threat Detection</span>
          </NavLink>
          <NavLink to="/alerts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <AlertTriangle size={18} />
            <span>Incidents</span>
          </NavLink>
          <NavLink to="/attack-path" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ActivitySquare size={18} />
            <span>Attack Paths</span>
          </NavLink>
          <NavLink to="/risk" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={18} />
            <span>Risk Analysis</span>
          </NavLink>
          <NavLink to="/response" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Shield size={18} />
            <span>Recommendations</span>
          </NavLink>
          
          <div style={{ margin: '1.5rem 1.5rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Administration</div>
          
          <NavLink to="/handler" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Accounts & Recovery</span>
          </NavLink>
        </nav>
        
        <div className="sidebar-footer">
          <div style={{ marginBottom: '4px', color: 'var(--text-main)' }}>Current User</div>
          <div style={{ color: 'var(--info-color)', fontWeight: '600' }}>{currentRole}</div>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="top-header">
          <div className="header-status">
             <span style={{ color: 'var(--text-muted)' }}>Environment:</span>
             <span style={{ fontWeight: '500' }}>SECURITY MONITORING</span>
          </div>
          
          <div className="header-status">
            <a href="/demo" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', background: 'var(--panel-bg)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
              <Play size={14} /> Open Demo App
            </a>
            <div className="status-indicator">
              <div className="status-dot"></div>
              MONITORING
            </div>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
