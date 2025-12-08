import express from 'express';
import axios from 'axios';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import User from '../models/User.js';

dotenv.config();

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const audioDir = join(__dirname, '..', 'audio');

// Generate audio from text using ElevenLabs - Requires authentication
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { text, voiceId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get user preferences for default voice
    const user = await User.findById(req.userId);
    const defaultVoiceId = user?.preferences?.defaultVoiceId || '21m00Tcm4TlvDq8ikWAM';

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    // Use provided voice ID, user preference, or default
    let selectedVoiceId = voiceId || defaultVoiceId;

    // Helper function to get first available voice if default fails
    const getFirstAvailableVoice = async () => {
      try {
        const voicesResponse = await axios.get('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': apiKey }
        });
        if (voicesResponse.data?.voices?.length > 0) {
          return voicesResponse.data.voices[0].voice_id;
        }
      } catch (err) {
        console.error('Failed to fetch available voices:', err.message);
      }
      return null;
    };

    let response;
    try {
      response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
        {
          text: text,
          model_id: 'eleven_turbo_v2_5',
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
    } catch (voiceError) {
      // If voice not found (404), try to get first available voice
      if (voiceError.response?.status === 404) {
        console.warn(`Voice ID ${selectedVoiceId} not found, trying to get first available voice...`);
        const fallbackVoiceId = await getFirstAvailableVoice();
        if (fallbackVoiceId) {
          selectedVoiceId = fallbackVoiceId;
          console.log(`Using fallback voice ID: ${fallbackVoiceId}`);
          response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${fallbackVoiceId}`,
            {
              text: text,
              model_id: 'eleven_turbo_v2_5',
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
        } else {
          throw voiceError; // Re-throw if we can't get a fallback voice
        }
      } else {
        throw voiceError; // Re-throw other errors
      }
    }

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
    // Parse error response - might be Buffer, string, or object
    let errorData = error.response?.data;
    if (Buffer.isBuffer(errorData)) {
      try {
        errorData = JSON.parse(errorData.toString());
      } catch (e) {
        errorData = { message: errorData.toString() };
      }
    }
    
    console.error('Error generating audio:', errorData || error.message);
    
    let statusCode = 500;
    let errorMessage = 'Failed to generate audio';
    let errorDetails = errorData?.message || error.message;
    
    if (error.response?.status === 401) {
      statusCode = 401;
      const errorDetail = errorData?.detail;
      if (errorDetail?.status === 'missing_permissions') {
        errorMessage = 'ElevenLabs API key missing permissions';
        errorDetails = `Missing permission: ${errorDetail.message}. Please create a new API key with "voices_read" and "text_to_speech" permissions at https://elevenlabs.io/app/settings/api-keys`;
      } else if (errorDetail?.status === 'detected_unusual_activity') {
        errorMessage = 'Unusual activity detected - Free Tier disabled';
        errorDetails = `${errorDetail.message}. If using VPN/Proxy, disable it or upgrade to a Paid Plan. Visit https://elevenlabs.io/pricing`;
      } else {
        errorMessage = 'Invalid ElevenLabs API key';
        errorDetails = 'Please check your ELEVENLABS_API_KEY in .env file. Get your key at https://elevenlabs.io/app/settings/api-keys';
      }
    } else if (error.response?.status === 402) {
      statusCode = 402;
      errorMessage = 'Insufficient ElevenLabs credits';
      errorDetails = 'Please add credits to your ElevenLabs account';
    } else if (error.response?.status === 404) {
      statusCode = 404;
      errorMessage = 'Voice model not found or deprecated';
      const errorDetail = errorData?.detail;
      if (errorDetail?.message) {
        errorDetails = `Voice ID not found: ${errorDetail.message}. The voice model may have been deprecated. Use GET /api/audio/voices to see available voices.`;
      } else {
        errorDetails = 'The specified voice ID is not available. The voice model may have been deprecated. Use GET /api/audio/voices to see available voices.';
      }
    } else if (error.response?.status === 429) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
      errorDetails = 'Please try again later';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage, 
      details: errorDetails,
      statusCode: error.response?.status
    });
  }
});

// Get list of available voices - Optional authentication (to show user's preferred voice)
router.get('/voices', optionalAuth, async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
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
    console.error('Error fetching voices:', error.response?.data || error.message);
    
    let statusCode = 500;
    let errorMessage = 'Failed to fetch voices';
    let errorDetails = error.response?.data?.message || error.message;
    
    if (error.response?.status === 401) {
      statusCode = 401;
      const errorDetail = error.response?.data?.detail;
      if (errorDetail?.status === 'missing_permissions') {
        errorMessage = 'ElevenLabs API key missing permissions';
        errorDetails = `Missing permission: ${errorDetail.message}. Please create a new API key with "voices_read" permission at https://elevenlabs.io/app/settings/api-keys`;
      } else {
        errorMessage = 'Invalid ElevenLabs API key';
        errorDetails = 'Please check your ELEVENLABS_API_KEY in .env file. Get your key at https://elevenlabs.io/app/settings/api-keys';
      }
    } else if (error.response?.status === 429) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
      errorDetails = 'Please try again later';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage, 
      details: errorDetails,
      statusCode: error.response?.status
    });
  }
});

export default router;

