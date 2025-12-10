import express from 'express';
import { google } from 'googleapis';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import Email from '../models/Email.js';

const router = express.Router();

// Sync recent emails from Gmail to DB
router.post('/sync', authenticate, async (req, res) => {
    try {
        const { maxResults = 50, fullSync = false } = req.body;

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

        // Fetch list of messages
        // If fullSync is true, we might paginate, but for now lets keep it simple with a higher max
        // Note: 'maxResults' applies to the list call, not necessarily number of full emails fetched if simplified
        const listResponse = await gmail.users.messages.list({
            userId: 'me',
            maxResults: fullSync ? 200 : maxResults,
            // includeSpamTrash: false
        });

        const messages = listResponse.data.messages || [];
        let syncedCount = 0;
        let newCount = 0;

        console.log(`Found ${messages.length} messages to sync check.`);

        // Process in batches to avoid rate limits
        const BATCH_SIZE = 10;
        for (let i = 0; i < messages.length; i += BATCH_SIZE) {
            const batch = messages.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (msg) => {
                try {
                    // Check if already exists in DB
                    const existing = await Email.findOne({ gmailId: msg.id, userId: user._id });
                    if (existing) {
                        // Already synced
                        return;
                    }

                    // Fetch details
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'full'
                    });

                    const headers = detail.data.payload.headers;
                    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
                    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
                    const to = headers.find(h => h.name === 'To')?.value || '';
                    // Handle Date parsing carefully
                    const dateStr = headers.find(h => h.name === 'Date')?.value;
                    const date = dateStr ? new Date(dateStr) : new Date();

                    // Body extraction
                    const extractBody = (part) => {
                        if (part.body && part.body.data) {
                            return Buffer.from(part.body.data, 'base64').toString('utf-8');
                        }
                        if (part.parts) {
                            return part.parts.map(extractBody).join('\n');
                        }
                        return '';
                    };
                    const body = extractBody(detail.data.payload) || detail.data.snippet;

                    // Upsert to DB
                    await Email.updateOne(
                        { gmailId: msg.id, userId: user._id },
                        {
                            userId: user._id,
                            gmailId: msg.id,
                            threadId: msg.threadId,
                            snippet: detail.data.snippet,
                            subject,
                            from,
                            to,
                            date,
                            body,
                            labels: detail.data.labelIds
                        },
                        { upsert: true }
                    );

                    newCount++;
                } catch (err) {
                    console.error(`Failed to sync msg ${msg.id}:`, err.message);
                }
            }));

            syncedCount += batch.length;
        }

        res.json({
            success: true,
            message: `Sync complete.`,
            stats: {
                checked: messages.length,
                added: newCount
            }
        });

    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Failed to sync emails', details: error.message });
    }
});

export default router;
