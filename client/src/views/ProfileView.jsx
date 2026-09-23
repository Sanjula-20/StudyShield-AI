import React, { useState } from 'react';
import { User, Shield, Key, Bell, CheckCircle2, AlertTriangle, LogOut, Lock } from 'lucide-react';

export default function ProfileView({ user, onLogout }) {
  const [permissions, setPermissions] = useState({
    usageAccess: true,
    overlayPermission: true,
    notifications: true,
    foregroundService: true
  });

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Profile Header */}
      <div className="glass-panel glass-glow" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px var(--primary-glow)'
          }}>
            <User size={38} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-cyan">Primary Role: Student</span>
              <span className="badge badge-emerald">Verified Account</span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>{user.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{user.email}</p>
          </div>
        </div>
      </div>

      {/* Android Native Permissions Management */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--primary)" /> Android Native Focus Mode Permissions
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          StudyShield uses platform capabilities to restrict distracting applications during active study sessions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Usage Access Permission</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Detects active foreground applications to enforce study restrictions.</div>
            </div>
            <button onClick={() => togglePermission('usageAccess')} className={`btn ${permissions.usageAccess ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              {permissions.usageAccess ? 'Granted' : 'Enable'}
            </button>
          </div>

          <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Display Over Other Apps (Overlay)</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Displays the focus restriction screen when restricted apps are launched.</div>
            </div>
            <button onClick={() => togglePermission('overlayPermission')} className={`btn ${permissions.overlayPermission ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              {permissions.overlayPermission ? 'Granted' : 'Enable'}
            </button>
          </div>

          <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Foreground Study Service</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Keeps timer and Focus Mode active across device screen changes.</div>
            </div>
            <button onClick={() => togglePermission('foregroundService')} className={`btn ${permissions.foregroundService ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              {permissions.foregroundService ? 'Granted' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* Security & Token Info */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={20} color="var(--accent)" /> Security & Session Credentials
        </h3>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
          Your authentication token is stored using secure local web storage. Password credentials are hashed using <strong>bcrypt</strong> on the backend.
        </div>
        <button onClick={onLogout} className="btn btn-danger" style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
          <LogOut size={18} /> Sign Out of StudyShield Account
        </button>
      </div>
    </div>
  );
}
