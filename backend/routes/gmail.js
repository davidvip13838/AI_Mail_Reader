import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';

dotenv.config();

const router = express.Router();

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get authorization URL
router.get('/auth-url', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ authUrl });
});

// Handle OAuth callback and get access token (POST from frontend) - Now requires authentication
router.post('/auth-callback', authenticate, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens to user's database record
    await User.findByIdAndUpdate(req.userId, {
      gmailAccessToken: tokens.access_token,
      gmailRefreshToken: tokens.refresh_token,
      gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
    });

    res.json({
      message: 'Gmail account connected successfully',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expiry_date
    });
  } catch (error) {
    console.error('Error in auth callback:', error);
    res.status(500).json({ error: 'Failed to exchange code for token', details: error.message });
  }
});

// Handle OAuth callback (GET from Google redirect - redirects to frontend)
router.get('/auth-callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=${error}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=no_code`);
    }

    // Redirect to frontend with code - frontend will handle token exchange
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?code=${code}`);
  } catch (error) {
    console.error('Error in auth callback redirect:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=callback_error`);
  }
});

// Refresh access token using refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    res.json({
      accessToken: credentials.access_token,
      expiresIn: credentials.expiry_date,
      tokenType: credentials.token_type
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      details: error.message
    });
  }
});

// Get unread emails - Now requires authentication
router.post('/unread-emails', authenticate, async (req, res) => {
  try {
    // Get user from database to retrieve Gmail tokens
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.gmailAccessToken && !user.gmailRefreshToken) {
      return res.status(400).json({
        error: 'Gmail account not connected',
        requiresAuth: true
      });
    }

    // Get filtering options from request body
    const maxResults = Math.min(parseInt(req.body.maxResults) || 10, 50); // Max 50 emails
    const dateFilter = req.body.dateFilter || 'all'; // 'today', 'last7days', 'last30days', 'all'

    // Build Gmail query with date filter
    let query = 'is:unread';

    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0].replace(/-/g, '/');
      query += ` after:${todayStr}`;
    } else if (dateFilter === 'last7days') {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '/');
      query += ` after:${dateStr}`;
    } else if (dateFilter === 'last30days') {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '/');
      query += ` after:${dateStr}`;
    }
    // 'all' means no date filter

    // Use tokens from database, or fallback to request body (for backward compatibility)
    const accessToken = req.body.accessToken || user.gmailAccessToken;
    const refreshToken = req.body.refreshToken || user.gmailRefreshToken;

    // Try to use access token first
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Test if token is valid by making a request
    let response;
    try {
      response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });
    } catch (tokenError) {
      // If access token is invalid and we have a refresh token, try to refresh
      if (tokenError.response?.status === 401 && refreshToken) {
        console.log('Access token expired, refreshing...');
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Retry with new token
        oauth2Client.setCredentials({
          access_token: credentials.access_token,
          refresh_token: refreshToken
        });
        const refreshedGmail = google.gmail({ version: 'v1', auth: oauth2Client });
        response = await refreshedGmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: maxResults
        });

        // Save new access token to database
        await User.findByIdAndUpdate(req.userId, {
          gmailAccessToken: credentials.access_token,
          gmailTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
        });

        // Return new access token to frontend
        res.locals.newAccessToken = credentials.access_token;
      } else {
        throw tokenError;
      }
    }

    const messages = response.data.messages || [];
    const emailDetails = [];

    // Fetch full details for each message
    for (const message of messages) {
      const messageDetail = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });

      const headers = messageDetail.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      // Extract email body
      let body = '';
      const extractBody = (part) => {
        if (part.body && part.body.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.parts) {
          return part.parts.map(extractBody).join('\n');
        }
        return '';
      };

      body = extractBody(messageDetail.data.payload);

      emailDetails.push({
        id: message.id,
        subject,
        from,
        date,
        snippet: messageDetail.data.snippet,
        body: body.substring(0, 1000) // Limit body length
      });
    }

    const responseData = { emails: emailDetails };

    // Include new access token if it was refreshed
    if (res.locals.newAccessToken) {
      responseData.newAccessToken = res.locals.newAccessToken;
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching emails:', error);

    // Provide more helpful error messages
    if (error.response?.status === 401) {
      res.status(401).json({
        error: 'Authentication failed. Please reconnect your Google account.',
        details: 'Your access token has expired. Please log out and sign in again.',
        requiresReauth: true
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch emails', details: error.message });
    }
  }
});

export default router;

