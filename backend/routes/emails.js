import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Email from '../models/Email.js';

const router = express.Router();

// Get emails from local DB
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (page - 1) * limit;

        const query = { userId: req.userId };

        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { from: { $regex: search, $options: 'i' } },
                { snippet: { $regex: search, $options: 'i' } }
            ];
        }

        const emails = await Email.find(query)
            .sort({ date: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Email.countDocuments(query);

        res.json({
            emails,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching local emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

export default router;
