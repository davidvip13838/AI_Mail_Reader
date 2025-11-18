import { describe, it, expect, beforeAll } from '@jest/globals';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

describe('Gmail API Connection Tests', () => {
  let oauth2Client;

  beforeAll(() => {
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  });

  describe('Environment Variables', () => {
    it('should have GOOGLE_CLIENT_ID configured', () => {
      expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(process.env.GOOGLE_CLIENT_ID).not.toBe('your_google_client_id_here');
      expect(process.env.GOOGLE_CLIENT_ID.length).toBeGreaterThan(0);
    });

    it('should have GOOGLE_CLIENT_SECRET configured', () => {
      expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
      expect(process.env.GOOGLE_CLIENT_SECRET).not.toBe('your_google_client_secret_here');
      expect(process.env.GOOGLE_CLIENT_SECRET.length).toBeGreaterThan(0);
    });

    it('should have GOOGLE_REDIRECT_URI configured', () => {
      expect(process.env.GOOGLE_REDIRECT_URI).toBeDefined();
      expect(process.env.GOOGLE_REDIRECT_URI).toMatch(/^https?:\/\//);
    });
  });

  describe('OAuth2 Client Setup', () => {
    it('should create OAuth2 client successfully', () => {
      expect(oauth2Client).toBeDefined();
      expect(oauth2Client._clientId).toBe(process.env.GOOGLE_CLIENT_ID);
      expect(oauth2Client._clientSecret).toBe(process.env.GOOGLE_CLIENT_SECRET);
    });

    it('should generate authorization URL', () => {
      const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
      });

      expect(authUrl).toBeDefined();
      expect(authUrl).toContain('accounts.google.com');
      expect(authUrl).toContain('client_id=' + encodeURIComponent(process.env.GOOGLE_CLIENT_ID));
      expect(authUrl).toContain('scope=' + encodeURIComponent(scopes[0]));
    });
  });

  describe('Gmail API Client', () => {
    it('should create Gmail API client', () => {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      expect(gmail).toBeDefined();
      expect(gmail.users).toBeDefined();
      expect(gmail.users.messages).toBeDefined();
    });
  });

  describe('API Connection (requires valid access token)', () => {
    it.skip('should connect to Gmail API with valid token', async () => {
      // This test requires a valid access token
      // To run: set GMAIL_ACCESS_TOKEN in .env and remove .skip
      const accessToken = process.env.GMAIL_ACCESS_TOKEN;
      
      if (!accessToken) {
        console.log('⚠️  Skipping: GMAIL_ACCESS_TOKEN not set in .env');
        return;
      }

      oauth2Client.setCredentials({ access_token: accessToken });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      try {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        expect(profile.data).toBeDefined();
        expect(profile.data.emailAddress).toBeDefined();
        console.log('✅ Gmail API connected successfully');
        console.log('   Email:', profile.data.emailAddress);
      } catch (error) {
        console.error('❌ Gmail API connection failed:', error.message);
        throw error;
      }
    });
  });
});

