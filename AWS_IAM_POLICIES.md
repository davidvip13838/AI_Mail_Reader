# AWS IAM Policies Required for Elastic Beanstalk Deployment

This document outlines the IAM policies your AWS user needs to deploy and manage the AI Mail Reader application on Elastic Beanstalk.

## Quick Setup: Use AWS Managed Policies (Recommended)

The easiest approach is to attach these AWS managed policies to your IAM user:

### Minimum Required Policies

1. **`AWSElasticBeanstalkFullAccess`** - Full access to Elastic Beanstalk
2. **`AWSElasticBeanstalkWebTier`** - Access to web tier resources
3. **`AWSElasticBeanstalkWorkerTier`** - Access to worker tier resources
4. **`AWSElasticBeanstalkMulticontainerDocker`** - For container deployments (if needed)

### Additional Recommended Policies

5. **`AmazonS3FullAccess`** - For deployment artifacts and logs
6. **`AmazonEC2FullAccess`** - For EC2 instances created by Elastic Beanstalk
7. **`CloudWatchFullAccess`** - For logs and monitoring
8. **`IAMFullAccess`** - For creating service roles (if needed)
9. **`AWSCodeCommitFullAccess`** - For CodeCommit repository access (if using CodeCommit for deployments)

## Detailed Policy Breakdown

### Option 1: Full Access (Easiest - for development/testing)

Attach these managed policies:
- `AWSElasticBeanstalkFullAccess`
- `AmazonS3FullAccess`
- `AmazonEC2FullAccess`
- `CloudWatchFullAccess`
- `IAMFullAccess`
- `AWSCodeCommitFullAccess` (if using CodeCommit)

### Option 2: Least Privilege (Recommended for production)

Create a custom policy with only the permissions needed:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:*",
        "ec2:*",
        "ec2:Describe*",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:CreateTags",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcs",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeAccountAttributes",
        "ec2:DescribeImages",
        "ec2:DescribeKeyPairs",
        "autoscaling:*",
        "autoscaling:Describe*",
        "autoscaling:CreateLaunchConfiguration",
        "autoscaling:DeleteLaunchConfiguration",
        "autoscaling:UpdateAutoScalingGroup",
        "autoscaling:CreateAutoScalingGroup",
        "autoscaling:DeleteAutoScalingGroup",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "autoscaling:PutScalingPolicy",
        "autoscaling:DeletePolicy",
        "autoscaling:DescribeScalingActivities",
        "autoscaling:DescribeScalingProcessTypes",
        "autoscaling:ResumeProcesses",
        "autoscaling:SuspendProcesses",
        "s3:*",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:CreateBucket",
        "cloudformation:*",
        "cloudformation:CreateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackResources",
        "cloudformation:DescribeStackEvents",
        "cloudformation:ValidateTemplate",
        "cloudformation:GetTemplate",
        "cloudformation:UpdateStack",
        "logs:*",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "iam:PassRole",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PutRolePolicy",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies",
        "iam:GetRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:DetachRolePolicy",
        "iam:DeleteRole",
        "iam:ListInstanceProfilesForRole",
        "iam:RemoveRoleFromInstanceProfile",
        "iam:ListInstanceProfiles",
        "iam:AddRoleToInstanceProfile",
        "iam:CreateInstanceProfile",
        "iam:DeleteInstanceProfile",
        "iam:GetInstanceProfile",
        "codecommit:*",
        "codecommit:GitPush",
        "codecommit:GetRepository",
        "codecommit:ListRepositories",
        "codecommit:BatchGetRepositories",
        "codecommit:GetBranch",
        "codecommit:ListBranches",
        "codecommit:GetCommit",
        "codecommit:ListCommits"
      ],
      "Resource": "*"
    }
  ]
}
```

## Step-by-Step: Attach Policies via AWS Console

### Method 1: Using AWS Console (Visual)

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** in the left sidebar
3. Click on your username
4. Click **Add permissions** → **Attach policies directly**
5. Search for and select:
   - `AWSElasticBeanstalkFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonEC2FullAccess`
   - `CloudWatchFullAccess`
6. Click **Next** → **Add permissions**

### Method 2: Using AWS CLI

```bash
# Attach Elastic Beanstalk full access
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkFullAccess

# Attach S3 full access
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Attach EC2 full access
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess

# Attach CloudWatch full access
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchFullAccess

# Attach CodeCommit full access (for CodeCommit deployments)
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::aws:policy/AWSCodeCommitFullAccess
```

Replace `YOUR_USERNAME` with your actual IAM username.

## Verify Your Permissions

Test if your permissions are set up correctly:

```bash
# Test Elastic Beanstalk access
aws elasticbeanstalk describe-applications

# Test S3 access
aws s3 ls

# Test EC2 access
aws ec2 describe-instances --max-items 1

# Test CodeCommit access
aws codecommit list-repositories
```

If these commands work without errors, your permissions are correctly configured.

## Service Roles (Created Automatically)

Elastic Beanstalk will also create service roles automatically. These are separate from your user permissions:

1. **aws-elasticbeanstalk-ec2-role** - For EC2 instances
2. **aws-elasticbeanstalk-service-role** - For Elastic Beanstalk service

These are created automatically during `eb init` or `eb create` if they don't exist.

## Security Best Practices

### For Development/Testing:
- Use the full access policies listed above
- Consider using a separate AWS account for testing

### For Production:
- Use least privilege principle
- Create custom policies with only required permissions
- Use separate IAM users for different environments
- Enable MFA (Multi-Factor Authentication)
- Regularly rotate access keys
- Use IAM roles instead of access keys when possible

## Troubleshooting

### Error: "User is not authorized to perform: elasticbeanstalk:CreateApplication"

**Solution**: Attach `AWSElasticBeanstalkFullAccess` policy

### Error: "Access Denied" when deploying

**Solution**: Ensure you have:
- `AWSElasticBeanstalkFullAccess`
- `AmazonS3FullAccess` (for deployment artifacts)
- `AmazonEC2FullAccess` (for EC2 instances)

### Error: "Cannot create service role"

**Solution**: Attach `IAMFullAccess` or specific IAM permissions to create roles

### Error: "fatal: unable to access 'https://git-codecommit...': The requested URL returned error: 403"

**Solution**: Attach `AWSCodeCommitFullAccess` policy or create a custom policy with CodeCommit permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codecommit:GitPush",
        "codecommit:GetRepository",
        "codecommit:ListRepositories",
        "codecommit:BatchGetRepositories",
        "codecommit:GetBranch",
        "codecommit:ListBranches",
        "codecommit:GetCommit",
        "codecommit:ListCommits"
      ],
      "Resource": "arn:aws:codecommit:us-east-1:083777493877:origin"
    }
  ]
}
```

## Summary

**Minimum for deployment:**
- `AWSElasticBeanstalkFullAccess`
- `AmazonS3FullAccess`
- `AmazonEC2FullAccess`

**Recommended for full functionality:**
- All of the above, plus:
- `CloudWatchFullAccess`
- `IAMFullAccess` (for service role creation)
- `AWSCodeCommitFullAccess` (if using CodeCommit for deployments)

