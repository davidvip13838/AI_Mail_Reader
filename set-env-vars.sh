#!/bin/bash

# Set all required environment variables for Elastic Beanstalk
# Run this once the environment status is "Ready"

echo "🔧 Setting environment variables for Elastic Beanstalk..."
echo ""

eb setenv \
  NODE_ENV=production \
  MONGODB_URI="mongodb+srv://ng161:Administerators8@cluster1.tl4rhqv.mongodb.net/?appName=Cluster1" \
  JWT_SECRET="your-very-secure-secret-key-change-this" \
  JWT_EXPIRES_IN=7d \
  GOOGLE_CLIENT_ID="298517799358-sd5hgq2sd47i06fvfbh54vcasdbsvekt.apps.googleusercontent.com" \
  GOOGLE_CLIENT_SECRET="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" \
  GOOGLE_REDIRECT_URI="https://ai-mail-reader-prod.eba-vdw6mam7.us-east-1.elasticbeanstalk.com/api/gmail/auth-callback" \
  OPENAI_API_KEY="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" \
  ELEVENLABS_API_KEY="sk_08a7d084c016e0b10dc9f49d6c5e75bf1d7ecc1873d2acf7" \
  FRONTEND_URL="https://ai-mail-reader-prod.eba-vdw6mam7.us-east-1.elasticbeanstalk.com"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Environment variables set successfully!"
  echo ""
  echo "Verify with: eb printenv"
else
  echo ""
  echo "❌ Failed to set environment variables"
  echo "Make sure environment status is 'Ready'"
  echo "Check status with: eb status"
fi

