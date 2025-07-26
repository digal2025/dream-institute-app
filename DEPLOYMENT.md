# Deployment Guide - Render.com

This guide will help you deploy the Dream Institute Fee Management app to Render.com.

## Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Environment Variables**: Prepare all required environment variables

## Option 1: Deploy Using render.yaml (Recommended)

### Step 1: Connect Repository
1. Go to your Render dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository: `https://github.com/digal2025/dream-institute-app.git`
4. Render will automatically detect the `render.yaml` file

### Step 2: Configure Environment Variables
In the Render dashboard, add these environment variables:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_ORGANIZATION_ID=your_zoho_organization_id
ZOHO_REDIRECT_URI=https://your-app-name.onrender.com/api/auth/zoho/callback
ZOHO_API_BASE=https://invoice.zoho.com/api
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number
SENDGRID_API_KEY=your_sendgrid_api_key
JWT_SECRET=your_jwt_secret_key
```

### Step 3: Deploy
1. Click "Apply" to start the deployment
2. Render will automatically build and deploy your application

## Option 2: Manual Deployment

### Step 1: Create Web Service
1. Go to Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `dream-institute-fee-management`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `zoho-invoice-api`

**Build & Deploy:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Step 2: Environment Variables
Add all required environment variables in the "Environment" tab.

### Step 3: Deploy
Click "Create Web Service" to start deployment.

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `ZOHO_CLIENT_ID` | Zoho Invoice API client ID | Yes |
| `ZOHO_CLIENT_SECRET` | Zoho Invoice API client secret | Yes |
| `ZOHO_ORGANIZATION_ID` | Zoho organization ID | Yes |
| `ZOHO_REDIRECT_URI` | OAuth redirect URI (use your Render URL) | Yes |
| `ZOHO_API_BASE` | Zoho API base URL | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for WhatsApp/SMS | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Yes |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number | Yes |
| `SENDGRID_API_KEY` | SendGrid API key for emails | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |

## Post-Deployment

### 1. Update Zoho Redirect URI
After deployment, update your Zoho app settings:
- Go to Zoho Developer Console
- Update the redirect URI to: `https://your-app-name.onrender.com/api/auth/zoho/callback`

### 2. Test the Application
1. Visit your Render URL: `https://your-app-name.onrender.com`
2. Test user registration and login
3. Test WhatsApp/SMS functionality
4. Test email notifications

### 3. Monitor Logs
- Use Render's built-in log viewer
- Monitor for any errors or issues
- Check application performance

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check if all dependencies are in `package.json`
   - Verify Node.js version compatibility
   - Check build logs for specific errors

2. **Environment Variables**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify values are correct

3. **Database Connection**
   - Verify MongoDB Atlas connection string
   - Check network access and IP whitelist
   - Ensure database user has correct permissions

4. **API Issues**
   - Verify Zoho API credentials
   - Check Twilio and SendGrid API keys
   - Test API endpoints individually

### Performance Optimization

1. **Enable Auto-Scaling** (if needed)
2. **Set up monitoring** with Render's built-in tools
3. **Optimize database queries**
4. **Use CDN** for static assets

## Support

For deployment issues:
1. Check Render's documentation
2. Review application logs
3. Test locally first
4. Contact support if needed

## Security Notes

- Never commit environment variables to Git
- Use strong JWT secrets
- Enable HTTPS (automatic on Render)
- Regularly rotate API keys
- Monitor for security issues 