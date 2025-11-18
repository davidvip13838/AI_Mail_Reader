import { describe, it, expect, beforeAll } from '@jest/globals';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

describe('OpenAI API Connection Tests', () => {
  let openai;

  beforeAll(() => {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  });

  describe('Environment Variables', () => {
    it('should have OPENAI_API_KEY configured', () => {
      expect(process.env.OPENAI_API_KEY).toBeDefined();
      expect(process.env.OPENAI_API_KEY).not.toBe('your_openai_api_key_here');
      expect(process.env.OPENAI_API_KEY.length).toBeGreaterThan(0);
      expect(process.env.OPENAI_API_KEY).toMatch(/^sk-/);
    });
  });

  describe('OpenAI Client Setup', () => {
    it('should create OpenAI client successfully', () => {
      expect(openai).toBeDefined();
      expect(openai.apiKey).toBe(process.env.OPENAI_API_KEY);
    });
  });

  describe('API Connection Test', () => {
    it('should connect to OpenAI API and make a test request', async () => {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant.'
            },
            {
              role: 'user',
              content: 'Say "API connection test successful" and nothing else.'
            }
          ],
          max_tokens: 20,
          temperature: 0
        });

        expect(completion).toBeDefined();
        expect(completion.choices).toBeDefined();
        expect(completion.choices.length).toBeGreaterThan(0);
        expect(completion.choices[0].message).toBeDefined();
        expect(completion.choices[0].message.content).toBeDefined();
        
        console.log('✅ OpenAI API connected successfully');
        console.log('   Response:', completion.choices[0].message.content);
        console.log('   Model:', completion.model);
        console.log('   Tokens used:', completion.usage?.total_tokens || 'N/A');
      } catch (error) {
        console.error('❌ OpenAI API connection failed:', error.message);
        if (error.status === 401) {
          throw new Error('Invalid API key. Please check your OPENAI_API_KEY in .env');
        } else if (error.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw error;
        }
      }
    }, 30000); // 30 second timeout for API call

    it('should handle email summarization request format', async () => {
      const testEmails = [
        {
          from: 'test@example.com',
          subject: 'Test Email 1',
          date: new Date().toISOString(),
          snippet: 'This is a test email snippet.',
          body: 'This is the full body of the test email.'
        }
      ];

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes emails in a natural, conversational tone suitable for text-to-speech.'
            },
            {
              role: 'user',
              content: `Please provide a concise and natural-sounding summary of the following unread emails. 
The summary should be written in a conversational tone, as if you're reading the emails to someone. 
Keep it clear, organized, and easy to understand.

Emails:
${testEmails.map((email, index) => 
  `Email ${index + 1}:
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Content: ${email.snippet || email.body}
---`
).join('\n\n')}

Summary:`
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        });

        expect(completion.choices[0].message.content).toBeDefined();
        expect(completion.choices[0].message.content.length).toBeGreaterThan(0);
        
        console.log('✅ Email summarization test successful');
        console.log('   Summary:', completion.choices[0].message.content.substring(0, 100) + '...');
      } catch (error) {
        console.error('❌ Email summarization test failed:', error.message);
        throw error;
      }
    }, 30000);
  });
});

