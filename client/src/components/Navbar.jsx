import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Monitor, LogOut, Sun, Moon } from 'lucide-react';

export default function Navbar({ user, isPhoneFrame, setIsPhoneFrame, activeTab, setActiveTab, onLogout }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('studyshield_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('studyshield_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '12px 20px', position: 'sticky', top: 0, zIndex: 900 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px var(--primary-glow)'
          }}>
            <Shield size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
              StudyShield
            </h1>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>
              Intelligent Focus Workspace
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

        {/* Mode Switchers & User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Calm Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', minHeight: '38px', borderRadius: '10px' }}
            title={theme === 'dark' ? 'Switch to Clean Light Theme' : 'Switch to Calm Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#0284c7" />}
          </button>

          {/* Phone Frame Toggle */}
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem', minHeight: '38px' }}
            title="Toggle between Fullscreen Responsive View and Phone Chassis Simulator"
          >
            {isPhoneFrame ? <Monitor size={16} /> : <Smartphone size={16} />}
            <span>{isPhoneFrame ? 'Full View' : 'Phone View'}</span>
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
