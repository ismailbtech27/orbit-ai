import { NavLink, Outlet } from 'react-router-dom';
import { Shield, Activity, Search, AlertTriangle, ActivitySquare, ShieldAlert } from 'lucide-react';

export default function Layout() {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Orbit AI</h2>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Prototype v0.5</div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <Activity size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Search size={20} />
            <span>Security Events</span>
          </NavLink>
          <NavLink to="/detection" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ActivitySquare size={20} />
            <span>Threat Detection</span>
          </NavLink>
          <NavLink to="/alerts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <AlertTriangle size={20} />
            <span>Alerts</span>
          </NavLink>
          <NavLink to="/attack-path" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ActivitySquare size={20} />
            <span>Attack Path</span>
          </NavLink>
          <NavLink to="/risk" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={20} />
            <span>Risk Assessment</span>
          </NavLink>
          <NavLink to="/response" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Shield size={20} />
            <span>Policy & Response</span>
          </NavLink>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
          <NavLink to="/handler" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={20} />
            <span>Handler Restoration</span>
          </NavLink>
        </nav>
      </aside>
      
      <main className="main-content">
        <header className="top-header">
          <h3>Intelligent Cyber Threat Analysis</h3>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
