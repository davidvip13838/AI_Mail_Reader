# AWS Elastic Beanstalk Deployment Guide

This guide describes how to deploy the AI Mail Reader to AWS Elastic Beanstalk manually via the AWS Console. This method avoids common timeout issues by pre-building the frontend.

## Prerequisites

1.  **AWS Account**: You must be able to log in to the AWS Console.
2.  **AWS CLI Configured** (Optional, but good for troubleshooting).
3.  **Local Environment**: You must have `npm` and `zip` installed.

## Step 1: Prepare the Deployment Package

Run the helper script in your project root:

```bash
bash prepare_deployment.sh
```

This will create a file named `deploy.zip` in your project folder. This is the **only** file you need to upload.

## Step 2: Create Application in AWS Console

1.  Open [AWS Elastic Beanstalk Console](https://console.aws.amazon.com/elasticbeanstalk).
2.  Click **Create application**.
3.  **Application Name**: `ai-mail-reader` (or similar).
4.  **Platform**:
    *   **Platform**: `Node.js`
    *   **Platform branch**: `Node.js 20 running on 64bit Amazon Linux 2023` (or latest supported).
    *   **Platform version**: Recommended (latest).
5.  **Application Code**:
    *   Select **Upload your code**.
    *   **Version label**: `v1-initial` (auto-generated is fine).
    *   **Source code origin**: Select **Local file**.
    *   Click **Choose file** and select the `deploy.zip` you created in Step 1.
6.  **Presets**:
    *   Select **Single instance (free tier eligible)** explicitly to avoid load balancer costs initially.
7.  Click **Next**.

## Step 3: Configure Service Access

1.  **Service Role**: Select **Create and use new service role** (default) or use an existing one if unsure.
2.  **EC2 key pair**: Select your key pair if you want to SSH in later (Recommended).
3.  **EC2 instance profile**: Select an existing profile (often named `aws-elasticbeanstalk-ec2-role`).
    *   *Note: If you don't have one, check the [AWS Docs](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/iam-instanceprofile.html) to create it.*
4.  Click **Next**.

## Step 4: Set Up Networking (Skip/Default)

1.  Unless you have a specific VPC requirement, leave everything as default.
2.  Click **Next**.

## Step 5: Configure Instance Traffic and Scaling (Skip/Default)

1.  Leave as default for Single Instance.
2.  Click **Next**.

## Step 6: Configure Updates, Monitoring, and Logging

1.  **Environment properties** (Crucial Step!):
    Scroll down to **Environment properties** section. You **MUST** add these or the app will crash.

    | Name | Value |
    | :--- | :--- |
    | `NODE_ENV` | `production` |
    | `PORT` | `8080` |
    | `MONGODB_URI` | `your_mongodb_connection_string` |
    | `JWT_SECRET` | `your_secure_secret` |
    | `FRONTEND_URL` | `http://[your-app-id].[region].elasticbeanstalk.com` (Note: Use HTTP unless you have custom SSL) |
    | `GOOGLE_CLIENT_ID` | `your_google_client_id` |
    | `GOOGLE_CLIENT_SECRET` | `your_google_client_secret` |
    | `GOOGLE_REDIRECT_URI` | `http://[your-app-id].[region].elasticbeanstalk.com/api/gmail/auth-callback` |
    | `OPENAI_API_KEY` | `your_openai_key` |
    | `ELEVENLABS_API_KEY` | `your_elevenlabs_key` |

    *Note: If you don't have all keys handy, you can add dummy values for now and update them later in Configuration → Updates, monitoring, and logging.*

2.  Click **Next**.

## Step 7: Review and Submit

1.  Review all settings.
2.  Click **Submit**.

## Step 8: Post-Deployment

1.  Wait for the environment status to turn **Green (degraded/OK)**.
    *   It might be "Degraded" initially if health checks fail due to missing environment variables.
2.  **Get the URL**: Look for the URL on the dashboard (e.g., `ai-mail-reader.us-east-1.elasticbeanstalk.com`).
3.  **Update Config**:
    *   Go to **Configuration** → **Updates, monitoring, and logging** → **Edit** (Environment properties).
    *   Update `FRONTEND_URL` to your new Elastic Beanstalk URL (include `http://` and no trailing slash).
    *   Add `GOOGLE_REDIRECT_URI`: `http://YOUR-EB-URL/api/gmail/auth-callback`.
    *   Click **Apply**.
4.  **Update Google Console**:
    *   Go to Google Cloud Console.
    *   Add the new **HTTP** Redirect URI to your OAuth credentials to match the deployment.

## Troubleshooting

-   **502 Bad Gateway**: Usually means the node server didn't start.
    -   Go to **Logs** → **Request last 100 lines**.
    -   Check for errors like "MODULE_NOT_FOUND" or DB connection failures.
-   **Timeout**: If deployment still times out, try increasing the command timeout in Configuration.
-   **Login Failed**: Ensure `FRONTEND_URL` in config matches the browser URL protocol (http vs https).
