/**
 * BROWSER SECURITY LIMITATION NOTICE:
 * In standard desktop web applications (running inside Google Chrome, Firefox, Edge, Safari),
 * client-side JavaScript execution is sandboxed within the current tab origin (e.g. localhost:3000).
 * Same-origin browser security policies prevent client-side web scripts from programmatically
 * closing, modifying, or blocking external tabs opened directly in the user's browser (e.g. youtube.com or instagram.com).
 *
 * To enforce web focus, StudyShield implements:
 * 1. Real tab-switch detection via Page Visibility API (`visibilitychange` / `document.hidden`).
 * 2. Real window-focus loss detection (`blur` / `focus`).
 * 3. Event deduplication using a timestamp lock to prevent double-counting single user actions.
 * 4. Progressive violation tracking (0 = ACTIVE, 1-2 = Warning Modal on return, 3 = AUTO-PAUSE session & stop timer).
 * 5. Persistent timestamp-based real study timer (restored on page refresh via localStorage).
 * 6. Controlled Educational YouTube Search inside StudyShield to keep students focused.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Clock, Bot, Youtube, FileText, Lock, Play, Pause, Send, Plus, Trash2, X, AlertTriangle, RefreshCw, Smartphone, Globe } from 'lucide-react';
import { api } from '../api';

const ACTIVE_SESSION_STORAGE_KEY = 'studyshield_active_session';

const SYSTEM_APPS = [
  { id: 'instagram.com', name: 'Instagram', icon: '📷', category: 'Social Media Website', type: 'WEBSITE' },
  { id: 'youtube.com', name: 'YouTube (Unrestricted)', icon: '▶️', category: 'Video Streaming Website', type: 'WEBSITE' },
  { id: 'snapchat.com', name: 'Snapchat', icon: '👻', category: 'Social Media Website', type: 'WEBSITE' },
  { id: 'tiktok.com', name: 'TikTok', icon: '🎵', category: 'Short Video Website', type: 'WEBSITE' },
  { id: 'facebook.com', name: 'Facebook', icon: '📘', category: 'Social Media Website', type: 'WEBSITE' },
  { id: 'twitter.com', name: 'Twitter / X', icon: '🐦', category: 'Social Media Website', type: 'WEBSITE' },
  { id: 'com.supercell.clashofclans', name: 'Clash of Clans', icon: '🎮', category: 'Gaming App', type: 'APP' },
  { id: 'com.android.chrome', name: 'Chrome Browser', icon: '🌐', category: 'Web Browsing', type: 'APP' }
];

export default function FocusModeView({ session, onSessionCompleted, onCancelSession, isPhoneFrame }) {
  const sessId = session._id || session.id;

  // Session Status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  const [sessionStatus, setSessionStatus] = useState('ACTIVE');
  const sessionStatusRef = useRef('ACTIVE');

  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);
  
  // Timestamps for real timer persistence
  const [startTimeMs, setStartTimeMs] = useState(Date.now());
  const [accumulatedPauseMs, setAccumulatedPauseMs] = useState(0);
  const [pausedAtMs, setPausedAtMs] = useState(null);

  // Focus Violations: { count: number, events: [] }
  const [focusViolations, setFocusViolations] = useState({ count: 0, events: [] });
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showPausedModal, setShowPausedModal] = useState(false);

  // Time & Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Tab & In-App UI state
  const [activeTab, setActiveTab] = useState('tutor'); // 'tutor' | 'youtube' | 'notes' | 'browser'
  const [blockedOverlayApp, setBlockedOverlayApp] = useState(null);
  const [activeForegroundPkg, setActiveForegroundPkg] = useState('com.studyshield.app');

  // In-App Restricted Web Browser State
  const [browserUrlInput, setBrowserUrlInput] = useState('https://wikipedia.org');
  const [browserActiveUrl, setBrowserActiveUrl] = useState('https://wikipedia.org');
  const [browserBlocked, setBrowserBlocked] = useState(false);
  const [browserBlockedDomain, setBrowserBlockedDomain] = useState('');

  // Deduplication lock timestamp ref (500ms debounce)
  const lastViolationTimeRef = useRef(0);

  // AI Tutor State
  const [tutorMessages, setTutorMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! 👋 I'm your StudyShield AI Tutor for **${session.topic}**.\n\nTarget Goal: **"${(session.learningGoal || 'Master concepts').replace(/^["'\s]+|["'\s]+$/g, '')}"**\n\nHow can I help you today? You can ask me to explain concepts, write code snippets, solve math problems, or test your knowledge!`
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

  // 1. INITIAL SESSION MOUNT & REFRESH RESTORATION
  useEffect(() => {
    const stored = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    let start = Date.now();
    let accPause = 0;
    let pauseAt = null;
    let status = 'ACTIVE';
    let violations = { count: 0, events: [] };

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.sessionId === sessId || parsed._id === sessId || parsed.id === sessId)) {
          start = parsed.startTimeMs || start;
          accPause = parsed.accumulatedPauseMs || 0;
          pauseAt = parsed.pausedAtMs || null;
          status = parsed.status || 'ACTIVE';
          violations = parsed.focusViolations || { count: 0, events: [] };
        }
      } catch (e) {
        console.error('Failed to parse localStorage active session', e);
      }
    }

    setStartTimeMs(start);
    setAccumulatedPauseMs(accPause);
    setPausedAtMs(pauseAt);
    setSessionStatus(status);
    setFocusViolations(violations);

    if (violations.count >= 3) {
      handleAutoEndOnViolationLimit(violations);
      return;
    }

    attemptFullscreen();

    loadNotes();
    loadVideos(session.topic);
  }, [sessId]);

  const attemptFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen permission denied or unsupported:', err.message);
      });
    }
  };

  // Helper to persist active session snapshot to localStorage
  const saveSessionToStorage = (updatedFields = {}) => {
    const snapshot = {
      sessionId: sessId,
      _id: sessId,
      topic: session.topic,
      subtopic: session.subtopic,
      learningGoal: session.learningGoal,
      plannedDuration: session.plannedDuration,
      startTimeMs,
      accumulatedPauseMs,
      pausedAtMs,
      status: sessionStatus,
      focusViolations,
      ...updatedFields
    };
    localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
  };

  // 2. REAL TIMESTAMP TIMER ENGINE
  useEffect(() => {
    let interval = null;

    const calcElapsed = () => {
      let effectiveMs = 0;
      if (sessionStatus === 'ACTIVE') {
        effectiveMs = Date.now() - startTimeMs - accumulatedPauseMs;
      } else {
        effectiveMs = (pausedAtMs || Date.now()) - startTimeMs - accumulatedPauseMs;
      }
      const secs = Math.max(0, Math.floor(effectiveMs / 1000));
      setElapsedSeconds(secs);
    };

    calcElapsed();

    if (sessionStatus === 'ACTIVE') {
      interval = setInterval(() => {
        calcElapsed();
        saveSessionToStorage();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionStatus, startTimeMs, accumulatedPauseMs, pausedAtMs]);

  // 3. EVENT DEDUPLICATION & REAL FOCUS MONITORING
  const recordViolation = (type) => {
    if (sessionStatusRef.current !== 'ACTIVE') return;

    const now = Date.now();
    // 500ms lock window deduplication (prevents blur + visibilitychange double counting)
    if (now - lastViolationTimeRef.current < 500) {
      return;
    }
    lastViolationTimeRef.current = now;

    const eventObj = { type, timestamp: new Date().toISOString() };

    setFocusViolations(prev => {
      if (prev.count >= 3) {
        return { count: 3, events: prev.events };
      }

      const nextCount = Math.min(3, prev.count + 1);
      const nextEvents = [...prev.events, eventObj];
      const nextViolations = { count: nextCount, events: nextEvents };

      saveSessionToStorage({ focusViolations: nextViolations });

      if (nextCount >= 3) {
        handleAutoEndOnViolationLimit(nextViolations);
      } else {
        setShowWarningModal(true);
      }
      return nextViolations;
    });
  };

  // Automatic End Session when 3 violations limit is reached
  const handleAutoEndOnViolationLimit = async (violations) => {
    setSessionStatus('CANCELLED');
    sessionStatusRef.current = 'CANCELLED';
    setShowWarningModal(false);
    setShowPausedModal(false);

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);

    const actualMins = Math.max(1, Math.round(elapsedSeconds / 60));

    try {
      await api.cancelSession(sessId, actualMins);
    } catch (e) {
      console.error('Failed to sync cancelled session status with backend', e);
    } finally {
      if (onCancelSession) {
        onCancelSession(sessId, actualMins);
      } else if (onSessionCompleted) {
        onSessionCompleted(sessId, actualMins, true);
      }
    }
  };

  // 4. CLEAN EVENT LISTENERS SETUP & CLEANUP
  useEffect(() => {
    const handleVisibilityChange = () => {
      if ((document.hidden || document.visibilityState === 'hidden') && sessionStatusRef.current === 'ACTIVE') {
        recordViolation('TAB_SWITCH');
      }
    };

    const handleWindowBlur = () => {
      if (sessionStatusRef.current === 'ACTIVE') {
        recordViolation('WINDOW_BLUR');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && sessionStatusRef.current === 'ACTIVE') {
        recordViolation('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 5. RESUME FOCUS HANDLER
  const handleResumeFocus = async () => {
    const now = Date.now();
    let additionalPause = 0;
    if (pausedAtMs) {
      additionalPause = now - pausedAtMs;
    }
    const nextAccPause = accumulatedPauseMs + additionalPause;

    setAccumulatedPauseMs(nextAccPause);
    setPausedAtMs(null);
    setSessionStatus('ACTIVE');
    setShowWarningModal(false);
    setShowPausedModal(false);

    attemptFullscreen();

    const actualMins = Math.max(1, Math.round(elapsedSeconds / 60));
    try {
      await api.updateSessionStatus(sessId, 'ACTIVE', actualMins);
    } catch (e) {
      console.error('Failed to sync active status with backend', e);
    }

    saveSessionToStorage({
      status: 'ACTIVE',
      pausedAtMs: null,
      accumulatedPauseMs: nextAccPause
    });
  };

  // 6. TOGGLE MANUAL PAUSE/RESUME
  const handleToggleManualPause = async () => {
    if (sessionStatus === 'ACTIVE') {
      const now = Date.now();
      setSessionStatus('PAUSED');
      setPausedAtMs(now);
      const actualMins = Math.max(1, Math.round(elapsedSeconds / 60));
      try {
        await api.updateSessionStatus(sessId, 'PAUSED', actualMins);
      } catch (e) {}
      saveSessionToStorage({ status: 'PAUSED', pausedAtMs: now });
    } else {
      handleResumeFocus();
    }
  };

  // 7. END SESSION HANDLER
  const handleEndSession = async (isCompleted = true) => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);

    const plannedSecs = (session.plannedDuration || 45) * 60;
    const actualMins = Math.max(1, Math.round(elapsedSeconds / 60));
    const isEarly = elapsedSeconds < plannedSecs;

    try {
      if (isCompleted) {
        await api.completeSession(sessId, actualMins, isEarly);
      } else {
        await api.cancelSession(sessId, actualMins);
      }
    } catch (e) {
      console.error('Failed to update final session state', e);
    } finally {
      if (isCompleted && onSessionCompleted) {
        onSessionCompleted(sessId, actualMins, isEarly);
      } else if (onCancelSession) {
        onCancelSession(sessId, actualMins);
      }
    }
  };

  // Calculate Timer Displays
  const plannedSeconds = (session.plannedDuration || 45) * 60;
  const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds);
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Data Handlers
  const loadNotes = async () => {
    try {
      const data = await api.getNotes(sessId, session.topic);
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
        sessionId: sessId,
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

  const handleNavigateInAppBrowser = (targetUrl) => {
    const raw = targetUrl.trim().toLowerCase();
    if (!raw) return;

    const cleanDomain = raw.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    const blockedAppsList = session.blockedApps || ['Instagram', 'YouTube', 'Snapchat', 'Games', 'TikTok', 'Twitter'];
    const blockedWebsitesList = session.blockedWebsites || ['instagram.com', 'youtube.com', 'tiktok.com', 'snapchat.com', 'twitter.com', 'facebook.com'];

    const isRestricted = blockedAppsList.some(b => cleanDomain.includes(b.toLowerCase()) || b.toLowerCase().includes(cleanDomain)) ||
      blockedWebsitesList.some(b => cleanDomain.includes(b.toLowerCase()) || b.toLowerCase().includes(cleanDomain)) ||
      /instagram|youtube|tiktok|snapchat|facebook|twitter|reddit|netflix/.test(cleanDomain);

    if (isRestricted) {
      setBrowserBlocked(true);
      setBrowserBlockedDomain(cleanDomain);
      setBrowserActiveUrl(raw);
    } else {
      setBrowserBlocked(false);
      setBrowserBlockedDomain('');
      setBrowserActiveUrl(raw.startsWith('http') ? raw : `https://${raw}`);
    }
  };

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
        sessionId: sessId
      });
      setTutorMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setTutorMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an issue. Please try again.' }]);
    } finally {
      setTutorLoading(false);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || noteSaving) return;

    setNoteSaving(true);
    try {
      const data = await api.createNote({
        topic: session.topic,
        title: noteTitle || `${session.topic} Key Takeaway`,
        content: noteContent,
        sessionId: sessId
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

  const handleDeleteNote = async (id) => {
    try {
      await api.deleteNote(id);
      setNotes(prev => prev.filter(n => n._id !== id && n.id !== id));
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* 1. WARNING MODAL FOR VIOLATIONS 1 OR 2 */}
      {showWarningModal && sessionStatus === 'ACTIVE' && focusViolations.count < 3 && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div className="glass-panel glass-glow" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.2)', border: '2px solid #f59e0b',
              margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle size={32} color="#fbbf24" />
            </div>

            <span className="badge badge-amber" style={{ marginBottom: '10px' }}>
              FOCUS MODE WARNING
            </span>

            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '8px 0', color: '#fff' }}>
              You Left StudyShield
            </h3>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px' }}>
              You left StudyShield during your active study session for <strong>{session.topic}</strong>.
            </p>

            <div style={{
              background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', color: '#fbbf24',
              marginBottom: '24px', fontWeight: '700'
            }}>
              Focus Violations: {focusViolations.count} / 3
            </div>

            <button
              onClick={() => {
                setShowWarningModal(false);
                attemptFullscreen();
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              Return to Study
            </button>
          </div>
        </div>
      )}



      {/* Top Header Bar with Live Timer & Controls */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`badge ${sessionStatus === 'ACTIVE' ? 'badge-cyan' : 'badge-amber'}`}>
                {sessionStatus === 'ACTIVE' ? 'Focus Active' : 'Focus Paused'}
              </span>
              <span className="badge badge-purple">{session.topic}</span>
              <span className={`badge ${focusViolations.count > 0 ? 'badge-rose' : 'badge-emerald'}`}>
                Focus Violations: {Math.min(3, focusViolations.count)} / 3
              </span>
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
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: '800', color: sessionStatus === 'ACTIVE' ? 'var(--primary)' : '#fbbf24' }}>
                {formatTime(remainingSeconds)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleToggleManualPause}
                className="btn btn-secondary"
                style={{ padding: '10px 14px' }}
                title={sessionStatus === 'ACTIVE' ? 'Pause Session' : 'Resume Session'}
              >
                {sessionStatus === 'ACTIVE' ? <Pause size={18} /> : <Play size={18} color="var(--emerald)" />}
              </button>
              <button
                onClick={() => handleEndSession(true)}
                className="btn btn-accent"
                style={{ padding: '10px 16px', fontSize: '0.85rem' }}
              >
                Finish & Take Assessment
              </button>
            </div>
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

            <button
              onClick={() => setActiveTab('browser')}
              className={`btn ${activeTab === 'browser' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
            >
              <Globe size={18} />
              <span>In-App Web Browser</span>
            </button>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => handleEndSession(false)}
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
                        const cleaned = msg.content
                          .replace(/\\"/g, '"')
                          .replace(/\\'/g, "'")
                          .replace(/\*"\s*(.*?)\s*"\*/g, '"$1"')
                          .replace(/\*'\s*(.*?)\s*'\*/g, "'$1'")
                          .replace(/\\\//g, '/')
                          .replace(/\\\\/g, '\\');

                        const blocks = cleaned.split(/(```[\s\S]*?```)/g);

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {blocks.map((block, bIdx) => {
                              if (block.startsWith('```') && block.endsWith('```')) {
                                const firstLineEnd = block.indexOf('\n');
                                const codeText = firstLineEnd !== -1 ? block.slice(firstLineEnd + 1, -3) : block.slice(3, -3);
                                const lang = firstLineEnd !== -1 ? block.slice(3, firstLineEnd).trim() : '';

                                return (
                                  <div key={bIdx} style={{ margin: '6px 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', background: '#090d16' }}>
                                    {lang && (
                                      <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', fontSize: '0.68rem', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>
                                        {lang}
                                      </div>
                                    )}
                                    <pre style={{ margin: 0, padding: '10px 12px', overflowX: 'auto', fontSize: '0.8rem', fontFamily: 'monospace', color: '#e2e8f0', lineHeight: '1.4' }}>
                                      <code>{codeText.trim()}</code>
                                    </pre>
                                  </div>
                                );
                              }

                              const lines = block.split('\n');
                              return (
                                <React.Fragment key={bIdx}>
                                  {lines.map((line, lIdx) => {
                                    let trimmed = line.trim();
                                    if (!trimmed) return <div key={lIdx} style={{ height: '4px' }} />;

                                    if (trimmed.startsWith('#')) {
                                      const headerText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/\$/g, '');
                                      return (
                                        <div key={lIdx} style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--primary)', marginTop: '6px', marginBottom: '2px' }}>
                                          {headerText}
                                        </div>
                                      );
                                    }

                                    const isBullet = /^(?:[-*]|\d+\.)\s+/.test(trimmed);
                                    let listSymbol = '•';
                                    if (isBullet) {
                                      const numMatch = trimmed.match(/^(\d+\.)\s+/);
                                      if (numMatch) {
                                        listSymbol = numMatch[1];
                                      }
                                      trimmed = trimmed.replace(/^(?:[-*]|\d+\.)\s+/, '');
                                    }

                                    const inlineTokens = trimmed.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
                                    const elements = inlineTokens.map((token, tIdx) => {
                                      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
                                        return <strong key={tIdx} style={{ color: 'var(--text-main)', fontWeight: '700' }}>{token.slice(2, -2)}</strong>;
                                      }
                                      if (token.startsWith('*') && token.endsWith('*') && token.length > 2 && !token.startsWith('**')) {
                                        return <em key={tIdx} style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>{token.slice(1, -1)}</em>;
                                      }
                                      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
                                        return <code key={tIdx} style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 5px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#38bdf8' }}>{token.slice(1, -1)}</code>;
                                      }
                                      return token.replace(/[\$\\]/g, '');
                                    });

                                    if (isBullet) {
                                      return (
                                        <div key={lIdx} style={{ display: 'flex', gap: '8px', marginLeft: '6px', alignItems: 'flex-start' }}>
                                          <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>{listSymbol}</span>
                                          <div style={{ flex: 1 }}>{elements}</div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={lIdx}>
                                        {elements}
                                      </div>
                                    );
                                  })}
                                </React.Fragment>
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
                    </div>
                  </div>
                </div>
                <span className="badge badge-cyan">Controlled API</span>
              </div>

              {/* Disclaimer */}
              <div style={{
                fontSize: '0.75rem', padding: '8px 12px', borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <Shield size={14} color="var(--primary)" />
                <span>StudyShield isolates educational video search. Unrestricted YouTube browsing and non-academic recommendations are blocked.</span>
              </div>

              {ytLoading && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Searching educational videos...
                </div>
              )}

              {/* Video List */}
              {!ytLoading && (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ytVideos.map(video => (
                    <div
                      key={video.id}
                      style={{
                        display: 'flex', gap: '12px', padding: '12px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', alignItems: 'flex-start'
                      }}
                    >
                      <div style={{ position: 'relative', minWidth: '110px', width: '110px', height: '68px', borderRadius: '6px', overflow: 'hidden' }}>
                        <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.65rem', fontWeight: '700', padding: '2px 5px', borderRadius: '4px' }}>
                          {video.duration || '15 mins'}
                        </span>
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <h4 style={{ fontSize: '0.86rem', fontWeight: '700', margin: 0, color: 'var(--text-main)', lineHeight: '1.3' }}>
                          {video.title}
                        </h4>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {video.channelTitle}
                        </div>
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

          {/* TAB 4: IN-APP RESTRICTED WEB BROWSER */}
          {activeTab === 'browser' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>In-App Intercepted Web Browser</h3>
                </div>
                <span className="badge badge-cyan">Real-Time Domain Interceptor</span>
              </div>

              {/* Quick URL Test Chips */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                  type="button"
                  onClick={() => { setBrowserUrlInput('https://youtube.com'); handleNavigateInAppBrowser('https://youtube.com'); }}
                  style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', cursor: 'pointer' }}
                >
                  ▶️ YouTube (Test Block)
                </button>
                <button
                  type="button"
                  onClick={() => { setBrowserUrlInput('https://instagram.com'); handleNavigateInAppBrowser('https://instagram.com'); }}
                  style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', cursor: 'pointer' }}
                >
                  📷 Instagram (Test Block)
                </button>
                <button
                  type="button"
                  onClick={() => { setBrowserUrlInput('https://wikipedia.org'); handleNavigateInAppBrowser('https://wikipedia.org'); }}
                  style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', cursor: 'pointer' }}
                >
                  🌐 Wikipedia (Allowed)
                </button>
              </div>

              {/* Address Bar */}
              <form onSubmit={(e) => { e.preventDefault(); handleNavigateInAppBrowser(browserUrlInput); }} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Enter URL (e.g. youtube.com, instagram.com, wikipedia.org)..."
                  value={browserUrlInput}
                  onChange={(e) => setBrowserUrlInput(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', fontSize: '0.82rem' }}>
                  Navigate
                </button>
              </form>

              {/* Browser View */}
              <div style={{ flex: 1, position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)', minHeight: '340px' }}>
                {browserBlocked ? (
                  <div style={{
                    width: '100%', height: '100%', background: '#0F172A',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '24px', textAlign: 'center'
                  }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      background: 'rgba(244, 63, 94, 0.2)', border: '2px solid #f43f5e', marginBottom: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Lock size={32} color="#fb7185" />
                    </div>

                    <span className="badge badge-rose" style={{ marginBottom: '10px', fontSize: '0.78rem' }}>
                      🚫 ACCESS DENIED BY STUDYSHIELD POLICY
                    </span>

                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '6px 0', color: '#fff' }}>
                      Website "{browserBlockedDomain.toUpperCase()}" Restricted
                    </h3>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '360px', lineHeight: '1.5', marginBottom: '20px' }}>
                      Access to social media & video streaming sites (YouTube, Instagram, TikTok, Snapchat) is blocked while studying <strong>{session.topic}</strong>.
                    </p>

                    <button
                      onClick={() => {
                        setBrowserUrlInput('https://wikipedia.org');
                        handleNavigateInAppBrowser('https://wikipedia.org');
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                    >
                      Return to Educational Wikipedia
                    </button>
                  </div>
                ) : (
                  <iframe
                    src={browserActiveUrl}
                    style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
                    title="In-App Web Browser"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
