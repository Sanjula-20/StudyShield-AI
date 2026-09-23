import React, { useState } from 'react';
import { Shield, Lock, Mail, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, setStoredToken } from '../api';

export default function AuthView({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('student@studyshield.io');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const data = await api.register(name, email, password);
        setStoredToken(data.token);
        onAuthSuccess(data.user);
      } else {
        const data = await api.login(email, password);
        setStoredToken(data.token);
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 20px' }}>
      <div className="glass-panel glass-glow" style={{ padding: '36px 28px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          margin: '0 auto 20px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px var(--primary-glow)'
        }}>
          <Shield size={36} color="#ffffff" />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '8px' }}>
          {isRegister ? 'Create Student Account' : 'Welcome Back'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
          {isRegister
            ? 'Join StudyShield to eliminate mobile distractions and verify learning.'
            : 'Sign in to access your Focus Study Workspace & AI Tutor.'}
        </p>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '42px' }}
                required
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-dim)' }} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '42px' }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-dim)' }} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '42px' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In to StudyShield'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          </span>
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer' }}
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </div>

        {/* Feature Highlights */}
        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={16} color="var(--primary)" />
            <span>Android Focus Mode app & website blocking</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={16} color="var(--emerald)" />
            <span>AI Tutor with session context & YouTube search</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={16} color="var(--accent)" />
            <span>Scenario-based assessment & outcome evaluation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
