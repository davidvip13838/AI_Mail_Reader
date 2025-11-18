import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  // Check if user is already authenticated (from localStorage)
  useEffect(() => {
    const savedToken = localStorage.getItem('gmail_access_token');
    if (savedToken) {
      setAccessToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const handleGoogleAuth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/gmail/auth-url`);
      window.location.href = response.data.authUrl;
    } catch (error) {
      setError('Failed to initiate Google authentication');
      console.error(error);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      setError(`Authentication failed: ${error}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (code && !isAuthenticated) {
      handleAuthCallback(code);
    }
  }, []);

  const handleAuthCallback = async (code) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/gmail/auth-callback`, { code });
      
      const token = response.data.accessToken;
      setAccessToken(token);
      setIsAuthenticated(true);
      localStorage.setItem('gmail_access_token', token);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setError('Failed to authenticate with Google');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/gmail/unread-emails`, {
        accessToken
      });
      setEmails(response.data.emails);
    } catch (error) {
      setError('Failed to fetch emails. Please try again.');
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
      setError('Failed to generate summary. Please check your OpenAI API key.');
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
      setError('Failed to generate audio. Please check your ElevenLabs API key.');
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

  const logout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    setEmails([]);
    setSummary('');
    setAudioUrl(null);
    localStorage.removeItem('gmail_access_token');
  };

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

        {!isAuthenticated ? (
          <div className="auth-section">
            <div className="card">
              <h2>Get Started</h2>
              <p>Connect your Gmail account to start summarizing your unread emails</p>
              <button 
                className="btn btn-primary" 
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                {loading ? 'Loading...' : '🔐 Connect with Google'}
              </button>
            </div>
          </div>
        ) : (
          <div className="main-content">
            <div className="card">
              <div className="card-header">
                <h2>Your Unread Emails</h2>
                <button className="btn btn-secondary" onClick={logout}>
                  Logout
                </button>
              </div>
              
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
