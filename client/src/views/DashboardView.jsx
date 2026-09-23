import React, { useState, useEffect } from 'react';
import { Shield, Play, Flame, Clock, Award, BookOpen, ChevronRight } from 'lucide-react';
import { api } from '../api';

export default function DashboardView({ user, onStartSessionClick, onResumeActiveSession }) {
  const [analytics, setAnalytics] = useState({
    totalFocusedTime: 0,
    sessionsCompleted: 0,
    streak: 0,
    averageScore: 0
  });
  const [activeSession, setActiveSession] = useState(null);
  const [topics, setTopics] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [analData, activeData, topicsData, sessionsData] = await Promise.all([
        api.getAnalytics().catch(() => ({ analytics: {} })),
        api.getActiveSession().catch(() => ({ session: null })),
        api.getTopicMastery().catch(() => ({ topics: [] })),
        api.getSessions().catch(() => ({ sessions: [] }))
      ]);

      if (analData.analytics) setAnalytics(analData.analytics);
      if (activeData.session) setActiveSession(activeData.session);
      if (topicsData.topics) setTopics(topicsData.topics);
      if (sessionsData.sessions) setRecentSessions(sessionsData.sessions.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--primary-light) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span className="badge badge-cyan">Student Dashboard</span>
              <span className="badge badge-emerald">Focus Mode Active</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 6px 0' }}>
              Welcome Back, {user.name}!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Eliminate smartphone distractions and verify learning with AI assessments.
            </p>
          </div>

          {activeSession ? (
            <div style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--glass-border-hover)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase' }}>
                  Active Focus Session
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700' }}>{activeSession.topic}</div>
              </div>
              <button onClick={() => onResumeActiveSession(activeSession)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                Resume <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <button onClick={onStartSessionClick} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              <Play size={20} /> Start Focus Study Session
            </button>
          )}
        </div>
      </div>

      {/* Hero Stats Cards (4 Columns on Desktop, 2 Columns on Mobile) */}
      <div className="desktop-grid-4">
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '6px' }}>
            <Clock size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>Focused Time</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
            {analytics.totalFocusedTime || 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>mins</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--amber)', marginBottom: '6px' }}>
            <Flame size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>Study Streak</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
            {analytics.streak || 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>days</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald)', marginBottom: '6px' }}>
            <BookOpen size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>Sessions</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
            {analytics.sessionsCompleted || 0}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '6px' }}>
            <Award size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>Avg Score</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
            {analytics.averageScore || 0}%
          </div>
        </div>
      </div>

      {/* Grid Section: Topic Mastery & Recent Sessions (2 Columns on Desktop, Stacked on Mobile) */}
      <div className="desktop-grid-2">
        {/* Topic Mastery Overview */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Topic Mastery Levels</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Outcome Verified</span>
          </div>

          {topics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No topic mastery scores yet. Complete your first focus session!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topics.map(t => (
                <div key={t._id || t.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>
                    <span>{t.topic}</span>
                    <span style={{ color: 'var(--primary)' }}>{t.masteryScore}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${t.masteryScore}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Session Activity */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Recent Sessions</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>History Log</span>
          </div>

          {recentSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No study history recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentSessions.map(s => (
                <div
                  key={s._id || s.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{s.topic}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.actualDuration || s.plannedDuration} mins • {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${s.status.includes('COMPLETED') ? 'badge-emerald' : 'badge-purple'}`}>
                      {s.status.includes('COMPLETED') ? 'Completed' : s.status}
                    </span>
                    {s.score !== null && (
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>
                        {s.score}/100
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
