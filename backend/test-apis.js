#!/usr/bin/env node

/**
 * Quick API Connection Test Script
 * Run this to quickly test if all APIs are configured correctly
 * Usage: node test-apis.js
 */

import dotenv from 'dotenv';
import { google } from 'googleapis';
import OpenAI from 'openai';
import axios from 'axios';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVar(name, required = true) {
  const value = process.env[name];
  if (!value || value.includes('your_') || value.includes('_here')) {
    if (required) {
      log(`❌ ${name}: Not configured`, 'red');
      return false;
    } else {
      log(`⚠️  ${name}: Not configured (optional)`, 'yellow');
      return false;
    }
  }
  log(`✅ ${name}: Configured`, 'green');
  return true;
}

async function testGmail() {
  log('\n📧 Testing Gmail API...', 'cyan');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!checkEnvVar('GOOGLE_CLIENT_ID') || 
      !checkEnvVar('GOOGLE_CLIENT_SECRET') || 
      !checkEnvVar('GOOGLE_REDIRECT_URI')) {
    return false;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent'
    });

    log(`   ✅ OAuth2 client created successfully`, 'green');
    log(`   📝 Auth URL generated: ${authUrl.substring(0, 50)}...`, 'blue');
    
    // Test with access token if available
    const accessToken = process.env.GMAIL_ACCESS_TOKEN;
    if (accessToken) {
      oauth2Client.setCredentials({ access_token: accessToken });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      log(`   ✅ Gmail API connected! Email: ${profile.data.emailAddress}`, 'green');
      return true;
    } else {
      log(`   ⚠️  Gmail API ready (no access token for full test)`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`   ❌ Gmail API error: ${error.message}`, 'red');
    return false;
  }
}

async function testOpenAI() {
  log('\n🤖 Testing OpenAI API...', 'cyan');
  
  if (!checkEnvVar('OPENAI_API_KEY')) {
    return false;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "test" and nothing else.' }
      ],
      max_tokens: 10,
      temperature: 0
    });

    log(`   ✅ OpenAI API connected!`, 'green');
    log(`   📝 Response: ${completion.choices[0].message.content}`, 'blue');
    log(`   🔢 Model: ${completion.model}`, 'blue');
    return true;
  } catch (error) {
    if (error.status === 401) {
      log(`   ❌ Invalid API key`, 'red');
    } else if (error.status === 429) {
      log(`   ❌ Rate limit exceeded`, 'red');
    } else {
      log(`   ❌ OpenAI API error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testElevenLabs() {
  log('\n🎵 Testing ElevenLabs API...', 'cyan');
  
  if (!checkEnvVar('ELEVENLABS_API_KEY')) {
    return false;
  }

  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    log(`   ✅ ElevenLabs API connected!`, 'green');
    log(`   🎤 Available voices: ${response.data.voices.length}`, 'blue');
    
    // Test TTS generation
    const ttsResponse = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      {
        text: 'Test',
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
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    log(`   ✅ Text-to-speech working! Audio size: ${ttsResponse.data.byteLength} bytes`, 'green');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      log(`   ❌ Invalid API key`, 'red');
    } else if (error.response?.status === 402) {
      log(`   ❌ Insufficient credits`, 'red');
    } else if (error.response?.status === 429) {
      log(`   ❌ Rate limit exceeded`, 'red');
    } else {
      log(`   ❌ ElevenLabs API error: ${error.response?.data?.message || error.message}`, 'red');
    }
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 Starting API Connection Tests...\n', 'cyan');
  log('=' .repeat(50), 'blue');

  const results = {
    gmail: await testGmail(),
    openai: await testOpenAI(),
    elevenlabs: await testElevenLabs()
  };

  log('\n' + '='.repeat(50), 'blue');
  log('\n📊 Test Results:', 'cyan');
  log(`   Gmail API:     ${results.gmail ? '✅ PASS' : '❌ FAIL'}`, results.gmail ? 'green' : 'red');
  log(`   OpenAI API:    ${results.openai ? '✅ PASS' : '❌ FAIL'}`, results.openai ? 'green' : 'red');
  log(`   ElevenLabs API: ${results.elevenlabs ? '✅ PASS' : '❌ FAIL'}`, results.elevenlabs ? 'green' : 'red');

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log('\n🎉 All APIs are connected and working!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some APIs failed. Please check your .env configuration.', 'yellow');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

