import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, ArrowRight } from 'lucide-react';

export default function SplashScreen({ onGetStarted }) {
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimating(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '40px 24px 32px 24px',
      textAlign: 'center',
      background: 'radial-gradient(circle at 50% 30%, rgba(0, 242, 254, 0.15) 0%, rgba(9, 13, 22, 1) 70%)'
    }}>
      <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="splash-logo" style={{
          width: '88px',
          height: '88px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <Shield size={52} color="#040914" />
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px', background: 'linear-gradient(135deg, #fff 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          StudyShield
        </h1>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '320px', lineHeight: '1.6', marginBottom: '16px' }}>
          Intelligent Mobile Study & Distraction Shield
        </p>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          <span className="badge badge-cyan">Android Focus Mode</span>
          <span className="badge badge-emerald">AI Tutor</span>
          <span className="badge badge-purple">Assessment</span>
        </div>
      </div>

      <button
        onClick={onGetStarted}
        className="btn btn-primary"
        style={{ width: '100%', minHeight: '54px', fontSize: '1.05rem', marginTop: 'auto' }}
      >
        <span>Get Started & Learn</span>
        <ArrowRight size={20} />
      </button>
    </div>
  );
}
