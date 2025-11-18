import express from 'express';
import axios from 'axios';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const audioDir = join(__dirname, '..', 'audio');

// Generate audio from text using ElevenLabs
router.post('/generate', async (req, res) => {
  try {
    const { text, voiceId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    // Use default voice or provided voice ID
    const selectedVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        text: text,
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

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `summary_${timestamp}.mp3`;
    const filepath = join(audioDir, filename);

    // Save audio file
    await fs.writeFile(filepath, response.data);

    res.json({ 
      filename,
      url: `/audio/${filename}`,
      message: 'Audio generated successfully'
    });
  } catch (error) {
    console.error('Error generating audio:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate audio', 
      details: error.response?.data?.message || error.message 
    });
  }
});

// Get list of available voices
router.get('/voices', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey
      }
    });

    res.json({ voices: response.data.voices });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch voices', 
      details: error.message 
    });
  }
});

export default router;

