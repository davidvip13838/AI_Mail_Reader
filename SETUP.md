# Quick Setup Guide

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
1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Fill in your credentials:
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `OPENAI_API_KEY` - From OpenAI
   - `ELEVENLABS_API_KEY` - From ElevenLabs

### Frontend (.env)
1. Copy the example file:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Update if needed (default should work):
   ```env
   REACT_APP_API_URL=http://localhost:5001/api
   ```

## Step 3: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/Select a project
3. Enable **Gmail API**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client ID**
6. Configure OAuth consent screen (if not done)
7. Application type: **Web application**
8. Authorized redirect URIs: `http://localhost:5001/api/gmail/auth-callback`
9. Copy **Client ID** and **Client Secret** to backend `.env`

## Step 4: Run the Application

### Terminal 1 - Backend
```bash
cd backend
npm start
# or for development:
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

## Step 5: Use the App

1. Open `http://localhost:3000` in your browser
2. Click **Connect with Google**
3. Authorize the application
4. Fetch your unread emails
5. Generate summary
6. Generate and download audio

## Troubleshooting

### "Failed to authenticate with Google"
- Check that redirect URI matches exactly in Google Cloud Console
- Ensure Gmail API is enabled
- Verify Client ID and Secret are correct

### "Failed to fetch emails"
- Make sure you granted Gmail read permissions
- Check that access token is valid
- Try logging out and re-authenticating

### "Failed to generate summary"
- Verify OpenAI API key is correct
- Check you have API credits available
- Ensure the key has access to GPT-4

### "Failed to generate audio"
- Verify ElevenLabs API key is correct
- Check you have credits in your ElevenLabs account
- Ensure the API key has text-to-speech permissions

