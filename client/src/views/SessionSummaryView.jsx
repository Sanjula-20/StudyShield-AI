import React from 'react';
import { Award, Clock, CheckCircle2, TrendingUp, BookOpen, ArrowRight, Shield, AlertTriangle, RefreshCw } from 'lucide-react';

export default function SessionSummaryView({ session, evaluationResult, onFinishSummary, onRetryAssessment, onReturnToStudy }) {
  const result = evaluationResult?.result || {};
  const mastery = evaluationResult?.topicMastery || {};
  const score = result.score !== undefined ? result.score : (session.score || 0);
  const isPassed = score >= 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
      {/* Summary Header Banner */}
      <div className="glass-panel glass-glow" style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: isPassed
            ? 'linear-gradient(135deg, var(--emerald) 0%, var(--primary) 100%)'
            : 'linear-gradient(135deg, #f43f5e 0%, #d97706 100%)',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isPassed ? '0 0 24px var(--primary-glow)' : '0 0 24px rgba(244, 63, 94, 0.4)'
        }}>
          {isPassed ? <Award size={36} color="#fff" /> : <AlertTriangle size={36} color="#fff" />}
        </div>

        <span className={isPassed ? 'badge badge-emerald' : 'badge badge-rose'} style={{ marginBottom: '8px' }}>
          {isPassed ? 'Session Completed • Mastery Verified' : 'Assessment Threshold Unmet (Score < 50%)'}
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

      {/* Threshold Status Banner */}
      {!isPassed ? (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          padding: '16px 20px',
          borderRadius: '12px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '1.05rem', marginBottom: '6px' }}>
            <AlertTriangle size={22} color="#f87171" />
            <span>Score Below 50% Threshold ({score}% / 100%)</span>
          </div>
          <p style={{ fontSize: '0.86rem', margin: 0, lineHeight: '1.5', color: '#fca5a5' }}>
            Your assessment score is <strong>{score}%</strong>, which is below the minimum 50% required to pass. 
            The assessment will not complete automatically. You can review weak concepts with your <strong>AI Tutor</strong> or retry a fresh assessment question below to achieve mastery!
          </p>
        </div>
      ) : (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          padding: '14px 18px',
          borderRadius: '12px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <CheckCircle2 size={26} color="#34d399" />
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem' }}>Assessment Passed! ({score}%)</div>
            <div style={{ fontSize: '0.82rem', color: '#a7f3d0' }}>Minimum 50% threshold achieved. Topic mastery updated!</div>
          </div>
        </div>
      )}

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
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: isPassed ? 'var(--primary)' : '#f87171', marginTop: '2px' }}>
            {score}%
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Topic Mastery</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent)', marginTop: '2px' }}>
            {mastery.masteryScore || 85}%
          </div>
        </div>
      </div>

      {/* 6-Dimension Evaluation Metrics Grid */}
      {result.metrics && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} color="var(--primary)" /> 6-Dimension AI Evaluation Metrics
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {Object.entries(result.metrics).map(([key, val]) => (
              <div key={key} style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'capitalize', fontWeight: '700' }}>
                  {key}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: val >= 50 ? 'var(--primary)' : '#f87171', margin: '2px 0 4px 0' }}>
                  {val}%
                </div>
                <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', background: val >= 50 ? 'linear-gradient(90deg, var(--primary) 0%, var(--emerald) 100%)' : 'linear-gradient(90deg, #f43f5e 0%, #d97706 100%)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Breakdown */}
      {result.feedback && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '6px' }}>
            AI Evaluation Feedback
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
            {result.feedback}
          </p>
        </div>
      )}

      {/* Strengths & Recommended Focus */}
      <div className="desktop-grid-2">
        <div className="glass-panel" style={{ padding: '14px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <CheckCircle2 size={16} /> Verified Strengths
          </h4>
          <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px', margin: 0 }}>
            {(result.strengths || ['Demonstrated understanding of core topic']).map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: '14px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <TrendingUp size={16} /> Recommended Focus
          </h4>
          <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px', margin: 0 }}>
            {(result.weaknesses || ['Practice edge case scenarios']).map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Missing Concepts & Actionable Suggestions */}
      {((result.missingConcepts && result.missingConcepts.length > 0) || (result.suggestions && result.suggestions.length > 0)) && (
        <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {result.missingConcepts && result.missingConcepts.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>
                Concepts to Revisit:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {result.missingConcepts.map((m, idx) => (
                  <span key={idx} className="badge badge-rose" style={{ fontSize: '0.72rem' }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.suggestions && result.suggestions.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>
                Actionable Next Steps:
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '3px', margin: 0 }}>
                {result.suggestions.map((sug, idx) => (
                  <li key={idx}>{sug}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!isPassed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={onRetryAssessment}
              className="btn btn-primary"
              style={{ flex: 1, padding: '14px', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <RefreshCw size={18} />
              <span>Retry Assessment (New Question)</span>
            </button>

            <button
              onClick={onReturnToStudy}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '14px', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <BookOpen size={18} color="var(--primary)" />
              <span>Return to AI Tutor Workspace</span>
            </button>
          </div>

          <button
            onClick={onFinishSummary}
            className="btn"
            style={{
              padding: '10px',
              fontSize: '0.8rem',
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>Exit Session (Unmastered — Score Below 50%)</span>
          </button>
        </div>
      ) : (
        <button onClick={onFinishSummary} className="btn btn-primary" style={{ padding: '14px', fontSize: '1rem', marginTop: '4px' }}>
          <span>Complete Session & Return to Dashboard</span>
          <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
}
