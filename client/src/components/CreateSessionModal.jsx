import React, { useState } from 'react';
import { Shield, Clock, BookOpen, Target, Lock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api } from '../api';

const SAMPLE_TOPICS = [
  'Data Structures & Algorithms',
  'Operating Systems & Kernel',
  'Machine Learning & Neural Nets',
  'Quantum Physics & Mechanics',
  'Organic Chemistry Synthesis',
  'System Design & Microservices'
];

const AVAILABLE_APPS = [
  { id: 'Instagram', label: 'Instagram', category: 'Social Media' },
  { id: 'YouTube', label: 'YouTube (Unrestricted)', category: 'Video Streaming' },
  { id: 'Snapchat', label: 'Snapchat', category: 'Social Media' },
  { id: 'Games', label: 'Mobile Games', category: 'Gaming' },
  { id: 'TikTok', label: 'TikTok', category: 'Short Video' },
  { id: 'Twitter', label: 'Twitter / X', category: 'Social Media' }
];

export default function CreateSessionModal({ isOpen, onClose, onSessionStarted }) {
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [plannedDuration, setPlannedDuration] = useState(45);
  const [selectedApps, setSelectedApps] = useState(['Instagram', 'YouTube', 'Snapchat', 'Games']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleApp = (appId) => {
    if (selectedApps.includes(appId)) {
      setSelectedApps(selectedApps.filter(id => id !== appId));
    } else {
      setSelectedApps([...selectedApps, appId]);
    }
  };

  const handleStartSession = async () => {
    if (!topic || !plannedDuration) {
      setError('Please provide a topic and planned study duration.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await api.createSession({
        topic,
        subtopic,
        learningGoal,
        plannedDuration,
        blockedApps: selectedApps,
        blockedWebsites: ['instagram.com', 'youtube.com', 'tiktok.com', 'snapchat.com', 'twitter.com', 'facebook.com']
      });
      onSessionStarted(data.session);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to start Focus Mode study session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(4, 9, 20, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel glass-glow" style={{
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--glass-border-hover)'
            }}>
              <Shield size={22} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Configure Study Session</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Set your learning goal and restriction rules</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Quick Scenario Preset Button */}
        <div style={{
          background: 'var(--accent-light)',
          border: '1px solid var(--glass-border-hover)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase' }}>
              Standard Study Scenario
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
              Data Structures (BST) • 90 mins • Restrict Instagram, Snapchat & YouTube
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setTopic('Data Structures & Algorithms');
              setSubtopic('Binary Search Trees');
              setLearningGoal('Understand BST insertion, deletion, and rotation principles.');
              setPlannedDuration(90);
              setSelectedApps(['Instagram', 'Snapchat', 'YouTube', 'Games']);
            }}
            className="btn btn-accent"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            Load Preset
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--rose-light)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--rose)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Topic Selector / Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
              Study Topic *
            </label>
            <input
              type="text"
              className="input-field"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Data Structures & Algorithms"
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {SAMPLE_TOPICS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: topic === t ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${topic === t ? 'var(--primary)' : 'var(--glass-border)'}`,
                    color: topic === t ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Subtopic */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
              Subtopic (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              placeholder="e.g. Binary Search Trees & Balancing"
            />
          </div>

          {/* Learning Goal */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
              Learning Goal / Objective
            </label>
            <input
              type="text"
              className="input-field"
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              placeholder="e.g. Understand insertion, deletion, and AVL tree rotations"
            />
          </div>

          {/* Planned Duration */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
              Session Duration (Minutes) *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {[15, 30, 45, 60, 90, 120].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setPlannedDuration(mins)}
                  className={`btn ${plannedDuration === mins ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 4px', fontSize: '0.82rem', justifyContent: 'center' }}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Application Restriction Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
              Restricted Applications & Distractions
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {AVAILABLE_APPS.map(app => {
                const isSelected = selectedApps.includes(app.id);
                return (
                  <div
                    key={app.id}
                    onClick={() => toggleApp(app.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-light)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{app.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{app.category}</div>
                    </div>
                    {isSelected ? <CheckCircle2 size={18} color="var(--accent)" /> : <Lock size={16} color="var(--text-dim)" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Android Permissions Status Indicator */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={20} color="var(--emerald)" />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: '700', color: 'var(--emerald)' }}>Android Focus Mode Ready:</span> Usage Access & Overlay Permissions active.
            </div>
          </div>

          {/* Submit CTA */}
          <button
            onClick={handleStartSession}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Initializing Focus Mode...' : 'Start Focus Mode Study Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
