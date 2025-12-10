import React, { useState, useEffect } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import * as services from './services';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Header from './components/dashboard/Header';
import EmailList from './components/dashboard/EmailList';
import SummarySettings from './components/dashboard/SummarySettings';
import AnalysisView from './components/analysis/AnalysisView';
import ComposeEmail from './components/dashboard/ComposeEmail';
import { syncEmails, fetchLocalEmails } from './services/emailService';

function App() {
  const { user, isAuthenticated, loading: authLoading, setError: setGlobalError, error: authError } = useAuth();

  // Local UI State
  const [showLogin, setShowLogin] = useState(true);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Summary & Audio State
  const [summary, setSummary] = useState('');
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioHistory, setAudioHistory] = useState([]);

  // Settings
  const [emailCount, setEmailCount] = useState(10);
  const [dateFilter, setDateFilter] = useState('all');
  const [showCustomization, setShowCustomization] = useState(false);

  // Analysis State
  const [userAnalysis, setUserAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Compose State
  const [showCompose, setShowCompose] = useState(false);

  // Archive State
  const [viewMode, setViewMode] = useState('remote'); // 'remote' or 'local'
  const [syncing, setSyncing] = useState(false);

  // Sync auth error to local error
  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  // Initial Data Fetch
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  // Handle Gmail Callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const urlError = urlParams.get('error');

    if (urlError) {
      setError(`Gmail authentication failed: ${urlError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && isAuthenticated) {
      handleGmailCallback(code);
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    try {
      const historyData = await services.fetchAudioHistory();
      if (historyData?.audios) setAudioHistory(historyData.audios);

      const analysisData = await services.getUserAnalysis();
      if (analysisData?.analysis) setUserAnalysis(analysisData.analysis);
    } catch (err) {
      console.error("Error loading initial data", err);
    }
  };

  const handleGmailCallback = async (code) => {
    try {
      setLoading(true);
      await services.handleGmailCallback(code);
      // Refresh profile to get updated hasGmailAuth status
      // We might need a mechanism to reload user in context
      // For now we can reload page or better, expose a 'refreshUser' in context
      window.location.href = '/'; // Simple reload to clear code and refresh state
    } catch (err) {
      setError('Failed to connect Gmail account');
    } finally {
      setLoading(false);
    }
  };

  const handleGmailAuth = async () => {
    try {
      const data = await services.getGmailAuthUrl();
      window.location.href = data.authUrl;
    } catch (err) {
      setError('Failed to initiate Google authentication');
    }
  };

  const fetchUnreadEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      setSummary('');
      setAudioUrl(null);

      const data = await services.fetchUnreadEmails(emailCount, dateFilter);
      setEmails(data.emails);
      setViewMode('remote');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Please connect your Gmail account first');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch emails');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (emails.length === 0) {
      setError('Please fetch emails first');
      return;
    }
    try {
      setLoading(true);
      const data = await services.generateSummary(emails);
      setSummary(data.summary);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!summary) return setError('Please generate a summary first');
    try {
      setGeneratingAudio(true);
      const data = await services.generateAudio(summary, emailCount, dateFilter);

      // API_BASE_URL logic
      const API_BASE_URL = process.env.REACT_APP_API_URL ||
        (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

      // If result is just path
      const fullUrl = `${API_BASE_URL.replace('/api', '')}${data.url}`;
      setAudioUrl(fullUrl);

      // Refresh history
      const history = await services.fetchAudioHistory();
      setAudioHistory(history.audios || []);
    } catch (err) {
      setError('Failed to generate audio');
    } finally {
      setGeneratingAudio(false);
    }
  };

  const analyzeUser = async () => {
    if (emails.length === 0) return setError('Please fetch emails first');
    try {
      setAnalyzing(true);
      const data = await services.analyzeUser(emails);
      setUserAnalysis(data.analysis);
      setShowAnalysis(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze emails');
    } finally {
      setAnalyzing(false);
    }
  };

  const syncMessages = async () => {
    try {
      setSyncing(true);
      setError(null);
      const data = await syncEmails();
      alert(`Synced ${data.stats.added} new emails!`);
      // Optionally switch to local view
      loadLocalEmails();
    } catch (err) {
      setError('Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  };

  const loadLocalEmails = async () => {
    try {
      setLoading(true);
      // fetchLocalEmails(page, limit, search) - defaults for now
      const data = await fetchLocalEmails();
      setEmails(data.emails);
      setViewMode('local');
    } catch (err) {
      setError('Failed to load archived emails');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async () => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await services.deleteUserAnalysis();
      setUserAnalysis(null);
      setShowAnalysis(false);
    } catch (err) {
      setError('Failed to delete analysis');
    }
  };

  const { logout } = useAuth();

  if (authLoading) return <div className="loading-screen">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="container">
          <Header />
          {error && <div className="error-message">{error}</div>}
          <div className="auth-section">
            <div className="card">
              <div className="auth-tabs">
                <button
                  className={showLogin ? 'active' : ''}
                  onClick={() => setShowLogin(true)}
                >
                  Sign In
                </button>
                <button
                  className={!showLogin ? 'active' : ''}
                  onClick={() => setShowLogin(false)}
                >
                  Create Account
                </button>
              </div>
              {showLogin ? <Login /> : <Register />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <Header />

        {error && <div className="error-message">{error}</div>}

        <div className="main-content">
          <div className="card">
            <div className="card-header">
              <h2>Your Inbox</h2>
              <div className="header-actions">
                {!user?.hasGmailAuth && (
                  <button className="btn btn-secondary" onClick={handleGmailAuth} disabled={loading}>
                    🔐 Connect Gmail
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setShowCompose(true)}>✨ Compose</button>
                <button className="btn btn-secondary" onClick={logout}>Sign Out</button>
              </div>
            </div>

            {!user?.hasGmailAuth ? (
              <div className="info-message">
                <p>🔗 Connect your Gmail account to start fetching and summarizing your emails.</p>
              </div>
            ) : (
              <>
                <SummarySettings
                  emailCount={emailCount} setEmailCount={setEmailCount}
                  dateFilter={dateFilter} setDateFilter={setDateFilter}
                  showCustomization={showCustomization} setShowCustomization={setShowCustomization}
                />

                <div className="actions">
                  <div className="view-toggles">
                    <button
                      className={`btn ${viewMode === 'remote' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={fetchUnreadEmails}
                      disabled={loading}
                    >
                      {loading && viewMode === 'remote' ? 'Loading...' : '📥 Unread (Gmail)'}
                    </button>
                    <button
                      className={`btn ${viewMode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={loadLocalEmails}
                      disabled={loading}
                    >
                      {loading && viewMode === 'local' ? 'Loading...' : '🗄️ My Archive (Local)'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={syncMessages}
                      disabled={syncing}
                    >
                      {syncing ? '🔄 Syncing...' : '🔄 Sync Now'}
                    </button>
                  </div>
                </div>

                <EmailList emails={emails} />

                {emails.length > 0 && (
                  <div className="actions">
                    <button className="btn btn-primary" onClick={analyzeUser} disabled={analyzing || loading}>
                      {analyzing ? 'Analyzing...' : '🔍 Analyze My Profile'}
                    </button>
                    <button className="btn btn-primary" onClick={generateSummary} disabled={loading}>
                      {loading ? 'Generating...' : '🤖 Generate AI Summary'}
                    </button>
                  </div>
                )}

                {summary && (
                  <div className="summary-section">
                    <h3>📝 AI Summary</h3>
                    <div className="summary-content">{summary}</div>
                    <button className="btn btn-primary" onClick={generateAudio} disabled={generatingAudio}>
                      {generatingAudio ? 'Generating Audio...' : '🔊 Read Aloud'}
                    </button>
                  </div>
                )}

                {audioUrl && (
                  <div className="audio-player-section">
                    <audio controls src={audioUrl} autoPlay />
                  </div>
                )}

                <AnalysisView
                  userAnalysis={userAnalysis}
                  showAnalysis={showAnalysis}
                  setShowAnalysis={setShowAnalysis}
                  deleteAnalysis={deleteAnalysis}
                />
              </>
            )}

            {showCompose && <ComposeEmail toggleCompose={() => setShowCompose(false)} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
