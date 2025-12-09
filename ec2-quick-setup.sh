#!/bin/bash

# Quick EC2 Server Setup Script
# Run this ON your EC2 instance after first login

set -e

echo "🚀 Setting up AI Mail Reader on EC2..."

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Cannot detect OS"
    exit 1
fi

echo "Detected OS: $OS"

# Update system
echo "📦 Updating system packages..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl build-essential python3
    
    # Install Node.js 20.x
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Install nginx
    sudo apt install -y nginx
    
elif [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
    sudo dnf update -y
    sudo dnf groupinstall -y "Development Tools"
    sudo dnf install -y curl python3
    
    # Install Node.js 20.x
    echo "📦 Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
    
    # Install nginx
    sudo dnf install -y nginx
else
    echo "❌ Unsupported OS: $OS"
    exit 1
fi

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Verify installations
echo ""
echo "✅ Installation complete!"
echo ""
echo "Versions:"
node --version
npm --version
nginx -v
pm2 --version

echo ""
echo "📝 Next steps:"
echo "1. Create app directory: sudo mkdir -p /var/www/ai-mail-reader && sudo chown \$USER:\$USER /var/www/ai-mail-reader"
echo "2. Upload your application files"
echo "3. Install dependencies: cd /var/www/ai-mail-reader/backend && npm install --production"
echo "4. Build frontend: cd /var/www/ai-mail-reader/frontend && npm install && npm run build"
echo "5. Configure nginx (see EC2_SETUP.md)"
echo "6. Start app with PM2: cd /var/www/ai-mail-reader/backend && pm2 start server.js --name ai-mail-reader"
echo "7. Setup PM2 startup: pm2 save && pm2 startup"

