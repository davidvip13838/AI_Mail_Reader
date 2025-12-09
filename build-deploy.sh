#!/bin/bash

# Build and prepare application for Elastic Beanstalk deployment
# This script builds the frontend locally and creates a deployment-ready package
# This avoids server-side build timeouts and is faster

set -e

echo "🚀 Building application for Elastic Beanstalk deployment..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi
npm run build
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
# Remove old deploy.zip if it exists
rm -f deploy.zip

# Create zip excluding unnecessary files
zip -r deploy.zip . \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*.env*" \
  -x "*audio/*.mp3" \
  -x "*.log" \
  -x "*.swp" \
  -x ".DS_Store" \
  -x "*.test.js" \
  -x "tests/*" \
  -x "deploy.zip" \
    -x "build-deploy.sh" \
    -x "set-env-and-deploy.sh" \
    -x "wait-for-ready.sh" \
    -x "deploy-ec2.sh" \
    -x "ec2-quick-setup.sh" \
    -x "EC2_SETUP.md" \
    -x "WHY_EB_FAILED.md"

echo ""
echo "✅ Deployment package created: deploy.zip"
echo ""
echo "📤 Deployment Options:"
echo "   1. Upload via AWS Console:"
echo "      - Go to: https://console.aws.amazon.com/elasticbeanstalk"
echo "      - Select environment: ai-mail-reader-prod"
echo "      - Click 'Upload and deploy'"
echo "      - Select deploy.zip"
echo ""
echo "   2. Deploy via EB CLI (if environment is Ready):"
echo "      eb deploy --source deploy.zip"
echo ""

