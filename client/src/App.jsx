import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import SplashScreen from './views/SplashScreen';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import FocusModeView from './views/FocusModeView';
import AssessmentView from './views/AssessmentView';
import AnalyticsView from './views/AnalyticsView';
import ProfileView from './views/ProfileView';
import CreateSessionModal from './components/CreateSessionModal';
import { api, getStoredToken, removeStoredToken } from './api';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'analytics' | 'profile'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Active Session / Assessment States
  const [currentSession, setCurrentSession] = useState(null);
  const [assessmentSession, setAssessmentSession] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);

      // Check if active session running
      const activeRes = await api.getActiveSession();
      if (activeRes.session) {
        setCurrentSession(activeRes.session);
      }
    } catch (err) {
      console.error('Auth verification failed', err);
      removeStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeStoredToken();
    setUser(null);
    setCurrentSession(null);
    setAssessmentSession(null);
  };

  const handleSessionStarted = (session) => {
    setCurrentSession(session);
    setAssessmentSession(null);
  };

  const handleSessionCompleted = async (sessionId, actualDuration, earlyCompletion) => {
    try {
      const cleanId = typeof sessionId === 'object' ? (sessionId._id || sessionId.id) : sessionId;
      const res = await api.completeSession(cleanId, actualDuration, earlyCompletion);
      setAssessmentSession(res.session || (typeof sessionId === 'object' ? sessionId : currentSession));
      setCurrentSession(null);
    } catch (err) {
      console.error('Failed to complete session', err);
      if (currentSession) {
        setAssessmentSession(currentSession);
        setCurrentSession(null);
      }
    }
  };

  const handleCancelSession = async (sessionId, actualDuration) => {
    try {
      await api.cancelSession(sessionId, actualDuration);
      setCurrentSession(null);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Failed to cancel session', err);
    }
  };

  const handleAssessmentComplete = () => {
    setAssessmentSession(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)' }}>
            🛡️
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading StudyShield Workspace...</div>
        </div>
      </div>
    );
  }

  // Show Splash Screen on first launch if not logged in
  if (showSplash && !user) {
    return <SplashScreen onGetStarted={() => setShowSplash(false)} />;
  }

  // Content Renderer
  const renderMainContent = () => {
    if (!user) {
      return <AuthView onAuthSuccess={(usr) => { setUser(usr); setShowSplash(false); }} />;
    }

    if (assessmentSession) {
      return (
        <AssessmentView
          session={assessmentSession}
          onAssessmentComplete={handleAssessmentComplete}
        />
      );
    }

    if (currentSession) {
      return (
        <FocusModeView
          session={currentSession}
          onSessionCompleted={handleSessionCompleted}
          onCancelSession={handleCancelSession}
          isPhoneFrame={isPhoneFrame}
        />
      );
    }

    if (activeTab === 'analytics') {
      return <AnalyticsView onStartFocus={() => setIsCreateModalOpen(true)} />;
    }

    if (activeTab === 'profile') {
      return <ProfileView user={user} onLogout={handleLogout} />;
    }

    return (
      <DashboardView
        user={user}
        onStartSessionClick={() => setIsCreateModalOpen(true)}
        onResumeActiveSession={(session) => setCurrentSession(session)}
      />
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        isPhoneFrame={isPhoneFrame}
        setIsPhoneFrame={setIsPhoneFrame}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      {isPhoneFrame ? (
        <div className="phone-chassis-container">
          <div className="phone-chassis">
            <div className="phone-notch"></div>
            <div className="phone-screen-content" style={{ padding: '16px', paddingBottom: '70px' }}>
              {renderMainContent()}
            </div>
            {user && !currentSession && !assessmentSession && (
              <MobileBottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onStartFocusClick={() => setIsCreateModalOpen(true)}
                hasActiveSession={!!currentSession}
              />
            )}
          </div>
        </div>
      ) : (
        <main style={{ flex: 1, padding: '24px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%', paddingBottom: user && !currentSession && !assessmentSession ? '40px' : '20px' }}>
          {renderMainContent()}
        </main>
      )}

      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSessionStarted={handleSessionStarted}
      />
    </div>
  );
}
