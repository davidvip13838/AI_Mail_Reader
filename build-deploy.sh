#!/bin/bash

# Build and prepare application for Elastic Beanstalk deployment
# This script builds the frontend and creates a deployment-ready package

set -e

echo "🚀 Building application for Elastic Beanstalk deployment..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
zip -r deploy.zip . \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*.env*" \
  -x "*audio/*.mp3" \
  -x "*.log" \
  -x "*.swp" \
  -x ".DS_Store" \
  -x "*.test.js" \
  -x "tests/*"

echo "✅ Deployment package created: deploy.zip"
echo "📤 You can now upload deploy.zip to Elastic Beanstalk"

