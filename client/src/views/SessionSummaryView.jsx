import React from 'react';
import { Award, Clock, CheckCircle2, TrendingUp, BookOpen, ArrowRight, Shield } from 'lucide-react';

export default function SessionSummaryView({ session, evaluationResult, onFinishSummary }) {
  const result = evaluationResult?.result || {};
  const mastery = evaluationResult?.topicMastery || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
      {/* Summary Header Banner */}
      <div className="glass-panel glass-glow" style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
        }}>
          <Award size={36} color="#fff" />
        </div>

        <span className="badge badge-emerald" style={{ marginBottom: '8px' }}>
          Session Summary • {session.status || 'COMPLETED'}
        </span>

        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 6px 0' }}>
          {session.topic}
        </h2>
        {session.subtopic && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Subtopic: {session.subtopic}
          </p>
        )}
      </div>

      {/* Planned vs Actual Duration & Score Grid */}
      <div className="desktop-grid-4">
        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Planned Time</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
            {session.plannedDuration || 45} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>m</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Actual Focused</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--emerald)', marginTop: '2px' }}>
            {session.actualDuration || session.plannedDuration} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>m</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Assessment Score</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>
            {result.score || session.score || 0}%
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Topic Mastery</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent)', marginTop: '2px' }}>
            {mastery.masteryScore || 85}%
          </div>
        </div>
      </div>

      {/* Feedback Breakdown */}
      {result.feedback && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '6px' }}>
            AI Evaluation Feedback
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
            {result.feedback}
          </p>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="desktop-grid-2">
        <div className="glass-panel" style={{ padding: '14px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <CheckCircle2 size={16} /> Verified Strengths
          </h4>
          <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(result.strengths || ['Demonstrated clear understanding of core topic']).map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: '14px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <TrendingUp size={16} /> Recommended Focus
          </h4>
          <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(result.weaknesses || ['Practice edge case scenarios']).map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Button */}
      <button onClick={onFinishSummary} className="btn btn-primary" style={{ padding: '14px', fontSize: '1rem', marginTop: '8px' }}>
        <span>Return to Dashboard</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
