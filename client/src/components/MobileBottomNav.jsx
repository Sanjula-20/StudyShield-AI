import React from 'react';
import { Home, Shield, TrendingUp, User } from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab, onStartFocusClick, hasActiveSession }) {
  return (
    <nav className="mobile-bottom-nav">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
      >
        <Home size={22} />
        <span>Home</span>
      </button>

      <button
        onClick={onStartFocusClick}
        className={`nav-tab-btn ${activeTab === 'focus' ? 'active' : ''}`}
        style={{ color: hasActiveSession ? 'var(--emerald)' : undefined }}
      >
        <Shield size={22} color={hasActiveSession ? 'var(--emerald)' : undefined} />
        <span>{hasActiveSession ? 'Active Focus' : 'Start Focus'}</span>
      </button>

      <button
        onClick={() => setActiveTab('analytics')}
        className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
      >
        <TrendingUp size={22} />
        <span>Mastery</span>
      </button>

      <button
        onClick={() => setActiveTab('profile')}
        className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
      >
        <User size={22} />
        <span>Profile</span>
      </button>
    </nav>
  );
}
