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
  const [audioHistory, setAudioHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  
  // Summary customization options
  const [emailCount, setEmailCount] = useState(10);
  const [dateFilter, setDateFilter] = useState('all');
  const [showCustomization, setShowCustomization] = useState(false);
  
  // User analysis state
  const [userAnalysis, setUserAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
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

  // Fetch audio history when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAudioHistory();
      fetchUserAnalysis();
    }
  }, [isAuthenticated]);

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
      // Clear previous summary when fetching new emails
      setSummary('');
      setAudioUrl(null);
      
      const response = await axios.post(`${API_BASE_URL}/gmail/unread-emails`, {
        maxResults: emailCount,
        dateFilter: dateFilter
      });
      
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
        text: summary,
        emailCount: emailCount,
        dateFilter: dateFilter
      });
      
      const fullUrl = `${API_BASE_URL.replace('/api', '')}${response.data.url}`;
      setAudioUrl(fullUrl);
      
      // Refresh audio history after generating new audio
      await fetchAudioHistory();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to generate audio');
      console.error(error);
    } finally {
      setGeneratingAudio(false);
    }
  };

  const fetchAudioHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await axios.get(`${API_BASE_URL}/audio/history`);
      setAudioHistory(response.data.audios || []);
    } catch (error) {
      console.error('Error fetching audio history:', error);
      // Don't show error for history fetch, just log it
    } finally {
      setLoadingHistory(false);
    }
  };

  const deleteAudio = async (audioId) => {
    if (!window.confirm('Are you sure you want to delete this audio file?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/audio/${audioId}`);
      // Remove from local state
      setAudioHistory(audioHistory.filter(audio => audio._id !== audioId));
      
      // If the deleted audio was the currently playing one, clear it
      const deletedAudio = audioHistory.find(a => a._id === audioId);
      if (deletedAudio && audioUrl && audioUrl.includes(deletedAudio.filename)) {
        setAudioUrl(null);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete audio file');
      console.error(error);
    }
  };

  const analyzeUser = async () => {
    if (emails.length === 0) {
      setError('Please fetch emails first');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/analysis/analyze`, {
        emails
      });
      setUserAnalysis(response.data.analysis);
      setShowAnalysis(true);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to analyze emails';
      setError(errorMessage);
      console.error('Analysis error:', error);
      if (error.response?.data?.details) {
        console.error('Error details:', error.response.data.details);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchUserAnalysis = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/analysis/profile`);
      if (response.data.analysis) {
        setUserAnalysis(response.data.analysis);
      }
    } catch (error) {
      console.error('Error fetching user analysis:', error);
      // Don't show error, just log it
    }
  };

  const deleteAnalysis = async () => {
    if (!window.confirm('Are you sure you want to delete your analysis? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/analysis/profile`);
      setUserAnalysis(null);
      setShowAnalysis(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete analysis');
      console.error(error);
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
      setAudioHistory([]);
      setUserAnalysis(null);
      setShowAnalysis(false);
      localStorage.removeItem('auth_token');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="container">
          <header className="header">
            <h1>
              <span className="logo-icon">📧</span>
              AI Mail Reader
            </h1>
            <p className="subtitle">Transform your inbox with AI-powered summaries and audio playback</p>
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
                  Sign In
                </button>
                <button 
                  className={!showLogin ? 'active' : ''} 
                  onClick={() => setShowLogin(false)}
                >
                  Create Account
                </button>
              </div>

              {showLogin ? (
                <form onSubmit={handleLogin} className="auth-form">
                  <h2>Welcome Back</h2>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="auth-form">
                  <h2>Get Started</h2>
                  <input
                    type="text"
                    placeholder="Full name (optional)"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Create a password (min 6 characters)"
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
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
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
          <h1>
            <span className="logo-icon">📧</span>
            AI Mail Reader
          </h1>
          <p className="subtitle">Welcome back, {user?.name || user?.email}!</p>
        </header>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="main-content">
          <div className="card">
            <div className="card-header">
              <h2>Your Inbox</h2>
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
                  Sign Out
                </button>
              </div>
            </div>

            {!user?.hasGmailAuth ? (
              <div className="info-message">
                <p>🔗 Connect your Gmail account to start fetching and summarizing your emails.</p>
              </div>
            ) : (
              <>
                {/* Summary Customization Section */}
                <div className="customization-section">
                  <div className="customization-header">
                    <h3>⚙️ Summary Settings</h3>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowCustomization(!showCustomization)}
                    >
                      {showCustomization ? '▼ Hide' : '▶ Show'} Options
                    </button>
                  </div>

                  {showCustomization && (
                    <div className="customization-options">
                      <div className="customization-option">
                        <label htmlFor="emailCount">
                          Number of Emails: <strong>{emailCount}</strong>
                        </label>
                        <input
                          type="range"
                          id="emailCount"
                          min="1"
                          max="50"
                          value={emailCount}
                          onChange={(e) => setEmailCount(parseInt(e.target.value))}
                          className="slider"
                        />
                        <div className="slider-labels">
                          <span>1</span>
                          <span>50</span>
                        </div>
                      </div>

                      <div className="customization-option">
                        <label htmlFor="dateFilter">Date Filter:</label>
                        <select
                          id="dateFilter"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="select-input"
                        >
                          <option value="all">All Unread Emails</option>
                          <option value="today">Today Only</option>
                          <option value="last7days">Last 7 Days</option>
                          <option value="last30days">Last 30 Days</option>
                        </select>
                      </div>

                      <div className="customization-info">
                        <p>
                          📊 You'll fetch up to <strong>{emailCount}</strong> email{emailCount !== 1 ? 's' : ''} 
                          {dateFilter !== 'all' && (
                            <> from the <strong>{dateFilter === 'today' ? 'today' : dateFilter === 'last7days' ? 'last 7 days' : 'last 30 days'}</strong></>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={fetchUnreadEmails}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Fetching emails...
                      </>
                    ) : (
                      <>
                        📥 Fetch Unread Emails
                      </>
                    )}
                  </button>
                </div>

                {emails.length > 0 && (
                  <div className="emails-list">
                    <h3>📬 Found {emails.length} unread email{emails.length !== 1 ? 's' : ''}</h3>
                    {emails.map((email, index) => (
                      <div key={email.id} className="email-item">
                        <div className="email-header">
                          <strong>{email.subject || '(No Subject)'}</strong>
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
                      onClick={analyzeUser}
                      disabled={analyzing || loading}
                    >
                      {analyzing ? (
                        <>
                          <span className="loading-spinner"></span>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          🔍 Analyze My Profile
                        </>
                      )}
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={generateSummary}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="loading-spinner"></span>
                          Generating summary...
                        </>
                      ) : (
                        <>
                          🤖 Generate AI Summary
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* User Analysis Section */}
                {(userAnalysis || showAnalysis) && (
                  <div className="analysis-section">
                    <div className="section-header">
                      <h3>👤 Your Profile Analysis</h3>
                      <div className="header-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowAnalysis(!showAnalysis)}
                        >
                          {showAnalysis ? '▼ Hide' : '▶ Show'} Analysis
                        </button>
                        <button
                          className="btn-delete"
                          onClick={deleteAnalysis}
                          title="Delete analysis"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {showAnalysis && userAnalysis && (
                      <div className="analysis-content">
                        {userAnalysis.insights && (
                          <div className="analysis-insights">
                            <h4>💡 Key Insights</h4>
                            <p>{userAnalysis.insights}</p>
                          </div>
                        )}

                        <div className="analysis-grid">
                          {(userAnalysis.interests && userAnalysis.interests.length > 0) && (
                            <div className="analysis-card">
                              <h4>🎯 Interests</h4>
                              <div className="tag-list">
                                {userAnalysis.interests.map((interest, idx) => (
                                  <span key={idx} className="tag">{interest}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {(userAnalysis.hobbies && userAnalysis.hobbies.length > 0) && (
                            <div className="analysis-card">
                              <h4>🎨 Hobbies</h4>
                              <div className="tag-list">
                                {userAnalysis.hobbies.map((hobby, idx) => (
                                  <span key={idx} className="tag">{hobby}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {userAnalysis.school && (
                            <div className="analysis-card">
                              <h4>🏫 School</h4>
                              <p>{userAnalysis.school}</p>
                            </div>
                          )}

                          {userAnalysis.university && (
                            <div className="analysis-card">
                              <h4>🎓 University</h4>
                              <p>{userAnalysis.university}</p>
                            </div>
                          )}

                          {userAnalysis.company && (
                            <div className="analysis-card">
                              <h4>💼 Company</h4>
                              <p>{userAnalysis.company}</p>
                              {userAnalysis.jobTitle && (
                                <p className="sub-text">{userAnalysis.jobTitle}</p>
                              )}
                            </div>
                          )}

                          {userAnalysis.supervisor && userAnalysis.supervisor.name && (
                            <div className="analysis-card">
                              <h4>👔 Supervisor</h4>
                              <p>{userAnalysis.supervisor.name}</p>
                              {userAnalysis.supervisor.email && (
                                <p className="sub-text">{userAnalysis.supervisor.email}</p>
                              )}
                            </div>
                          )}

                          {userAnalysis.bestFriend && userAnalysis.bestFriend.name && (
                            <div className="analysis-card">
                              <h4>👫 Best Friend</h4>
                              <p>{userAnalysis.bestFriend.name}</p>
                              {userAnalysis.bestFriend.email && (
                                <p className="sub-text">{userAnalysis.bestFriend.email}</p>
                              )}
                            </div>
                          )}

                          {userAnalysis.location && (userAnalysis.location.city || userAnalysis.location.country) && (
                            <div className="analysis-card">
                              <h4>📍 Location</h4>
                              <p>
                                {[userAnalysis.location.city, userAnalysis.location.state, userAnalysis.location.country]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                            </div>
                          )}

                          {userAnalysis.communicationStyle && (
                            <div className="analysis-card">
                              <h4>💬 Communication Style</h4>
                              <p>{userAnalysis.communicationStyle}</p>
                            </div>
                          )}

                          {(userAnalysis.closeContacts && userAnalysis.closeContacts.length > 0) && (
                            <div className="analysis-card full-width">
                              <h4>📇 Close Contacts</h4>
                              <div className="contacts-list">
                                {userAnalysis.closeContacts.map((contact, idx) => (
                                  <div key={idx} className="contact-item">
                                    <strong>{contact.name}</strong>
                                    {contact.email && <span className="sub-text">{contact.email}</span>}
                                    {contact.relationship && (
                                      <span className="relationship-badge">{contact.relationship}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(userAnalysis.frequentTopics && userAnalysis.frequentTopics.length > 0) && (
                            <div className="analysis-card full-width">
                              <h4>📊 Frequent Topics</h4>
                              <div className="topics-list">
                                {userAnalysis.frequentTopics.map((topic, idx) => (
                                  <div key={idx} className="topic-item">
                                    <span className="topic-name">{topic.topic}</span>
                                    <span className="topic-frequency">({topic.frequency}x)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {userAnalysis.lastAnalyzed && (
                          <div className="analysis-footer">
                            <small>
                              Last analyzed: {new Date(userAnalysis.lastAnalyzed).toLocaleString()} 
                              ({userAnalysis.analyzedEmailCount || 0} emails)
                            </small>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {summary && (
                  <div className="summary-section">
                    <h3>✨ AI Summary</h3>
                    <div className="summary-text">{summary}</div>
                    
                    <div className="actions">
                      <button 
                        className="btn btn-primary" 
                        onClick={generateAudio}
                        disabled={generatingAudio}
                      >
                        {generatingAudio ? (
                          <>
                            <span className="loading-spinner"></span>
                            Generating audio...
                          </>
                        ) : (
                          <>
                            🎵 Generate Audio
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {audioUrl && (
                  <div className="audio-section">
                    <h3>🎧 Audio Ready</h3>
                    <div className="audio-player">
                      <audio controls src={audioUrl}>
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

                {/* Audio History Section */}
                <div className="audio-history-section">
                  <div className="section-header">
                    <h3>📚 Audio History</h3>
                    <button 
                      className="btn btn-secondary" 
                      onClick={fetchAudioHistory}
                      disabled={loadingHistory}
                    >
                      {loadingHistory ? (
                        <>
                          <span className="loading-spinner"></span>
                          Loading...
                        </>
                      ) : (
                        '🔄 Refresh'
                      )}
                    </button>
                  </div>

                  {loadingHistory && audioHistory.length === 0 ? (
                    <div className="info-message">
                      <p>Loading your audio history...</p>
                    </div>
                  ) : audioHistory.length === 0 ? (
                    <div className="info-message">
                      <p>No audio files yet. Generate your first audio summary above!</p>
                    </div>
                  ) : (
                    <div className="audio-history-list">
                      {audioHistory.map((audio) => {
                        const fullUrl = `${API_BASE_URL.replace('/api', '')}${audio.url}`;
                        const isCurrentlyPlaying = audioUrl && audioUrl.includes(audio.filename);
                        
                        // Format date
                        const date = new Date(audio.createdAt);
                        const formattedDate = date.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        
                        // Format date filter label
                        const getDateFilterLabel = (filter) => {
                          switch(filter) {
                            case 'today': return 'Today';
                            case 'last7days': return 'Last 7 Days';
                            case 'last30days': return 'Last 30 Days';
                            default: return 'All Emails';
                          }
                        };
                        
                        return (
                          <div key={audio._id} className={`audio-history-item ${isCurrentlyPlaying ? 'active' : ''}`}>
                            <div className="audio-history-content">
                              <div className="audio-history-header">
                                <div className="audio-history-info">
                                  <strong className="audio-history-title">
                                    {formattedDate}
                                  </strong>
                                  <div className="audio-history-options">
                                    <span className="option-badge">
                                      📧 {audio.emailCount || 10} email{audio.emailCount !== 1 ? 's' : ''}
                                    </span>
                                    <span className="option-badge">
                                      📅 {getDateFilterLabel(audio.dateFilter || 'all')}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className="btn-delete"
                                  onClick={() => deleteAudio(audio._id)}
                                  title="Delete audio"
                                >
                                  🗑️
                                </button>
                              </div>
                              <div className="audio-history-player">
                                <audio controls src={fullUrl} style={{ width: '100%' }}>
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                              <div className="audio-history-actions">
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = fullUrl;
                                    link.download = audio.filename;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                >
                                  ⬇️ Download
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
