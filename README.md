# Amail

A modern MERN stack application that reads your Gmail unread emails, summarizes them using ChatGPT, and converts the summary to an audio file using ElevenLabs. Features a beautiful startup-style UI with full audio history management.

## ✨ Features

### Core Functionality
- 👤 **User Authentication** - Secure registration and login with MongoDB
- 🔐 **Google OAuth2** - Seamless Gmail account connection
- 💾 **Secure Token Storage** - Gmail tokens stored securely in database
- 📧 **Email Fetching** - Retrieve unread emails from Gmail
- 🤖 **AI Summarization** - Powered by OpenAI GPT-4
- 🎵 **Text-to-Speech** - Convert summaries to audio using ElevenLabs
- ⬇️ **Audio Downloads** - Download MP3 files directly
- ✨ **Smart Compose** - Polish rough drafts into professional emails and send them via Gmail

### Advanced Features
- 📚 **Audio History** - Track all generated audio files with metadata
- 🗑️ **Audio Management** - Delete audio files from history
- ⚙️ **Summary Customization** - Customize email summarization:
  - Choose number of emails to summarize (1-50)
  - Filter by date (Today, Last 7 Days, Last 30 Days, All)
- 🎨 **Modern UI** - Beautiful startup-style design with:
  - Glassmorphism effects
  - Smooth animations and transitions
  - Gradient accents
  - Responsive design
  - Dark theme with modern aesthetics

## 🛠️ Tech Stack

- **Frontend**: React 19, Axios
- **Backend**: Node.js, Express
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **APIs**: 
  - Gmail API (Google OAuth2)
  - OpenAI API (GPT-4)
  - ElevenLabs API (Text-to-Speech)

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v14 or higher) and npm installed
2. **MongoDB** installed and running (or MongoDB Atlas account)
3. **Google Cloud Project** with Gmail API enabled
4. **OpenAI API key** with GPT-4 access
5. **ElevenLabs API key** with text-to-speech permissions

## 🚀 Setup Instructions

### 1. Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Gmail API**
4. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - Add scopes: 
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.compose`
6. Add authorized redirect URI: `http://localhost:5001/api/gmail/auth-callback`
7. Copy your **Client ID** and **Client Secret**

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

## 📖 Usage

1. **Open the App**: Navigate to `http://localhost:3000` in your browser
2. **Register/Login**: Create a new account or login with existing credentials
3. **Connect Gmail**: Click "Connect Gmail" to authenticate with your Gmail account
4. **Customize Summary** (Optional):
   - Click "Show Options" in Summary Settings
   - Select number of emails (1-50)
   - Choose date filter (Today, Last 7 Days, Last 30 Days, All)
5. **Fetch Emails**: Click "Fetch Unread Emails" to retrieve your emails
6. **Generate Summary**: Click "Generate AI Summary" to create an AI summary
7. **Generate Audio**: Click "Generate Audio" to convert the summary to speech
8. **Download**: Click "Download Audio File" to save the MP3
9. **Manage History**: View, play, and delete audio files from your history
10. **Compose & Send**:
    - Click "✨ Compose" in the header
    - Write a rough draft (e.g., "hey boss sick today")
    - Choose a tone and click "Polish with AI"
    - Review the professional email and click "Send Email"

## 📁 Project Structure

```
AI_mail_reader/
├── backend/
│   ├── models/
│   │   ├── User.js       # MongoDB User model
│   │   └── Audio.js      # MongoDB Audio model (history tracking)
│   ├── middleware/
│   │   └── auth.js       # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js       # User authentication routes
│   │   ├── gmail.js      # Gmail API integration
│   │   ├── summarize.js  # OpenAI ChatGPT integration
│   │   └── audio.js      # ElevenLabs TTS & audio history
│   ├── audio/            # Generated audio files (gitignored)
│   ├── tests/            # Test files
│   ├── server.js         # Express server
│   ├── package.json
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── App.css       # Modern styles
│   │   └── index.js      # React entry point
│   ├── public/
│   │   └── index.html    # HTML template
│   ├── package.json
│   └── .env              # Frontend environment variables
├── README.md
└── SETUP.md
```

## 🔌 API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Authentication (Protected - requires JWT token)
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile (name, preferences)
- `PUT /api/auth/gmail-tokens` - Update Gmail OAuth tokens
- `POST /api/auth/logout` - Logout user

### Gmail (Protected)
- `GET /api/gmail/auth-url` - Get Google OAuth URL
- `POST /api/gmail/auth-callback` - Exchange OAuth code for token
- `POST /api/gmail/unread-emails` - Fetch unread emails
  - Body: `{ maxResults: number, dateFilter: 'today'|'last7days'|'last30days'|'all' }`

### Summarize (Protected)
- `POST /api/summarize/summarize` - Generate email summary
  - Body: `{ emails: Array }`

### Audio (Protected)
- `POST /api/audio/generate` - Generate audio from text
  - Body: `{ text: string, voiceId?: string, emailCount?: number, dateFilter?: string }`
- `GET /api/audio/history` - Get user's audio history
- `DELETE /api/audio/:audioId` - Delete audio file
- `GET /api/audio/voices` - Get available ElevenLabs voices

### Email (Protected)
- `POST /api/email/polish` - Rewrite rough draft using AI
  - Body: `{ draft: string, tone: 'professional'|'casual'|... }`
- `POST /api/email/send` - Send email via Gmail
  - Body: `{ to: string, subject: string, body: string }`

### Other
- `GET /api/health` - Health check
- `GET /audio/:filename` - Download audio file

## 🔐 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `JWT_EXPIRES_IN` - JWT token expiration (default: 7d)
- `GOOGLE_CLIENT_ID` - Google OAuth2 Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth2 Client Secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URI
- `OPENAI_API_KEY` - OpenAI API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5001/api)

## 🐛 Troubleshooting

### Gmail API Issues
- Ensure Gmail API is enabled in Google Cloud Console
- Verify OAuth consent screen is configured
- Check that redirect URI matches exactly
- Ensure you granted `gmail.readonly` scope

### OpenAI API Issues
- Verify your API key is correct and has credits
- Check rate limits if you're getting errors
- Ensure the key has access to GPT-4 model

### ElevenLabs API Issues
- Ensure your API key is valid
- Check you have credits in your ElevenLabs account
- Verify the API key has `text_to_speech` and `voices_read` permissions
- If using free tier, ensure no VPN/proxy is active

### MongoDB Issues
- Verify MongoDB is running (local) or connection string is correct (Atlas)
- Check network connectivity
- Ensure database user has proper permissions

### Audio Generation Issues
- Check that audio directory exists and is writable
- Verify file permissions
- Check disk space availability

## 🔒 Security Notes

- **Never commit `.env` files** to version control
- Keep your API keys secure and rotate them regularly
- Use environment variables for all sensitive data
- In production:
  - Use HTTPS for all connections
  - Implement rate limiting
  - Use secure session management
  - Validate and sanitize all inputs
  - Set up proper CORS policies

## 📝 License

ISC

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 🎯 Future Enhancements

- [ ] Email categorization and filtering
- [ ] Multiple voice options per user
- [ ] Scheduled email summaries
- [ ] Email search functionality
- [ ] Export summaries as PDF
- [ ] Mobile app version
- [ ] Multi-language support
