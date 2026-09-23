import React from 'react';
import { Shield, Smartphone, Monitor, LogOut, User } from 'lucide-react';

export default function Navbar({ user, isPhoneFrame, setIsPhoneFrame, activeTab, setActiveTab, onLogout }) {
  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '12px 20px', sticky: 'top', zIndex: 900 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}>
            <Shield size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#fff' }}>
              StudyShield
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Intelligent Study Workspace
            </span>
          </div>
        </div>

        {/* Center Nav Pills (Desktop / Wide screens) */}
        {user && !isPhoneFrame && (
          <nav style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 16px', fontSize: '0.85rem', minHeight: '38px' }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 16px', fontSize: '0.85rem', minHeight: '38px' }}
            >
              Progress & Mastery
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 16px', fontSize: '0.85rem', minHeight: '38px' }}
            >
              Profile & Settings
            </button>
          </nav>
        )}

        {/* Mode Switcher & User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem', minHeight: '38px' }}
            title="Toggle between Fullscreen Responsive View and Phone Chassis Simulator"
          >
            {isPhoneFrame ? <Monitor size={16} /> : <Smartphone size={16} />}
            <span>{isPhoneFrame ? 'Expand Full View' : 'Phone Chassis View'}</span>
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right', display: 'none', smDisplay: 'block' }}>
                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{user.name}</div>
                <span className="badge badge-emerald" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Student</span>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-danger"
                style={{ padding: '6px 10px', borderRadius: '10px', minHeight: '38px' }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
