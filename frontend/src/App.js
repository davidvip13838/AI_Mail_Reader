import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Configure axios to include auth token in requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  // Check if user is already authenticated (from localStorage)
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      checkAuth(token);
    }
  }, []);

  // Handle Gmail OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      setError(`Gmail authentication failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (code && isAuthenticated) {
      handleGmailCallback(code);
    }
  }, [isAuthenticated]);

  const checkAuth = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`);
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: registerEmail,
        password: registerPassword,
        name: registerName
      });

      localStorage.setItem('auth_token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setShowLogin(true);
      
      // Clear form
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterName('');
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });

      localStorage.setItem('auth_token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      // Clear form
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGmailAuth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/gmail/auth-url`);
      window.location.href = response.data.authUrl;
    } catch (error) {
      setError('Failed to initiate Google authentication');
      console.error(error);
    }
  };

  const handleGmailCallback = async (code) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/gmail/auth-callback`, { code });
      
      // Update user state to reflect Gmail connection
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`);
      setUser(profileResponse.data.user);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setError('Failed to connect Gmail account');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/gmail/unread-emails`);
      
      // Update access token if it was refreshed
      if (response.data.newAccessToken) {
        // Token is now stored in database, no need to update localStorage
      }
      
      setEmails(response.data.emails);
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Please connect your Gmail account first');
      } else if (error.response?.data?.requiresReauth) {
        setError('Gmail session expired. Please reconnect your Gmail account.');
      } else {
        setError(error.response?.data?.error || 'Failed to fetch emails');
      }
      console.error(error);
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
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/summarize/summarize`, {
        emails
      });
      setSummary(response.data.summary);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to generate summary');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!summary) {
      setError('Please generate a summary first');
      return;
    }

    try {
      setGeneratingAudio(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/audio/generate`, {
        text: summary
      });
      
      const fullUrl = `${API_BASE_URL.replace('/api', '')}${response.data.url}`;
      setAudioUrl(fullUrl);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to generate audio');
      console.error(error);
    } finally {
      setGeneratingAudio(false);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = 'email-summary.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setEmails([]);
      setSummary('');
      setAudioUrl(null);
      localStorage.removeItem('auth_token');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="container">
          <header className="header">
            <h1>📧 AI Mail Reader</h1>
            <p className="subtitle">Summarize your Gmail and listen to it</p>
          </header>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="auth-section">
            <div className="card">
              <div className="auth-tabs">
                <button 
                  className={showLogin ? 'active' : ''} 
                  onClick={() => setShowLogin(true)}
                >
                  Login
                </button>
                <button 
                  className={!showLogin ? 'active' : ''} 
                  onClick={() => setShowLogin(false)}
                >
                  Register
                </button>
              </div>

              {showLogin ? (
                <form onSubmit={handleLogin} className="auth-form">
                  <h2>Login</h2>
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="auth-form">
                  <h2>Register</h2>
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>📧 AI Mail Reader</h1>
          <p className="subtitle">Welcome, {user?.name || user?.email}!</p>
        </header>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="main-content">
          <div className="card">
            <div className="card-header">
              <h2>Your Unread Emails</h2>
              <div className="header-actions">
                {!user?.hasGmailAuth && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleGmailAuth}
                    disabled={loading}
                  >
                    🔐 Connect Gmail
                  </button>
                )}
                <button className="btn btn-secondary" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>

            {!user?.hasGmailAuth ? (
              <div className="info-message">
                <p>Please connect your Gmail account to start fetching emails.</p>
              </div>
            ) : (
              <>
                <div className="actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={fetchUnreadEmails}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : '📥 Fetch Unread Emails'}
                  </button>
                </div>

                {emails.length > 0 && (
                  <div className="emails-list">
                    <h3>Found {emails.length} unread email(s)</h3>
                    {emails.map((email, index) => (
                      <div key={email.id} className="email-item">
                        <div className="email-header">
                          <strong>{email.subject}</strong>
                          <span className="email-from">{email.from}</span>
                        </div>
                        <p className="email-snippet">{email.snippet}</p>
                        <small className="email-date">{new Date(email.date).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                )}

                {emails.length > 0 && (
                  <div className="actions">
                    <button 
                      className="btn btn-primary" 
                      onClick={generateSummary}
                      disabled={loading}
                    >
                      {loading ? 'Generating...' : '🤖 Generate Summary'}
                    </button>
                  </div>
                )}

                {summary && (
                  <div className="summary-section">
                    <h3>Summary</h3>
                    <div className="summary-text">{summary}</div>
                    
                    <div className="actions">
                      <button 
                        className="btn btn-primary" 
                        onClick={generateAudio}
                        disabled={generatingAudio}
                      >
                        {generatingAudio ? 'Generating Audio...' : '🎵 Generate Audio'}
                      </button>
                    </div>
                  </div>
                )}

                {audioUrl && (
                  <div className="audio-section">
                    <h3>Audio Ready!</h3>
                    <div className="audio-player">
                      <audio controls src={audioUrl} style={{ width: '100%', marginBottom: '1rem' }}>
                        Your browser does not support the audio element.
                      </audio>
                      <button 
                        className="btn btn-success" 
                        onClick={downloadAudio}
                      >
                        ⬇️ Download Audio File
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
