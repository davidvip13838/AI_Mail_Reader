import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Summarize emails using ChatGPT
router.post('/summarize', async (req, res) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Emails array is required' });
    }

    // Format emails for the prompt
    const emailText = emails.map((email, index) => {
      return `Email ${index + 1}:
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Content: ${email.snippet || email.body}
---`;
    }).join('\n\n');

    const prompt = `Please provide a concise and natural-sounding summary of the following unread emails. 
The summary should be written in a conversational tone, as if you're reading the emails to someone. 
Keep it clear, organized, and easy to understand. If there are multiple emails, mention how many there are and summarize the key points from each.

Emails:
${emailText}

Summary:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes emails in a natural, conversational tone suitable for text-to-speech.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const summary = completion.choices[0].message.content;

    res.json({ summary });
  } catch (error) {
    console.error('Error summarizing emails:', error);
    res.status(500).json({ 
      error: 'Failed to summarize emails', 
      details: error.message 
    });
  }
});

export default router;

