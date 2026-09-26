import React, { useState, useEffect } from 'react';
import { Shield, Award, CheckCircle, AlertTriangle, Brain, Lock } from 'lucide-react';
import SessionSummaryView from './SessionSummaryView';
import { api } from '../api';

export default function AssessmentView({ session, onAssessmentComplete, onReturnToStudy }) {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  const sessId = session?._id || session?.id;

  // Audio Siren Synthesizer for Anti-Cheat Violation Alert
  const playViolationSiren = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch siren tone
      osc.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio Context alert unhandled', e);
    }
  };

  const enterStrictFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const [isKioskLocked, setIsKioskLocked] = useState(false);

  // Anti-Cheat Tab Switching, Window Focus & Fullscreen Lock Listener
  useEffect(() => {
    if (!assessment || evaluationResult) return;

    const triggerViolation = () => {
      playViolationSiren();
      setTabSwitchCount(prev => {
        const next = prev + 1;
        if (next >= 3) {
          // 3-STRIKE AUTO DISQUALIFICATION RULE
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          setEvaluationResult({
            score: 0,
            isPassed: false,
            feedback: '⚠️ ASSESSMENT TERMINATED & DISQUALIFIED: You attempted to switch tabs / exit fullscreen 3 times during the practical assessment. This assessment attempt is marked as 0% Unmastered.',
            strengths: [],
            weaknesses: ['Tab switching during assessment', 'Exiting strict exam kiosk mode'],
            suggestions: ['Review the AI Tutor concepts carefully without leaving the window.', 'Retry the assessment in strict fullscreen mode.']
          });
          setShowTabWarning(false);
        } else {
          setShowTabWarning(true);
        }
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerViolation();
      }
    };

    const handleWindowBlur = () => {
      triggerViolation();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !evaluationResult) {
        triggerViolation();
      }
    };

    const handleKeyDown = (e) => {
      if (
        e.key === 'Escape' ||
        e.key === 'F11' ||
        (e.altKey && e.key === 'Tab') ||
        (e.ctrlKey && (e.key === 't' || e.key === 'n' || e.key === 'w' || e.key === 'Tab'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [assessment, evaluationResult]);

  useEffect(() => {
    if (sessId) {
      initAssessment();
    }
  }, [sessId]);

  const handleStartFullscreenKiosk = () => {
    enterStrictFullscreen();
    setIsKioskLocked(true);
  };

  const initAssessment = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.generateAssessment({
        sessionId: sessId,
        topic: session.topic,
        subtopic: session.subtopic,
        learningGoal: session.learningGoal
      });
      setAssessment(data.assessment);
    } catch (err) {
      setError(err.message || 'Failed to generate post-session assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!studentAnswer.trim() || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const data = await api.submitAssessment(assessment._id || assessment.id, studentAnswer);
      setEvaluationResult(data);
    } catch (err) {
      setError(err.message || 'Failed to submit answer for AI evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryAssessment = async () => {
    setEvaluationResult(null);
    setStudentAnswer('');
    await initAssessment();
  };

  if (loading) {
    return (
      <div className="glass-panel glass-glow" style={{ padding: '30px 16px', textAlign: 'center' }}>
        <div className="splash-logo" style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #00f2fe 0%, #7f00ff 100%)',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Brain size={30} color="#040914" />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Generating AI Assessment</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>
          Preparing scenario question for <strong>{session.topic}</strong>...
        </p>
      </div>
    );
  }

  if (!isKioskLocked && !evaluationResult) {
    return (
      <div className="glass-panel glass-glow" style={{ padding: '36px 24px', textAlign: 'center', maxWidth: '580px', margin: '20px auto' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.2)',
          border: '2px solid var(--primary)',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)'
        }}>
          <Lock size={32} color="var(--primary)" />
        </div>

        <span className="badge badge-purple" style={{ marginBottom: '12px' }}>
          🔒 Strict Academic Kiosk Required
        </span>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '8px 0 12px 0' }}>
          Start Practical Assessment Mode
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
          Topic: <strong style={{ color: 'var(--primary)' }}>{session.topic}</strong><br />
          To prevent tab switching and maintain academic integrity, this assessment requires <strong>Strict Fullscreen Kiosk Lock</strong>.
        </p>

        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--glass-border)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          textAlign: 'left',
          marginBottom: '24px'
        }}>
          <strong style={{ color: '#fff', display: 'block', marginBottom: '6px' }}>Strict Kiosk Rules:</strong>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Browser will lock into Fullscreen Mode.</li>
            <li>Tab switching or exiting window triggers warning audio siren.</li>
            <li>3 tab switch attempts will automatically disqualify and terminate the assessment (0% Score).</li>
          </ul>
        </div>

        <button
          onClick={handleStartFullscreenKiosk}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '700' }}
        >
          🔒 Lock Fullscreen Kiosk Mode & Begin Assessment
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      <div className="glass-panel glass-glow" style={{ padding: '20px 16px' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span className="badge badge-emerald">
              Outcome Verification
            </span>
            <span className={`badge ${tabSwitchCount > 0 ? 'badge-rose' : 'badge-purple'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
              <Shield size={12} /> {tabSwitchCount > 0 ? `Tab Switches Detected: ${tabSwitchCount}` : 'Anti-Cheat Protection Active'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>
            Practical Assessment
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Topic: <strong>{session.topic}</strong> ({session.actualDuration || session.plannedDuration}m focused)
          </p>
        </div>

        {/* FULL-SCREEN STRICT ASSESSMENT DISTRACTION INTERCEPT OVERLAY */}
        {showTabWarning && !evaluationResult && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#0F172A',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.2)',
              border: '2px solid #f43f5e',
              margin: '0 auto 20px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(244, 63, 94, 0.4)'
            }}>
              <Lock size={36} color="#fb7185" />
            </div>

            <span className="badge badge-rose" style={{ marginBottom: '14px', fontSize: '0.8rem', padding: '6px 14px' }}>
              🔒 Assessment Strict Anti-Cheat Active
            </span>

            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '8px 0', color: '#fff' }}>
              Tab Switch / External App Intercepted!
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '440px', lineHeight: '1.6', marginBottom: '20px' }}>
              You are taking the practical assessment for:<br />
              <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{session.topic}</strong>
              <br /><br />
              Leaving this window to open Instagram, YouTube, TikTok, or search engines is strictly monitored.
            </p>

            <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.4)', fontSize: '0.88rem', color: '#fb7185', marginBottom: '24px', maxWidth: '440px' }}>
              ⚠️ Anti-Cheat Warning Count: <strong>{tabSwitchCount} / 3 Strikes</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Note: 3 tab switch violations will automatically DISQUALIFY & FAIL this assessment attempt!
              </div>
            </div>

            <button
              onClick={() => {
                setShowTabWarning(false);
                enterStrictFullscreen();
              }}
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1rem', minWidth: '300px' }}
            >
              Return & Lock Fullscreen Exam Mode
            </button>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            marginBottom: '14px'
          }}>
            {error}
          </div>
        )}

        {/* EVALUATION RESULT & SESSION SUMMARY DISPLAY */}
        {evaluationResult ? (
          <SessionSummaryView
            session={session}
            evaluationResult={evaluationResult}
            onFinishSummary={onAssessmentComplete}
            onRetryAssessment={handleRetryAssessment}
            onReturnToStudy={() => onReturnToStudy && onReturnToStudy(session)}
          />
        ) : (
          /* QUESTION FORM */
          <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                    {assessment.assessmentType?.replace('_', ' ') || 'Scenario Analysis'}
                  </span>
                  <span className="badge badge-cyan" style={{ textTransform: 'capitalize' }}>
                    {assessment.difficulty || 'Intermediate'} Difficulty
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                  AI Outcome Verification
                </span>
              </div>

              <p style={{ fontSize: '0.95rem', fontWeight: '600', lineHeight: '1.55', color: 'var(--text-main)', margin: '8px 0 12px 0' }}>
                {assessment.question}
              </p>

              {/* Expected Concept Chips */}
              {assessment.expectedConcepts && assessment.expectedConcepts.length > 0 && (
                <div style={{ paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>
                    Concepts to address in your answer:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {assessment.expectedConcepts.map((concept, cIdx) => (
                      <span key={cIdx} style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#818cf8'
                      }}>
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px' }}>
                Your Answer / Solution *
              </label>
              <textarea
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Type your practical solution here..."
                className="input-field"
                rows={5}
                style={{ resize: 'vertical', fontSize: '0.85rem' }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              disabled={submitting}
            >
              {submitting ? 'Evaluating with AI...' : 'Submit for AI Evaluation'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
