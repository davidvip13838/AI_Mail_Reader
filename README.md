# AI Mail Reader

A MERN stack application that reads your Gmail unread emails, summarizes them using ChatGPT, and converts the summary to an audio file using ElevenLabs.

## Features

- 👤 User authentication with MongoDB (register/login)
- 🔐 Google OAuth2 authentication for Gmail access
- 💾 Secure storage of Gmail tokens in database
- 📧 Fetch and display unread emails from Gmail
- 🤖 AI-powered email summarization using OpenAI GPT-4
- 🎵 Text-to-speech conversion using ElevenLabs
- ⬇️ Download audio summaries as MP3 files
- 🎨 Modern, responsive UI

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js, Express
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **APIs**: Gmail API, OpenAI API, ElevenLabs API

## Prerequisites

Before you begin, ensure you have:

1. Node.js (v14 or higher) and npm installed
2. MongoDB installed and running (or MongoDB Atlas account)
3. A Google Cloud Project with Gmail API enabled
4. An OpenAI API key
5. An ElevenLabs API key

## Setup Instructions

### 1. Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Add authorized redirect URI: `http://localhost:3000` (or `http://localhost:5001/api/gmail/auth-callback` if you prefer backend handling)
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
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/ai-mail-reader
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=7d
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:5001/api/gmail/auth-callback
   OPENAI_API_KEY=your_openai_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   FRONTEND_URL=http://localhost:3000
   ```

   **Note**: For MongoDB Atlas, use: `mongodb+srv://username:password@cluster.mongodb.net/ai-mail-reader`

5. Start the backend server:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

The backend will run on `http://localhost:5001`

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
   REACT_APP_API_URL=http://localhost:5001/api
   ```

5. Start the frontend development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. **Register or Login**: Create a new account or login with existing credentials
3. **Connect Gmail**: Click "Connect Gmail" to authenticate with your Gmail account
4. **Fetch Emails**: Click "Fetch Unread Emails" to retrieve your unread emails
5. **Generate Summary**: Click "Generate Summary" to create an AI summary of your emails
6. **Generate Audio**: Click "Generate Audio" to convert the summary to speech
7. **Download**: Click "Download Audio File" to save the MP3 file to your device

## Project Structure

```
AI_mail_reader/
├── backend/
│   ├── models/
│   │   └── User.js       # MongoDB User model
│   ├── middleware/
│   │   └── auth.js       # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js       # User authentication routes
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

#### Authentication (Public)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

#### Authentication (Protected - requires JWT token)
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/gmail-tokens` - Update Gmail OAuth tokens
- `POST /api/auth/logout` - Logout user

#### Gmail (Protected)
- `GET /api/gmail/auth-url` - Get Google OAuth URL
- `POST /api/gmail/auth-callback` - Exchange OAuth code for token (saves to user account)
- `POST /api/gmail/unread-emails` - Fetch unread emails (uses tokens from user account)

#### Summarize (Protected)
- `POST /api/summarize/summarize` - Generate email summary

#### Audio (Protected)
- `POST /api/audio/generate` - Generate audio from text
- `GET /api/audio/voices` - Get available ElevenLabs voices

#### Other
- `GET /api/health` - Health check
- `GET /audio/:filename` - Download audio file

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5001)
- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/ai-mail-reader)
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `JWT_EXPIRES_IN` - JWT token expiration (default: 7d)
- `GOOGLE_CLIENT_ID` - Google OAuth2 Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth2 Client Secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URI
- `OPENAI_API_KEY` - OpenAI API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

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

