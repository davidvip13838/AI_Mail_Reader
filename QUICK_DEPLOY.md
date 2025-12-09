# Quick Deploy Guide - AWS Elastic Beanstalk

## Prerequisites Checklist

- [ ] AWS Account created
- [ ] AWS CLI installed (`aws --version`)
- [ ] EB CLI installed (`pip install awsebcli`)
- [ ] MongoDB Atlas cluster set up
- [ ] Google OAuth credentials ready
- [ ] OpenAI API key ready
- [ ] ElevenLabs API key ready

## Quick Start (5 Steps)

### 1. Configure AWS
```bash
aws configure
```

### 2. Initialize EB
```bash
cd /Users/ng161/cswap/AI_mail_reader
eb init
```
- Select region (e.g., `us-east-1`)
- Platform: **Node.js**
- Version: **Node.js 18** or higher

### 3. Create Environment
```bash
eb create ai-mail-reader-prod
```
Wait 5-10 minutes for deployment.

### 4. Set Environment Variables
```bash
eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/ai-mail-reader" \
  JWT_SECRET="change-this-to-a-secure-random-string" \
  JWT_EXPIRES_IN=7d \
  GOOGLE_CLIENT_ID="your_client_id" \
  GOOGLE_CLIENT_SECRET="your_client_secret" \
  GOOGLE_REDIRECT_URI="https://YOUR-APP-NAME.REGION.elasticbeanstalk.com/api/gmail/auth-callback" \
  OPENAI_API_KEY="your_openai_key" \
  ELEVENLABS_API_KEY="your_elevenlabs_key" \
  FRONTEND_URL="https://YOUR-APP-NAME.REGION.elasticbeanstalk.com"
```

**Get your app URL:**
```bash
eb status
```

### 5. Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Edit OAuth 2.0 Client ID
3. Add redirect URI: `https://YOUR-APP-NAME.REGION.elasticbeanstalk.com/api/gmail/auth-callback`

## Deploy Updates

```bash
git add .
git commit -m "Your changes"
eb deploy
```

## Useful Commands

```bash
eb status          # Check app status
eb logs            # View logs
eb ssh             # SSH into instance
eb health          # Check health
eb open            # Open app in browser
```

## Troubleshooting

**Build fails?**
- Check `eb logs` for errors
- Ensure all dependencies are in package.json

**Can't connect to MongoDB?**
- Whitelist `0.0.0.0/0` in MongoDB Atlas
- Verify connection string

**CORS errors?**
- Ensure FRONTEND_URL matches your EB URL exactly

For detailed instructions, see [DEPLOY.md](./DEPLOY.md)

