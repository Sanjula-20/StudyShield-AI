import React, { useState, useEffect } from 'react';
import { Shield, Award, CheckCircle, AlertTriangle, Brain } from 'lucide-react';
import SessionSummaryView from './SessionSummaryView';
import { api } from '../api';

export default function AssessmentView({ session, onAssessmentComplete }) {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  const sessId = session?._id || session?.id;

  useEffect(() => {
    if (sessId) initAssessment();
  }, [sessId]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      <div className="glass-panel glass-glow" style={{ padding: '20px 16px' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <span className="badge badge-emerald" style={{ marginBottom: '4px' }}>
            Outcome Verification
          </span>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>
            Practical Assessment
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Topic: <strong>{session.topic}</strong> ({session.actualDuration || session.plannedDuration}m focused)
          </p>
        </div>

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
