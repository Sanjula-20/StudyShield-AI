import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, BookOpen } from 'lucide-react';
import { api } from '../api';

export default function AnalyticsView() {
  const [topics, setTopics] = useState([]);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicsRes, historyRes, analRes] = await Promise.all([
        api.getTopicMastery(),
        api.getHistory(),
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

  const filteredHistory = filterTopic
    ? history.filter(h => h.topic.toLowerCase().includes(filterTopic.toLowerCase()))
    : history;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Header */}
      <div className="glass-panel glass-glow" style={{ padding: '18px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '4px' }}>
              Progress Analytics
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>
              Topic Mastery
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Overall Avg</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
              {analytics.averageScore || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Topics Mastery List (Single Column Stack on Mobile) */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <TrendingUp size={18} color="var(--primary)" /> Mastery Levels
        </h3>

        {topics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No topic data registered yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topics.map(t => (
              <div key={t._id || t.id} style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{t.topic}</span>
                  <span className={`badge ${t.trend === 'improving' ? 'badge-emerald' : 'badge-purple'}`}>
                    {t.trend || 'stable'}
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '4px' }}>
                  {t.masteryScore}%
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${t.masteryScore}%`, height: '100%', background: 'linear-gradient(90deg, #00f2fe 0%, #7f00ff 100%)' }}></div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sessions: {t.totalSessions || 1}</span>
                  <span>Previous: {t.previousScore || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Log */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={18} color="var(--accent)" /> History Log
          </h3>
          <input
            type="text"
            placeholder="Filter..."
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="input-field"
            style={{ width: '110px', minHeight: '34px', padding: '4px 8px', fontSize: '0.75rem' }}
          />
        </div>

        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No sessions found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredHistory.map(s => (
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
                <div style={{ overflow: 'hidden', pr: '6px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.topic}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Actual: {s.actualDuration || s.plannedDuration}m
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className={`badge ${s.status.includes('COMPLETED') ? 'badge-emerald' : 'badge-rose'}`}>
                    {s.status.includes('COMPLETED') ? 'Done' : s.status}
                  </span>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
