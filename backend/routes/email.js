import express from 'express';
import OpenAI from 'openai';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Polish email draft using ChatGPT
router.post('/polish', authenticate, async (req, res) => {
    try {
        const { draft, tone = 'professional' } = req.body;

        if (!draft) {
            return res.status(400).json({ error: 'Draft content is required' });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert email editor. Rewrite the following draft to be clear, concise, and ${tone}. Maintain the original intent but improve grammar, flow, and professionalism. Output ONLY the rewritten email body.`
                },
                {
                    role: 'user',
                    content: draft
                }
            ],
            temperature: 0.7,
        });

        const polished = completion.choices[0].message.content;
        res.json({ polished });
    } catch (error) {
        console.error('Error polishing email:', error);
        res.status(500).json({
            error: 'Failed to polish email',
            details: error.message
        });
    }
});

// Send email using Gmail API
router.post('/send', authenticate, async (req, res) => {
    try {
        const { to, subject, body } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({ error: 'To, Subject, and Body are required' });
        }

        // Get user tokens
        const user = await User.findById(req.userId);
        if (!user || !user.gmailAccessToken) {
            return res.status(401).json({ error: 'Gmail account not connected' });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: user.gmailAccessToken,
            refresh_token: user.gmailRefreshToken
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Construct email
        // Helper to encode string to base64url format required by Gmail API
        const makeBody = (to, subject, message) => {
            const str = [
                `To: ${to}`,
                `Subject: ${subject}`,
                'Content-Type: text/plain; charset=utf-8',
                'MIME-Version: 1.0',
                '',
                message
            ].join('\n');

            return Buffer.from(str)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        };

        const raw = makeBody(to, subject, body);

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: raw
            }
        });

        res.json({ success: true, message: 'Email sent successfully' });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            error: 'Failed to send email',
            details: error.message
        });
    }
});

export default router;
