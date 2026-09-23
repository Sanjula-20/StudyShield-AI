/**
 * StudyShield API Client
 */

const API_BASE = '/api';

export const getStoredToken = () => localStorage.getItem('studyshield_token');
export const setStoredToken = (token) => localStorage.setItem('studyshield_token', token);
export const removeStoredToken = () => localStorage.removeItem('studyshield_token');

const request = async (endpoint, options = {}) => {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

export const api = {
  // Auth
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),

  // Sessions
  createSession: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  getActiveSession: () => request('/sessions/active'),
  getSessions: () => request('/sessions'),
  getSession: (id) => request(`/sessions/${id}`),
  updateSessionStatus: (id, status, actualDuration) => request(`/sessions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, actualDuration }) }),
  completeSession: (id, actualDuration, earlyCompletion = false) => request(`/sessions/${id}/complete`, { method: 'POST', body: JSON.stringify({ actualDuration, earlyCompletion }) }),
  cancelSession: (id, actualDuration = 0) => request(`/sessions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ actualDuration }) }),

  // AI Tutor
  sendTutorMessage: (data) => request('/tutor/chat', { method: 'POST', body: JSON.stringify(data) }),
  getTutorHistory: (sessionId) => request(`/tutor/history?sessionId=${sessionId || ''}`),

  // YouTube
  searchYouTube: (query, topic, subtopic) => request(`/youtube/search?q=${encodeURIComponent(query || '')}&topic=${encodeURIComponent(topic || '')}&subtopic=${encodeURIComponent(subtopic || '')}`),


  // Notes
  getNotes: (sessionId, topic) => request(`/notes?sessionId=${sessionId || ''}&topic=${encodeURIComponent(topic || '')}`),
  createNote: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id, data) => request(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),

  // Assessment
  generateAssessment: (data) => request('/assessments/generate', { method: 'POST', body: JSON.stringify(data) }),
  submitAssessment: (id, answer) => request(`/assessments/${id}/submit`, { method: 'POST', body: JSON.stringify({ answer }) }),
  getAssessmentResult: (id) => request(`/assessments/${id}/result`),

  // Analytics
  getAnalytics: () => request('/analytics'),
  getTopicMastery: () => request('/analytics/topics'),
  getHistory: (status = '', search = '') => request(`/analytics/history?status=${encodeURIComponent(status || '')}&search=${encodeURIComponent(search || '')}`)
};
