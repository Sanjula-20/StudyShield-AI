import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, BookOpen, Clock, Flame, Award, AlertTriangle, Play, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { api } from '../api';

export default function AnalyticsView({ onStartFocus }) {
  const [topics, setTopics] = useState([]);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'today', 'week', 'month'
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL', 'COMPLETED', 'EARLY_COMPLETED', 'INTERRUPTED'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [historyFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicsRes, historyRes, analRes] = await Promise.all([
        api.getTopicMastery(),
        api.getHistory(historyFilter === 'ALL' ? '' : historyFilter, searchTerm),
        api.getAnalytics()
      ]);
      setTopics(topicsRes.topics || []);
      setHistory(historyRes.history || []);
      setAnalytics(analRes.analytics || {});
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredHistory = history.filter(h => 
    !searchTerm || h.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMinutes = (mins) => {
    if (!mins || mins === 0) return '0m';
    const hours = Math.floor(mins / 60);
    const remainder = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remainder > 0 ? remainder + 'm' : ''}`;
    }
    return `${mins}m`;
  };

  const getFocusedTimeForRange = () => {
    switch (timeRange) {
      case 'today': return analytics.dailyFocusedTime || 0;
      case 'week': return analytics.weeklyFocusedTime || 0;
      case 'month': return analytics.monthlyFocusedTime || 0;
      default: return analytics.totalFocusedTime || 0;
    }
  };

  const getTrendBadge = (trend) => {
    if (trend === 'improving') {
      return <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>Improving ↗</span>;
    } else if (trend === 'declining') {
      return <span className="badge badge-rose" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>Declining ↘</span>;
    }
    return <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>Stable ➔</span>;
  };

  const weakTopics = analytics.weakTopics || topics.filter(t => t.masteryScore < 60);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Header & Focus Time Controls */}
      <div className="glass-panel glass-glow" style={{ padding: '18px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '4px' }}>
              Progress & Analytics
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>
              Study Performance
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Overall Avg</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
              {analytics.averageScore || 0}%
            </div>
          </div>
        </div>

        {/* Time Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: 'All-Time' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: '7 Days' },
            { id: 'month', label: '30 Days' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeRange(tab.id)}
              className="btn btn-secondary"
              style={{
                padding: '4px 10px',
                fontSize: '0.72rem',
                borderRadius: 'var(--radius-full)',
                background: timeRange === tab.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
                color: timeRange === tab.id ? '#000' : 'var(--text-main)',
                fontWeight: timeRange === tab.id ? '800' : '600',
                border: 'none',
                minHeight: '28px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Summary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {/* Focused Time */}
        <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700' }}>
            <Clock size={14} /> Focused Time
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {formatMinutes(getFocusedTimeForRange())}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            {timeRange === 'all' ? 'Total accumulated' : `Focus during ${timeRange}`}
          </div>
        </div>

        {/* Study Streak */}
        <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '0.75rem', fontWeight: '700' }}>
            <Flame size={14} /> Daily Streak
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {analytics.streak || 0} Days
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            Consecutive study days
          </div>
        </div>

        {/* Sessions Completed */}
        <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.75rem', fontWeight: '700' }}>
            <CheckCircle size={14} /> Completed
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {analytics.completedSessions || 0}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            {analytics.earlyCompletedSessions || 0} early completed
          </div>
        </div>

        {/* Interrupted Sessions */}
        <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '0.75rem', fontWeight: '700' }}>
            <AlertCircle size={14} /> Interrupted
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {analytics.interruptedSessions || 0}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            {analytics.totalSessions ? Math.round((analytics.interruptedSessions / analytics.totalSessions) * 100) : 0}% rate
          </div>
        </div>
      </div>

      {/* Weak Topics Warning Alert (if any weak topics exist) */}
      {weakTopics && weakTopics.length > 0 && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '14px', 
            background: 'rgba(244, 63, 94, 0.08)', 
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#f43f5e', fontWeight: '800', fontSize: '0.9rem' }}>
            <AlertTriangle size={18} /> Weak Topics Needing Review
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
            These topics have mastery scores below 60%. Schedule a focused session to reinforce key concepts.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {weakTopics.map(wt => (
              <div 
                key={wt.topic} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '6px 10px', 
                  background: 'rgba(15, 23, 42, 0.8)', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>{wt.topic}</span>
                <span className="badge badge-rose" style={{ padding: '2px 6px', fontSize: '0.68rem' }}>
                  {wt.masteryScore}%
                </span>
                {onStartFocus && (
                  <button
                    onClick={() => onStartFocus(wt.topic)}
                    className="btn btn-primary"
                    style={{ padding: '2px 8px', fontSize: '0.68rem', minHeight: '22px' }}
                  >
                    <Play size={10} style={{ marginRight: '3px' }} /> Focus
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics Mastery List */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <TrendingUp size={18} color="var(--primary)" /> Topic Mastery Breakdown
        </h3>

        {topics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No topic data registered yet. Complete a study session & assessment to build your topic mastery profile.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topics.map(t => (
              <div key={t._id || t.id} style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                    {t.topic}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {t.isWeakTopic && <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>Needs Review</span>}
                    {getTrendBadge(t.trend)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>
                    {t.masteryScore}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Avg Assessment: {t.averageScore || t.masteryScore}%
                  </div>
                </div>

                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${t.masteryScore}%`, 
                      height: '100%', 
                      background: t.masteryScore >= 75 
                        ? 'linear-gradient(90deg, #10b981 0%, #00f2fe 100%)'
                        : t.masteryScore >= 60 
                        ? 'linear-gradient(90deg, #00f2fe 0%, #7f00ff 100%)'
                        : 'linear-gradient(90deg, #f43f5e 0%, #f59e0b 100%)'
                    }} 
                  />
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sessions: {t.totalSessions || 1} ({formatMinutes(t.totalFocusedMinutes)})</span>
                  <span>Previous Score: {t.previousScore || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Log */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <BookOpen size={18} color="var(--accent)" /> Session History
            </h3>
            <input
              type="text"
              placeholder="Search topic..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="input-field"
              style={{ width: '130px', minHeight: '32px', padding: '4px 8px', fontSize: '0.75rem' }}
            />
          </div>

          {/* History Filter Tabs */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'INTERRUPTED', label: 'Interrupted' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setHistoryFilter(f.id)}
                className="btn btn-secondary"
                style={{
                  padding: '3px 8px',
                  fontSize: '0.68rem',
                  borderRadius: 'var(--radius-sm)',
                  background: historyFilter === f.id ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  border: 'none',
                  minHeight: '24px'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No sessions match the current filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredHistory.map(s => {
              const isDone = s.status === 'COMPLETED' || s.status === 'EARLY_COMPLETED';
              return (
                <div
                  key={s._id || s.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.topic}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Actual: {s.actualDuration || s.plannedDuration}m (Planned: {s.plannedDuration}m)
                    </div>
                    {s.learningGoal && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                        Goal: {s.learningGoal}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={`badge ${isDone ? 'badge-emerald' : 'badge-rose'}`}>
                      {s.status === 'EARLY_COMPLETED' ? 'Early Done' : s.status === 'COMPLETED' ? 'Completed' : s.status}
                    </span>
                    {s.score !== undefined && s.score !== null && (
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>
                        Score: {s.score}%
                      </div>
                    )}
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {new Date(s.createdAt || s.startTime).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
