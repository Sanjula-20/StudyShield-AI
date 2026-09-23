import React, { useState, useEffect } from 'react';
import { Shield, Clock, Bot, Youtube, FileText, Lock, Play, Pause, Send, Plus, Trash2, X, AlertTriangle, ExternalLink, RefreshCw, Smartphone } from 'lucide-react';
import { api } from '../api';

const SYSTEM_APPS = [
  { id: 'com.instagram.android', name: 'Instagram', icon: '📷', category: 'Social Media' },
  { id: 'com.snapchat.android', name: 'Snapchat', icon: '👻', category: 'Social Media' },
  { id: 'com.google.android.youtube', name: 'YouTube App', icon: '▶️', category: 'Video Streaming' },
  { id: 'com.supercell.clashofclans', name: 'Clash of Clans', icon: '🎮', category: 'Gaming' },
  { id: 'com.zhiliaoapp.musically', name: 'TikTok', icon: '🎵', category: 'Short Video' },
  { id: 'com.android.chrome', name: 'Chrome Browser', icon: '🌐', category: 'Web Browsing' }
];

export default function FocusModeView({ session, onSessionCompleted, onCancelSession, isPhoneFrame }) {
  const [activeTab, setActiveTab] = useState('tutor'); // 'tutor' | 'youtube' | 'notes'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Real-time Native App Interception State
  const [blockedOverlayApp, setBlockedOverlayApp] = useState(null);
  const [customPackageInput, setCustomPackageInput] = useState('');
  const [activeForegroundPkg, setActiveForegroundPkg] = useState('com.studyshield.app');

  // AI Tutor State
  const [tutorMessages, setTutorMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your StudyShield AI Tutor for **${session.topic}**.\n\nYour goal: *"${session.learningGoal || 'Master concepts'}"*.\n\nAsk me any question or request code examples!`
    }
  ]);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);

  // YouTube State
  const [ytQuery, setYtQuery] = useState(session.topic);
  const [ytVideos, setYtVideos] = useState([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState(null);
  const [ytMetadata, setYtMetadata] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [quickVideoNote, setQuickVideoNote] = useState('');
  const [savingVideoNote, setSavingVideoNote] = useState(false);

  // Notes State
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  // Initial Data Load
  useEffect(() => {
    loadNotes();
    loadVideos(session.topic);
  }, [session._id]);

  const loadNotes = async () => {
    try {
      const data = await api.getNotes(session._id, session.topic);
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Failed to load notes', err);
    }
  };

  const loadVideos = async (q) => {
    setYtLoading(true);
    setYtError(null);
    try {
      const data = await api.searchYouTube(q, session.topic, session.subtopic);
      setYtVideos(data.items || []);
      setYtMetadata({
        isFallback: data.isFallback,
        isQuotaExceeded: data.isQuotaExceeded,
        message: data.message,
        count: data.count
      });
    } catch (err) {
      console.error('Failed to load videos', err);
      setYtError(err.message || 'Unable to load educational videos. Please try again.');
      setYtVideos([]);
    } finally {
      setYtLoading(false);
    }
  };

  const handleSaveVideoNote = async (video) => {
    if (!quickVideoNote.trim() || savingVideoNote) return;
    setSavingVideoNote(true);
    try {
      await api.createNote({
        sessionId: session._id,
        topic: session.topic,
        title: `Video Note: ${video.title.substring(0, 30)}...`,
        content: `${quickVideoNote.trim()}\n\n[Reference Video: ${video.title} (${video.channelTitle})]`
      });
      setQuickVideoNote('');
      await loadNotes();
    } catch (err) {
      console.error('Failed to save video note', err);
    } finally {
      setSavingVideoNote(false);
    }
  };


  // Real-time OS Package Switcher Intercept Handler
  const handleSimulateAppSwitch = (app) => {
    setActiveForegroundPkg(app.id);
    const blockedAppsList = session.blockedApps || ['Instagram', 'YouTube', 'Snapchat', 'Games', 'TikTok'];

    // Check if package name or label matches restricted list
    const isRestricted = blockedAppsList.some(b =>
      app.name.toLowerCase().includes(b.toLowerCase()) ||
      app.id.toLowerCase().includes(b.toLowerCase()) ||
      b.toLowerCase().includes(app.name.toLowerCase())
    );

    if (isRestricted) {
      setBlockedOverlayApp(app);
    } else {
      setBlockedOverlayApp(null);
    }
  };

  // AI Tutor Submit
  const handleSendTutorMessage = async (e) => {
    e.preventDefault();
    if (!tutorInput.trim() || tutorLoading) return;

    const userText = tutorInput;
    setTutorInput('');
    setTutorMessages(prev => [...prev, { role: 'user', content: userText }]);
    setTutorLoading(true);

    try {
      const response = await api.sendTutorMessage({
        topic: session.topic,
        subtopic: session.subtopic,
        learningGoal: session.learningGoal,
        message: userText,
        sessionId: session._id
      });
      setTutorMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setTutorMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an issue. Please try again.' }]);
    } finally {
      setTutorLoading(false);
    }
  };

  // Save Note
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || noteSaving) return;

    setNoteSaving(true);
    try {
      const data = await api.createNote({
        topic: session.topic,
        title: noteTitle || `${session.topic} Key Takeaway`,
        content: noteContent,
        sessionId: session._id
      });
      setNoteTitle('');
      setNoteContent('');
      setNotes(prev => [data.note, ...prev]);
    } catch (err) {
      console.error('Failed to save note', err);
    } finally {
      setNoteSaving(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id) => {
    try {
      await api.deleteNote(id);
      setNotes(prev => prev.filter(n => n._id !== id && n.id !== id));
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  // Timer Calculations
  const plannedSeconds = (session.plannedDuration || 45) * 60;
  const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds);
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const actualMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

  const handleTogglePause = async () => {
    const nextPauseState = !isPaused;
    setIsPaused(nextPauseState);
    const nextStatus = nextPauseState ? 'PAUSED' : 'ACTIVE';
    try {
      await api.updateSessionStatus(session._id, nextStatus, actualMinutes);
    } catch (err) {
      console.error('Failed to sync session status', err);
    }
  };

  const handleFinishEarly = async () => {
    const sessId = session._id || session.id;
    const isEarly = elapsedSeconds < plannedSeconds;
    try {
      await api.updateSessionStatus(sessId, isEarly ? 'EARLY_COMPLETED' : 'COMPLETED', actualMinutes);
    } catch (err) {
      console.error('Failed to complete session status', err);
    } finally {
      if (onSessionCompleted) {
        onSessionCompleted(sessId, actualMinutes, isEarly);
      } else if (onCancelSession) {
        onCancelSession();
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      {/* REAL NATIVE ANDROID BLOCKING ACTIVITY OVERLAY */}
      {blockedOverlayApp && (
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
            Android Focus Mode Active
          </span>

          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '8px 0', color: '#fff' }}>
            {blockedOverlayApp.name} ({blockedOverlayApp.icon}) Restricted
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '380px', lineHeight: '1.6', marginBottom: '24px' }}>
            You are currently studying:<br />
            <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{session.topic}</strong>
            <br /><br />
            Package: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{blockedOverlayApp.id}</code>
          </p>

          <div style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '28px', maxWidth: '380px' }}>
            Intercepted via Android AccessibilityService & UsageStatsManager Policy.
          </div>

          <button
            onClick={() => {
              setBlockedOverlayApp(null);
              setActiveForegroundPkg('com.studyshield.app');
            }}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '1rem', minWidth: '280px' }}
          >
            Return to StudyShield Workspace
          </button>
        </div>
      )}

      {/* Top Header Bar with Live Timer & Controls */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-cyan">Focus Active</span>
              <span className="badge badge-purple">{session.topic}</span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }}>
              {session.topic} {session.subtopic ? `• ${session.subtopic}` : ''}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Goal: {session.learningGoal || 'Master core principles'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Remaining Time</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)' }}>
                {formatTime(remainingSeconds)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleTogglePause}
                className="btn btn-secondary"
                style={{ padding: '10px 14px' }}
              >
                {isPaused ? <Play size={18} color="var(--emerald)" /> : <Pause size={18} />}
              </button>
              <button
                onClick={handleFinishEarly}
                className="btn btn-accent"
                style={{ padding: '10px 16px', fontSize: '0.85rem' }}
              >
                Finish & Take Assessment
              </button>
            </div>
          </div>
        </div>

        {/* REAL-TIME OS APP SWITCHER INTERCEPTION MONITOR */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={16} /> Real-Time OS Package Switcher (Test Native Interception):
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Foreground: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>{activeForegroundPkg}</code>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {SYSTEM_APPS.map(app => {
              const isRestricted = (session.blockedApps || ['Instagram', 'YouTube', 'Snapchat', 'Games', 'TikTok']).some(b =>
                app.name.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(app.name.toLowerCase())
              );
              return (
                <button
                  key={app.id}
                  onClick={() => handleSimulateAppSwitch(app)}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: isRestricted ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${isRestricted ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    color: isRestricted ? '#fb7185' : '#34d399',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={isRestricted ? `Restricted! Intercepts ${app.id}` : `Allowed App`}
                >
                  <span>{app.icon}</span>
                  <span>{app.name}</span>
                  {isRestricted ? <span>🔒</span> : <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="desktop-grid-workspace">
        {/* Sidebar Nav */}
        <div className="glass-panel" style={{ padding: '16px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Learning Tools
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('tutor')}
              className={`btn ${activeTab === 'tutor' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
            >
              <Bot size={18} />
              <span>AI Tutor Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('youtube')}
              className={`btn ${activeTab === 'youtube' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
            >
              <Youtube size={18} />
              <span>Educational Videos</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`btn ${activeTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
            >
              <FileText size={18} />
              <span>Study Notes</span>
            </button>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => onCancelSession(session._id, actualMinutes)}
              className="btn btn-danger"
              style={{ width: '100%', padding: '10px', fontSize: '0.82rem' }}
            >
              Cancel Session
            </button>
          </div>
        </div>

        {/* Tool View Display */}
        <div className="glass-panel" style={{ padding: '20px', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
          {/* TAB 1: AI TUTOR */}
          {activeTab === 'tutor' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>AI Tutor Chat</h3>
                </div>
                <span className="badge badge-emerald">Session Context Active</span>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', paddingRight: '4px' }}>
                {tutorMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: msg.role === 'user'
                        ? 'var(--primary-light)'
                        : 'var(--bg-surface)',
                      border: `1px solid ${msg.role === 'user' ? 'var(--glass-border-hover)' : 'var(--glass-border)'}`,
                      fontSize: '0.88rem',
                      lineHeight: '1.5'
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: msg.role === 'user' ? 'var(--primary)' : 'var(--accent)', marginBottom: '3px' }}>
                      {msg.role === 'user' ? 'You' : 'AI Tutor'}
                    </div>
                    <div>
                      {(() => {
                        if (!msg.content) return null;
                        const lines = msg.content.split('\n');
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {lines.map((line, idx) => {
                              let trimmed = line.trim();
                              if (!trimmed) return <div key={idx} style={{ height: '4px' }} />;

                              // Headers ### or ## or #
                              if (trimmed.startsWith('#')) {
                                const headerText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/\$/g, '');
                                return (
                                  <div key={idx} style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--primary)', marginTop: '6px', marginBottom: '2px' }}>
                                    {headerText}
                                  </div>
                                );
                              }

                              // Code block demarcators ```
                              if (trimmed.startsWith('```')) {
                                return null;
                              }

                              // Bullet list item
                              const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
                              if (isBullet) {
                                trimmed = trimmed.replace(/^[-*]\s*/, '');
                              }

                              // Parse bold **text**
                              const parts = trimmed.split(/(\*\*.*?\*\*)/g);
                              const elements = parts.map((part, pIdx) => {
                                if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                                  return <strong key={pIdx} style={{ color: 'var(--text-main)', fontWeight: '700' }}>{part.slice(2, -2)}</strong>;
                                }
                                return part.replace(/\$/g, '');
                              });

                              if (isBullet) {
                                return (
                                  <div key={idx} style={{ display: 'flex', gap: '6px', marginLeft: '6px' }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
                                    <div>{elements}</div>
                                  </div>
                                );
                              }

                              return (
                                <div key={idx}>
                                  {elements}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}

                {tutorLoading && (
                  <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.8)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    AI Tutor is writing a response...
                  </div>
                )}
              </div>

              {/* Chat Input & Quick Action Chips */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  <button
                    type="button"
                    onClick={() => { setTutorInput('Give me a Hint'); }}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    💡 Hint
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTutorInput('Give me a Real-World Example'); }}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    🧩 Real-World Example
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTutorInput('Simplify this concept'); }}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c084fc', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    🔍 Simplify
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTutorInput('Compare with alternative approach'); }}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ⚖️ Compare
                  </button>
                </div>

                <form onSubmit={handleSendTutorMessage} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder={`Ask a question about ${session.topic}...`}
                    value={tutorInput}
                    onChange={(e) => setTutorInput(e.target.value)}
                    className="input-field"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 18px' }} disabled={tutorLoading}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: EDUCATIONAL YOUTUBE */}
          {activeTab === 'youtube' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Youtube size={20} color="var(--rose)" />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>Controlled Educational Search</h3>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Topic: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{session.topic}</span>
                      {session.subtopic && <span> • Subtopic: <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{session.subtopic}</span></span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-cyan">Controlled API</span>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>🔒 Key Secured</span>
                </div>
              </div>

              {/* Security & Scope Disclaimer Banner */}
              <div style={{
                fontSize: '0.75rem',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Shield size={14} color="var(--primary)" />
                <span>
                  StudyShield isolates educational video search. Unrestricted YouTube browsing and non-academic recommendations are blocked.
                </span>
              </div>

              {/* Fallback / Quota Status Notice */}
              {ytMetadata?.isFallback && (
                <div style={{
                  fontSize: '0.75rem',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} />
                    <span>{ytMetadata.message || 'Serving curated educational resources database.'}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>5 Filtered Items</span>
                </div>
              )}

              {/* API Error Alert Banner */}
              {ytError && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between'
                }}>
                  <span>{ytError}</span>
                  <button
                    onClick={() => loadVideos(ytQuery)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              )}

              {/* Search Bar & Educational Category Quick Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  <button
                    type="button"
                    onClick={() => { const q = `${session.topic} Full Lecture`; setYtQuery(q); loadVideos(q); }}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    🎓 Full Lecture
                  </button>
                  <button
                    type="button"
                    onClick={() => { const q = `${session.topic} Visual Diagram`; setYtQuery(q); loadVideos(q); }}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    🎨 Visual Diagram
                  </button>
                  <button
                    type="button"
                    onClick={() => { const q = `${session.topic} Crash Course`; setYtQuery(q); loadVideos(q); }}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c084fc', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ⚡ Crash Course
                  </button>
                  <button
                    type="button"
                    onClick={() => { const q = `${session.topic} Exercises`; setYtQuery(q); loadVideos(q); }}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ✏️ Exercises
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); loadVideos(ytQuery); }} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder={`Search educational videos for ${session.topic}...`}
                    value={ytQuery}
                    onChange={(e) => setYtQuery(e.target.value)}
                    className="input-field"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '0 18px' }} disabled={ytLoading}>
                    {ytLoading ? 'Searching...' : 'Search'}
                  </button>
                </form>
              </div>

              {/* Active Embedded Video Player & Quick Note Integration */}
              {activeVideo && (
                <div className="glass-panel" style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--primary)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>{activeVideo.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Channel: {activeVideo.channelTitle} • Duration: {activeVideo.duration}</div>
                    </div>
                    <button
                      onClick={() => setActiveVideo(null)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <X size={14} /> Return to Study Workspace
                    </button>
                  </div>

                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', marginBottom: '12px' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1`}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      allowFullScreen
                      title={activeVideo.title}
                    ></iframe>
                  </div>

                  {/* Quick Note Taking Shortcut during Video Watch */}
                  <div style={{ paddingTop: '10px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Take a quick note while watching this video..."
                      value={quickVideoNote}
                      onChange={(e) => setQuickVideoNote(e.target.value)}
                      className="input-field"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '6px 12px' }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveVideoNote(activeVideo); } }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveVideoNote(activeVideo)}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      disabled={savingVideoNote || !quickVideoNote.trim()}
                    >
                      {savingVideoNote ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {ytLoading && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Searching educational videos...
                </div>
              )}

              {/* Empty State when zero results returned */}
              {!ytLoading && !ytError && ytVideos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No educational videos found for this topic query. Try broadening your query or selecting a filter chip above.
                </div>
              )}

              {/* Video List (Approximately 5 Filtered Results) */}
              {!ytLoading && (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ytVideos.map(video => (
                    <div
                      key={video.id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--glass-border)',
                        transition: 'border-color 0.2s ease',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div style={{ position: 'relative', minWidth: '110px', width: '110px', height: '68px', borderRadius: '6px', overflow: 'hidden' }}>
                        <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          padding: '2px 5px',
                          borderRadius: '4px'
                        }}>
                          {video.duration || '15 mins'}
                        </span>
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <h4 style={{ fontSize: '0.86rem', fontWeight: '700', margin: 0, color: 'var(--text-main)', lineHeight: '1.3' }}>
                          {video.title}
                        </h4>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {video.channelTitle} • Published: {video.publishedAt}
                        </div>
                        <p style={{
                          fontSize: '0.73rem',
                          color: 'var(--text-muted)',
                          margin: '2px 0 6px 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.3'
                        }}>
                          {video.description}
                        </p>
                        <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setActiveVideo(video)}
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Play size={12} /> Watch Educational Video
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* TAB 3: NOTES */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>Topic Study Notes</h3>
                </div>
                <span className="badge badge-purple">{notes.length} Notes</span>
              </div>

              <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Note Title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="input-field"
                />
                <textarea
                  placeholder="Write your study notes here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="input-field"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '0.82rem' }} disabled={noteSaving}>
                  <Plus size={16} /> Save Note
                </button>
              </form>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notes.map(note => (
                  <div key={note._id || note.id} style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--primary)' }}>{note.title}</h4>
                      <button onClick={() => handleDeleteNote(note._id || note.id)} style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
