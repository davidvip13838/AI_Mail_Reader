import { describe, it, expect } from '@jest/globals';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

describe('ElevenLabs API Connection Tests', () => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const baseURL = 'https://api.elevenlabs.io/v1';

  describe('Environment Variables', () => {
    it('should have ELEVENLABS_API_KEY configured', () => {
      expect(apiKey).toBeDefined();
      expect(apiKey).not.toBe('your_elevenlabs_api_key_here');
      expect(apiKey.length).toBeGreaterThan(0);
    });
  });

  describe('API Connection Test', () => {
    it('should connect to ElevenLabs API and fetch available voices', async () => {
      try {
        const response = await axios.get(`${baseURL}/voices`, {
          headers: {
            'xi-api-key': apiKey
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(response.data.voices).toBeDefined();
        expect(Array.isArray(response.data.voices)).toBe(true);
        expect(response.data.voices.length).toBeGreaterThan(0);

        console.log('✅ ElevenLabs API connected successfully');
        console.log('   Available voices:', response.data.voices.length);
        console.log('   Sample voices:');
        response.data.voices.slice(0, 3).forEach(voice => {
          console.log(`     - ${voice.name} (${voice.voice_id})`);
        });
      } catch (error) {
        console.error('❌ ElevenLabs API connection failed:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your ELEVENLABS_API_KEY in .env');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw error;
        }
      }
    }, 30000);

    it('should generate audio from text', async () => {
      const testText = 'This is a test of the ElevenLabs text to speech API.';
      const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel

      try {
        const response = await axios.post(
          `${baseURL}/text-to-speech/${voiceId}`,
          {
            text: testText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          },
          {
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': apiKey
            },
            responseType: 'arraybuffer'
          }
        );

        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(Buffer.isBuffer(response.data) || response.data instanceof ArrayBuffer).toBe(true);
        expect(response.data.byteLength || response.data.length).toBeGreaterThan(0);
        expect(response.headers['content-type']).toContain('audio');

        console.log('✅ Text-to-speech generation successful');
        console.log('   Audio size:', (response.data.byteLength || response.data.length), 'bytes');
        console.log('   Content type:', response.headers['content-type']);
      } catch (error) {
        console.error('❌ Text-to-speech generation failed:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your ELEVENLABS_API_KEY in .env');
        } else if (error.response?.status === 402) {
          throw new Error('Insufficient credits. Please add credits to your ElevenLabs account.');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw error;
        }
      }
    }, 30000);
  });

  describe('Voice Configuration', () => {
    it('should validate default voice ID format', () => {
      const defaultVoiceId = '21m00Tcm4TlvDq8ikWAM';
      expect(defaultVoiceId).toMatch(/^[a-zA-Z0-9]+$/);
      expect(defaultVoiceId.length).toBeGreaterThan(0);
    });
  });
});

