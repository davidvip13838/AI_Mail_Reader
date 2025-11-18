# AI Mail Reader

A MERN stack application that reads your Gmail unread emails, summarizes them using ChatGPT, and converts the summary to an audio file using ElevenLabs.

## Features

- 🔐 Google OAuth2 authentication for Gmail access
- 📧 Fetch and display unread emails from Gmail
- 🤖 AI-powered email summarization using OpenAI GPT-4
- 🎵 Text-to-speech conversion using ElevenLabs
- ⬇️ Download audio summaries as MP3 files
- 🎨 Modern, responsive UI

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js, Express
- **APIs**: Gmail API, OpenAI API, ElevenLabs API

## Prerequisites

Before you begin, ensure you have:

1. Node.js (v14 or higher) and npm installed
2. A Google Cloud Project with Gmail API enabled
3. An OpenAI API key
4. An ElevenLabs API key

## Setup Instructions

### 1. Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Add authorized redirect URI: `http://localhost:3000` (or `http://localhost:5000/api/gmail/auth-callback` if you prefer backend handling)
7. Copy your Client ID and Client Secret

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your credentials:
   ```env
   PORT=5000
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/gmail/auth-callback
   OPENAI_API_KEY=your_openai_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

5. Start the backend server:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your API URL (if different from default):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

5. Start the frontend development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Connect with Google" to authenticate with your Gmail account
3. Click "Fetch Unread Emails" to retrieve your unread emails
4. Click "Generate Summary" to create an AI summary of your emails
5. Click "Generate Audio" to convert the summary to speech
6. Click "Download Audio File" to save the MP3 file to your device

## Project Structure

```
AI_mail_reader/
├── backend/
│   ├── routes/
│   │   ├── gmail.js      # Gmail API integration
│   │   ├── summarize.js  # OpenAI ChatGPT integration
│   │   └── audio.js      # ElevenLabs TTS integration
│   ├── audio/            # Generated audio files (gitignored)
│   ├── server.js         # Express server
│   ├── package.json
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── App.css       # Styles
│   │   └── index.js      # React entry point
│   ├── package.json
│   └── .env              # Frontend environment variables
└── README.md
```

## API Endpoints

### Backend API

- `GET /api/health` - Health check
- `GET /api/gmail/auth-url` - Get Google OAuth URL
- `POST /api/gmail/auth-callback` - Exchange OAuth code for token
- `POST /api/gmail/unread-emails` - Fetch unread emails
- `POST /api/summarize/summarize` - Generate email summary
- `POST /api/audio/generate` - Generate audio from text
- `GET /api/audio/voices` - Get available ElevenLabs voices
- `GET /audio/:filename` - Download audio file

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `GOOGLE_CLIENT_ID` - Google OAuth2 Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth2 Client Secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URI
- `OPENAI_API_KEY` - OpenAI API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL

## Troubleshooting

### Gmail API Issues
- Ensure Gmail API is enabled in Google Cloud Console
- Verify OAuth consent screen is configured
- Check that redirect URI matches exactly

### OpenAI API Issues
- Verify your API key is correct and has credits
- Check rate limits if you're getting errors

### ElevenLabs API Issues
- Ensure your API key is valid
- Check your ElevenLabs account has available credits

## Security Notes

- Never commit `.env` files to version control
- Keep your API keys secure
- Use environment variables for all sensitive data
- In production, use HTTPS and secure session management

## License

ISC

## Contributing

Feel free to submit issues and enhancement requests!

