# Deploying to AWS Elastic Beanstalk

This guide will help you deploy the AI Mail Reader application to AWS Elastic Beanstalk.

## Prerequisites

1. **AWS Account** - Sign up at [aws.amazon.com](https://aws.amazon.com)
2. **AWS CLI** - Install from [aws.amazon.com/cli](https://aws.amazon.com/cli)
3. **EB CLI** - Install Elastic Beanstalk CLI:
   ```bash
   pip install awsebcli
   ```
4. **MongoDB Atlas** - Set up a MongoDB Atlas cluster (recommended for production)

## Step 1: Configure AWS Credentials

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

## Step 2: Set Up MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (use `0.0.0.0/0` for Elastic Beanstalk)
5. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/ai-mail-reader`)

## Step 3: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URI: `https://YOUR-APP-NAME.REGION.elasticbeanstalk.com/api/gmail/auth-callback`
   - Replace `YOUR-APP-NAME` and `REGION` with your actual values
   - You'll get the exact URL after deployment

## Step 4: Initialize Elastic Beanstalk

```bash
cd /Users/ng161/cswap/AI_mail_reader
eb init
```

Follow the prompts:
- Select a region (e.g., `us-east-1`)
- Select platform: **Node.js**
- Select platform version: **Node.js 18** or higher
- Set up SSH: **Yes** (optional, for debugging)
- Select keypair or create a new one

## Step 5: Create Elastic Beanstalk Environment

```bash
eb create ai-mail-reader-prod
```

This will:
- Create an EC2 instance
- Set up load balancer
- Configure security groups
- Deploy your application

**Note**: This process takes 5-10 minutes.

## Step 6: Configure Environment Variables

After the environment is created, set your environment variables:

```bash
eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  MONGODB_URI="your_mongodb_atlas_connection_string" \
  JWT_SECRET="your-very-secure-secret-key-change-this" \
  JWT_EXPIRES_IN=7d \
  GOOGLE_CLIENT_ID="your_google_client_id" \
  GOOGLE_CLIENT_SECRET="your_google_client_secret" \
  GOOGLE_REDIRECT_URI="https://YOUR-APP-NAME.REGION.elasticbeanstalk.com/api/gmail/auth-callback" \
  OPENAI_API_KEY="your_openai_api_key" \
  ELEVENLABS_API_KEY="your_elevenlabs_api_key" \
  FRONTEND_URL="https://YOUR-APP-NAME.REGION.elasticbeanstalk.com"
```

**Important**: Replace all placeholder values with your actual credentials.

## Step 7: Deploy Application

```bash
eb deploy
```

This will:
- Build the frontend
- Package the application
- Deploy to Elastic Beanstalk

## Step 8: Get Your Application URL

```bash
eb status
```

Or check the AWS Elastic Beanstalk console. Your app will be available at:
`http://YOUR-APP-NAME.REGION.elasticbeanstalk.com`

## Step 9: Update Google OAuth Redirect URI

After deployment, update the Google OAuth redirect URI with your actual Elastic Beanstalk URL.

## Step 10: Test Your Application

1. Visit your Elastic Beanstalk URL
2. Register a new account
3. Connect Gmail
4. Test email fetching and summarization

## Troubleshooting

### View Logs

```bash
eb logs
```

### SSH into Instance

```bash
eb ssh
```

### Check Environment Health

```bash
eb health
```

### Common Issues

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **Environment Variables Not Set**: Use `eb setenv` to set them
3. **MongoDB Connection Fails**: 
   - Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
   - Verify connection string is correct
4. **CORS Errors**: Ensure `FRONTEND_URL` matches your EB URL
5. **Port Issues**: Elastic Beanstalk uses port 8080, ensure your app listens on `process.env.PORT`

## Updating Your Application

After making changes:

```bash
git add .
git commit -m "Your changes"
eb deploy
```

## Scaling

To scale your application:

```bash
eb scale 2  # Scale to 2 instances
```

Or use the AWS Console to configure auto-scaling.

## Custom Domain (Optional)

1. Go to AWS Route 53 or your domain registrar
2. Create a CNAME record pointing to your EB URL
3. Configure SSL certificate in Elastic Beanstalk

## Cost Estimation

- **Free Tier**: 750 hours/month of t2.micro EC2 (first year)
- **After Free Tier**: ~$15-30/month for single instance
- **MongoDB Atlas**: Free tier available (512MB storage)

## Security Best Practices

1. ✅ Use strong `JWT_SECRET`
2. ✅ Enable HTTPS (configure SSL certificate)
3. ✅ Use MongoDB Atlas with IP whitelisting
4. ✅ Rotate API keys regularly
5. ✅ Enable AWS CloudWatch monitoring
6. ✅ Set up backup strategy for MongoDB

## Additional Resources

- [AWS Elastic Beanstalk Documentation](https://docs.aws.amazon.com/elasticbeanstalk/)
- [EB CLI Documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

