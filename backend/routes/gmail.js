import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';

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
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ authUrl });
});

// Handle OAuth callback and get access token (POST from frontend)
router.post('/auth-callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.json({ 
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

// Get unread emails
router.post('/unread-emails', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get list of unread messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 10
    });

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

    res.json({ emails: emailDetails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails', details: error.message });
  }
});

export default router;

