# EC2 Deployment Guide

This guide will help you deploy the AI Mail Reader application directly on an EC2 instance.

## Prerequisites

1. **AWS Account** with EC2 access
2. **AWS CLI** configured (`aws configure`)
3. **SSH key pair** for EC2 access

## Step 1: Launch EC2 Instance

### Via AWS Console:
1. Go to [EC2 Console](https://console.aws.amazon.com/ec2)
2. Click "Launch Instance"
3. Configure:
   - **Name**: `ai-mail-reader-prod`
   - **AMI**: Ubuntu 22.04 LTS or Amazon Linux 2023
   - **Instance Type**: `t3.medium` (2 vCPU, 4GB RAM) or larger
   - **Key Pair**: Select or create a key pair
   - **Security Group**: 
     - SSH (22) from your IP
     - HTTP (80) from anywhere
     - HTTPS (443) from anywhere
     - Custom TCP (5001) from anywhere (or just your IP for backend)
   - **Storage**: 20GB minimum
4. Click "Launch Instance"

### Via AWS CLI:
```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-name \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ai-mail-reader-prod}]'
```

## Step 2: Connect to Instance

```bash
# Get your instance IP
aws ec2 describe-instances --filters "Name=tag:Name,Values=ai-mail-reader-prod" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

# SSH into instance (Ubuntu)
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_INSTANCE_IP

# Or for Amazon Linux
ssh -i ~/.ssh/your-key.pem ec2-user@YOUR_INSTANCE_IP
```

## Step 3: Initial Server Setup

Run these commands on your EC2 instance:

### For Ubuntu:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install build tools (for native modules)
sudo apt install -y build-essential python3
```

### For Amazon Linux 2023:
```bash
# Update system
sudo dnf update -y

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Install nginx
sudo dnf install -y nginx

# Install PM2
sudo npm install -g pm2

# Install build tools
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3
```

## Step 4: Clone and Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/ai-mail-reader
sudo chown $USER:$USER /var/www/ai-mail-reader
cd /var/www/ai-mail-reader

# Clone your repository (or upload files)
# Option 1: If using Git
git clone https://github.com/your-username/AI_mail_reader.git .

# Option 2: Upload files using scp from your local machine:
# scp -i ~/.ssh/your-key.pem -r /path/to/AI_mail_reader/* ubuntu@YOUR_IP:/var/www/ai-mail-reader/

# Install backend dependencies
cd backend
npm install --production
cd ..

# Build frontend
cd frontend
npm install
npm run build
cd ..
```

## Step 5: Configure Environment Variables

Create `.env` file in `/var/www/ai-mail-reader/backend/`:

```bash
cd /var/www/ai-mail-reader/backend
nano .env
```

Add:
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://ng161:Administerators8@cluster1.tl4rhqv.mongodb.net/?appName=Cluster1
JWT_SECRET=your-very-secure-secret-key-change-this
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=298517799358-sd5hgq2sd47i06fvfbh54vcasdbsvekt.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://YOUR_DOMAIN_OR_IP/api/gmail/auth-callback
OPENAI_API_KEY=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
ELEVENLABS_API_KEY=sk_08a7d084c016e0b10dc9f49d6c5e75bf1d7ecc1873d2acf7
FRONTEND_URL=http://YOUR_DOMAIN_OR_IP
```

## Step 6: Configure Nginx

Create nginx config:

```bash
sudo nano /etc/nginx/sites-available/ai-mail-reader
```

Add:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Frontend
    location / {
        root /var/www/ai-mail-reader/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Audio files
    location /audio {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Increase upload size for audio files
    client_max_body_size 50M;
}
```

Enable site:
```bash
# Ubuntu
sudo ln -s /etc/nginx/sites-available/ai-mail-reader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Amazon Linux
sudo cp /etc/nginx/sites-available/ai-mail-reader /etc/nginx/conf.d/ai-mail-reader.conf
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Start Application with PM2

```bash
cd /var/www/ai-mail-reader/backend

# Start the application
pm2 start server.js --name ai-mail-reader

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it prints
```

## Step 8: Setup SSL (Optional but Recommended)

### Using Let's Encrypt (if you have a domain):

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx  # Ubuntu
# OR
sudo dnf install certbot python3-certbot-nginx  # Amazon Linux

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

## Step 9: Test Your Application

```bash
# Check if app is running
pm2 status
pm2 logs ai-mail-reader

# Check nginx
sudo systemctl status nginx

# Test from your browser
# http://YOUR_DOMAIN_OR_IP
```

## Deployment Script

Use the provided `deploy-ec2.sh` script for easy updates.

## Troubleshooting

### Check PM2 logs:
```bash
pm2 logs ai-mail-reader
```

### Check nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart services:
```bash
pm2 restart ai-mail-reader
sudo systemctl restart nginx
```

### Check if port is listening:
```bash
sudo netstat -tlnp | grep 5001
```

## Security Recommendations

1. **Firewall**: Use AWS Security Groups to restrict access
2. **SSH**: Disable password auth, use key pairs only
3. **Updates**: Regularly update system packages
4. **SSL**: Always use HTTPS in production
5. **Environment Variables**: Keep `.env` file secure (chmod 600)

## Cost Estimate

- **t3.medium**: ~$30/month
- **t3.small**: ~$15/month (may be slower)
- **Data transfer**: First 100GB free, then $0.09/GB

## Next Steps

1. Set up a domain name (optional)
2. Configure SSL certificate
3. Set up automated backups
4. Configure CloudWatch monitoring (optional)
5. Set up auto-scaling if needed (optional)

