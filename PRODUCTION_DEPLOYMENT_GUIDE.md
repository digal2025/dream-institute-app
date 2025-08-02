# Production Deployment Guide

## 🚀 **CI/CD Production Deployment Setup**

This guide will help you deploy your application to production using GitHub Actions and Docker, following Dokploy's recommended approach.

## 📋 **Prerequisites**

### 1. **Docker Hub Account**
- Create a Docker Hub account at [hub.docker.com](https://hub.docker.com)
- Create a repository named `fee-management-app`

### 2. **GitHub Secrets Setup**
Go to your GitHub repository → Settings → Secrets and variables → Actions, and add the following secrets:

#### Required Secrets:
```bash
DOCKERHUB_USERNAME=dockerhub_username
DOCKERHUB_TOKEN=your_dockerhub_token
DOKPLOY_DOMAIN=srv926653.hstgr.cloud
DOKPLOY_API_KEY=your_dokploy_api_key
DOKPLOY_APP_ID=your_dokploy_application_id
```

#### How to get these values:
1. **DOCKERHUB_USERNAME**: Your Docker Hub username
2. **DOCKERHUB_TOKEN**: 
   - Go to Docker Hub → Account Settings → Security
   - Create a new access token
   - Copy the token
3. **DOKPLOY_DOMAIN**: Your Dokploy server domain (e.g., `dokploy.yourdomain.com`)
4. **DOKPLOY_API_KEY**: 
   - Go to Dokploy → Settings → API Keys
   - Generate a new API key
5. **DOKPLOY_APP_ID**: 
   - Create an application in Dokploy
   - Copy the application ID from the URL or settings

## 🔧 **Setup Steps**

### Step 1: Create Application in Dokploy

1. **Source Type**: Select "Docker"
2. **Docker Image**: Enter `your_dockerhub_username/fee-management-app:working-app-tested`
3. **Port**: Set to `3000`
4. **Save** the application

### Step 2: Configure Health Checks

Go to Advanced Tab → Cluster Settings → Swarm Settings:

#### Health Check Configuration:
```json
{
  "Test": [
    "CMD",
    "curl",
    "-f",
    "http://localhost:3000/health"
  ],
  "Interval": 30000000000,
  "Timeout": 10000000000,
  "StartPeriod": 30000000000,
  "Retries": 3
}
```

#### Update Config (for rollbacks):
```json
{
  "Parallelism": 1,
  "Delay": 10000000000,
  "FailureAction": "rollback",
  "Order": "start-first"
}
```

### Step 3: Deploy

1. Click **Deploy** in Dokploy
2. Go to **Domains** and generate a domain
3. Set port to **3000**

## 🔄 **Automated Deployment**

### GitHub Actions Workflow
The `.github/workflows/deploy.yml` file will automatically:

1. **Build** the Docker image when you push to `working-app-tested` or `main`
2. **Push** the image to Docker Hub
3. **Trigger** deployment in Dokploy via API

### Manual Deployment
To deploy manually:
```bash
# Push to trigger deployment
git push origin working-app-tested
```

## 📊 **Monitoring & Health Checks**

### Health Check Endpoint
Your application includes a health check endpoint at `/health` that returns:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "mongodb": "connected"
}
```

### Logs
Monitor your application logs in Dokploy:
- Go to your application → Logs tab
- Check for any errors or issues

## 🛠️ **Troubleshooting**

### Common Issues:

#### 1. **Build Failures**
- Check GitHub Actions logs
- Verify all secrets are set correctly
- Ensure Docker Hub repository exists

#### 2. **Deployment Failures**
- Check Dokploy logs
- Verify health check endpoint is working
- Check MongoDB connection

#### 3. **Health Check Failures**
- Verify the `/health` endpoint is accessible
- Check if MongoDB is connected
- Review application logs

### Debug Commands:
```bash
# Test health check locally
curl http://localhost:3000/health

# Check Docker image
docker pull your_dockerhub_username/fee-management-app:working-app-tested

# Test Docker image locally
docker run -p 3000:3000 your_dockerhub_username/fee-management-app:working-app-tested
```

## 🔒 **Security Considerations**

### Environment Variables
Make sure these are set in Dokploy:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `NODE_ENV`: Set to `production`

### Network Security
- CORS is configured for production domains
- Health checks are internal only
- Non-root user in Docker container

## 📈 **Performance Optimization**

### Docker Optimizations:
- Multi-stage build reduces image size
- Layer caching for faster builds
- Production-only dependencies
- Memory allocation optimized

### Application Optimizations:
- React build optimized for production
- Source maps disabled
- ESLint disabled in production
- Static files served efficiently

## 🎯 **Rollback Strategy**

### Automatic Rollbacks:
- Configured in Dokploy update config
- Rolls back on health check failures
- Zero-downtime deployments

### Manual Rollbacks:
1. Go to Dokploy → Deployments
2. Select previous deployment
3. Click "Redeploy"

## 📞 **Support**

If you encounter issues:

1. **Check GitHub Actions logs** for build issues
2. **Check Dokploy logs** for deployment issues
3. **Verify environment variables** are set correctly
4. **Test health check endpoint** manually
5. **Review this guide** for common solutions

---

**Last Updated**: $(date)
**Status**: ✅ Production Ready 