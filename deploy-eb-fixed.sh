#!/bin/bash

# Fixed Elastic Beanstalk Deployment Script
# This script ensures frontend is built and deploys correctly

set -e

echo "🚀 Elastic Beanstalk Deployment (Fixed Version)"
echo ""

# Check if frontend is built
if [ ! -d "frontend/build" ]; then
    echo "❌ Frontend build not found!"
    echo "📦 Building frontend now..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    npm run build
    cd ..
    echo "✅ Frontend built successfully"
else
    echo "✅ Frontend build found"
fi

# Check EB environment status
echo ""
echo "📊 Checking EB environment status..."
if eb status | grep -q "Status:.*Ready"; then
    echo "✅ Environment is Ready"
else
    STATUS=$(eb status | grep "Status:" | awk '{print $2}')
    echo "⚠️  Environment status: $STATUS"
    if [ "$STATUS" != "Ready" ]; then
        echo "❌ Environment must be 'Ready' to deploy"
        echo "Wait for it to be Ready or restart via AWS Console"
        exit 1
    fi
fi

# Build frontend (if not already built)
if [ ! -d "frontend/build" ]; then
    echo ""
    echo "📦 Building frontend..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run build
    cd ..
fi

# Commit and push changes first
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "📝 Committing changes..."
    git add .
    git commit -m "Deploy: $(date +%Y%m%d-%H%M%S)" || true
    
    echo ""
    echo "📤 Pushing to CodeCommit..."
    # Clear credentials and retry
    git credential reject <<EOF 2>/dev/null || true
protocol=https
host=git-codecommit.us-east-1.amazonaws.com
EOF
    sleep 1
    
    if git push codecommit-origin main; then
        echo "✅ Code pushed successfully"
    else
        echo "❌ CodeCommit push failed with 403"
        echo ""
        echo "📤 Alternative: Upload via AWS Console"
        echo "  1. Run: ./build-deploy.sh (creates deploy.zip)"
        echo "  2. Go to: https://console.aws.amazon.com/elasticbeanstalk"
        echo "  3. Upload and deploy deploy.zip"
        exit 1
    fi
fi

# Deploy from current directory
# EB will use the code from CodeCommit
echo ""
echo "🚀 Deploying to Elastic Beanstalk..."
echo "This may take 5-10 minutes..."
eb deploy

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Monitor progress with:"
echo "  eb events -f"
echo "  eb status"

