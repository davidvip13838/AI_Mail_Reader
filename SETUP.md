# Quick Setup Guide

Follow these steps to get AI Mail Reader up and running quickly.

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Configure Environment Variables

### Backend (.env)
1. Create a `.env` file in the `backend` directory:
   ```bash
   cd backend
   touch .env
   ```

2. Add the following variables:
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

3. Fill in your credentials:
   - **GOOGLE_CLIENT_ID** & **GOOGLE_CLIENT_SECRET** - From Google Cloud Console (see Step 3)
   - **OPENAI_API_KEY** - From [OpenAI Platform](https://platform.openai.com/api-keys)
   - **ELEVENLABS_API_KEY** - From [ElevenLabs](https://elevenlabs.io/app/settings/api-keys)
   - **MONGODB_URI** - Your MongoDB connection string (use MongoDB Atlas connection string if using cloud)

### Frontend (.env)
1. Create a `.env` file in the `frontend` directory:
   ```bash
   cd frontend
   touch .env
   ```

2. Add the following (default should work for local development):
   ```env
   REACT_APP_API_URL=http://localhost:5001/api
   ```

## Step 3: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Gmail API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Gmail API"
   - Click **Enable**
4. Configure OAuth consent screen:
   - Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** (for testing) or **Internal** (for organization)
   - Fill in required fields (App name, User support email, etc.)
   - Add scopes: `https://www.googleapis.com/auth/gmail.readonly`
   - Add test users (if using External type)
5. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: "AI Mail Reader" (or your choice)
   - Authorized redirect URIs: `http://localhost:5001/api/gmail/auth-callback`
   - Click **Create**
6. Copy credentials:
   - Copy the **Client ID** to `GOOGLE_CLIENT_ID` in backend `.env`
   - Copy the **Client Secret** to `GOOGLE_CLIENT_SECRET` in backend `.env`

## Step 4: MongoDB Setup

### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   # Start MongoDB from Services
   ```
3. Use connection string: `mongodb://localhost:27017/ai-mail-reader`

### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get connection string and update `MONGODB_URI` in backend `.env`
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/ai-mail-reader`

## Step 5: Run the Application

### Terminal 1 - Backend Server
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

You should see:
```
✅ Connected to MongoDB
Server is running on port 5001
```

### Terminal 2 - Frontend Development Server
```bash
cd frontend
npm start
```

The frontend will automatically open at `http://localhost:3000`

## Step 6: Use the App

1. **Register/Login**: 
   - Create a new account or login with existing credentials
   - Your credentials are stored securely in MongoDB

2. **Connect Gmail**:
   - Click "🔐 Connect Gmail" button
   - You'll be redirected to Google to authorize the app
   - Grant Gmail read permissions
   - You'll be redirected back to the app

3. **Customize Summary** (Optional):
   - Click "▶ Show Options" in Summary Settings
   - Adjust number of emails (1-50) using the slider
   - Select date filter (Today, Last 7 Days, Last 30 Days, All)
   - Click "▶ Hide Options" to collapse

4. **Fetch Emails**:
   - Click "📥 Fetch Unread Emails"
   - Your unread emails will be displayed

5. **Generate Summary**:
   - Click "🤖 Generate AI Summary"
   - Wait for the AI to process your emails
   - Summary will appear below

6. **Generate Audio**:
   - Click "🎵 Generate Audio"
   - Wait for audio generation (may take a few seconds)
   - Audio player will appear

7. **Download Audio**:
   - Click "⬇️ Download Audio File"
   - MP3 file will be saved to your downloads

8. **Manage Audio History**:
   - Scroll down to "📚 Audio History" section
   - View all your previously generated audio files
   - Each entry shows:
     - Date and time generated
     - Number of emails summarized
     - Date filter used
   - Play, download, or delete any audio file
   - Click "🔄 Refresh" to reload history

## 🐛 Troubleshooting

### "Failed to authenticate with Google"
- ✅ Check that redirect URI matches exactly in Google Cloud Console
- ✅ Ensure Gmail API is enabled
- ✅ Verify Client ID and Secret are correct in `.env`
- ✅ Make sure OAuth consent screen is configured
- ✅ Check that you're using the correct redirect URI format

### "Failed to fetch emails"
- ✅ Make sure you granted Gmail read permissions during OAuth
- ✅ Check that access token is valid (try reconnecting Gmail)
- ✅ Verify Gmail API is enabled in Google Cloud Console
- ✅ Try logging out and re-authenticating

### "Failed to generate summary"
- ✅ Verify OpenAI API key is correct in backend `.env`
- ✅ Check you have API credits available
- ✅ Ensure the key has access to GPT-4 model
- ✅ Check OpenAI API status page for outages

### "Failed to generate audio"
- ✅ Verify ElevenLabs API key is correct in backend `.env`
- ✅ Check you have credits in your ElevenLabs account
- ✅ Ensure the API key has `text_to_speech` and `voices_read` permissions
- ✅ If using free tier, disable VPN/proxy
- ✅ Check ElevenLabs status page for issues

### "MongoDB connection error"
- ✅ Verify MongoDB is running (local) or connection string is correct (Atlas)
- ✅ Check network connectivity
- ✅ Ensure database user has proper permissions
- ✅ Verify connection string format is correct
- ✅ Check firewall settings (for Atlas)

### "Audio file not found" or deletion issues
- ✅ Check that `backend/audio` directory exists and is writable
- ✅ Verify file permissions
- ✅ Check disk space availability
- ✅ Ensure audio files weren't manually deleted

### Frontend not connecting to backend
- ✅ Verify backend is running on port 5001
- ✅ Check `REACT_APP_API_URL` in frontend `.env`
- ✅ Ensure CORS is properly configured
- ✅ Check browser console for errors
- ✅ Verify `FRONTEND_URL` in backend `.env` matches frontend URL

## 📝 Notes

- Audio files are stored in `backend/audio/` directory
- User data and audio metadata are stored in MongoDB
- Gmail tokens are automatically refreshed when expired
- All API keys should be kept secure and never committed to git
- For production deployment, update all URLs and use HTTPS

## 🚀 Production Deployment

When deploying to production:

1. Update all URLs to production domains
2. Use HTTPS for all connections
3. Set secure JWT secrets
4. Configure proper CORS policies
5. Use environment-specific MongoDB databases
6. Set up proper logging and monitoring
7. Implement rate limiting
8. Use secure session management
9. Set up automated backups for MongoDB
10. Configure proper file storage (consider cloud storage for audio files)
