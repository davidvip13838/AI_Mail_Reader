#!/bin/bash
set -e

echo "🚀 Starting deployment preparation..."

# Defines
ROOT_DIR=$(pwd)
STAGING_DIR="deployment_staging"
ZIP_NAME="deploy.zip"

# Clean up previous artifacts
echo "clean up..."
rm -rf $STAGING_DIR
rm -f $ZIP_NAME

# Create staging directory
mkdir -p $STAGING_DIR

# 1. Build Frontend
echo "📦 Building frontend..."
cd frontend
# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cd $ROOT_DIR

# 2. Copy Backend
echo "COPY backend..."
mkdir -p $STAGING_DIR/backend
# Copy contents, excluding node_modules/ and audio/
rsync -av --exclude 'node_modules' --exclude 'audio' backend/ $STAGING_DIR/backend/

# 3. Copy Frontend Build
echo "COPY frontend build..."
mkdir -p $STAGING_DIR/frontend
cp -r frontend/build $STAGING_DIR/frontend/

# 4. Create Root package.json for Elastic Beanstalk
echo "CREATE root package.json..."
# This is critical: EB runs 'npm install' then 'npm start'.
# We want it to install backend deps, then start the server.
cat > $STAGING_DIR/package.json <<EOF
{
  "name": "ai-mail-reader-deploy",
  "version": "1.0.0",
  "scripts": {
    "postinstall": "cd backend && npm install",
    "start": "node backend/server.js"
  }
}
EOF

# 5. Zip it up
echo "ZIP deployment package..."
cd $STAGING_DIR
zip -r ../$ZIP_NAME .
cd $ROOT_DIR

# Cleanup
rm -rf $STAGING_DIR

echo "✅ Deployment package created: $ZIP_NAME"
echo "👉 Upload this file to AWS Elastic Beanstalk Console."
