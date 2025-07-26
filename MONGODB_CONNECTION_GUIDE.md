# MongoDB Connection Guide

## Current Issue Analysis

### Problem Identified:
- **Connection Type**: Docker/Container
- **Hostname**: `fee-management-app-dreaminstitutedb-ea8dtu`
- **Issue**: DNS resolution failed - hostname not accessible from local machine

### Root Cause:
The MongoDB URI is pointing to a Docker container hostname that's only accessible from within the Docker network, not from your local development machine.

## Solutions

### Option 1: Use Local MongoDB for Development

**For local development, use a local MongoDB instance:**

1. **Install MongoDB locally:**
   ```bash
   # macOS with Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb/brew/mongodb-community
   
   # Or use MongoDB Atlas (cloud)
   ```

2. **Update your .env file for local development:**
   ```bash
   # Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/dream-institute-app
   
   # Or MongoDB Atlas (replace with your connection string)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dream-institute-app
   ```

### Option 2: Use MongoDB Atlas (Recommended)

**For production and development, use MongoDB Atlas:**

1. **Create a MongoDB Atlas account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster
   - Get your connection string

2. **Update your .env file:**
   ```bash
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/dream-institute-app?retryWrites=true&w=majority
   ```

### Option 3: Fix Docker Network (Advanced)

**If you want to use the Docker container:**

1. **Find the container's IP address:**
   ```bash
   docker ps
   docker inspect <container-id> | grep IPAddress
   ```

2. **Update your .env file with the IP:**
   ```bash
   MONGODB_URI=mongodb://gitudigal:Gitu%402025@<container-ip>:27017
   ```

## Testing Your Connection

### Run the test script:
```bash
cd zoho-invoice-api
node test-mongodb-comprehensive.js
```

### Expected output for successful connection:
```
✅ Successfully connected to MongoDB!
📊 Database: dream-institute-app
🌐 Host: localhost (or your Atlas cluster)
🔌 Port: 27017
```

## Environment Configuration

### Development (.env):
```bash
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/dream-institute-app
# or
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dream-institute-app
```

### Production (.env on VPS):
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dream-institute-app
```

## Quick Fix for Local Development

**Immediate solution - use localhost:**

1. **Install MongoDB locally** (if not already installed)
2. **Update your .env file:**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/dream-institute-app
   ```
3. **Test the connection:**
   ```bash
   node test-mongodb-comprehensive.js
   ```

## Production Deployment

**For your VPS deployment:**

1. **Use MongoDB Atlas** (recommended for production)
2. **Or install MongoDB on your VPS:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mongodb
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

3. **Update your production .env file with the correct URI**

## Common Issues and Solutions

### Issue 1: Connection Refused
- **Cause**: MongoDB not running
- **Solution**: Start MongoDB service

### Issue 2: Authentication Failed
- **Cause**: Wrong username/password
- **Solution**: Check credentials in connection string

### Issue 3: DNS Resolution Failed
- **Cause**: Invalid hostname (like Docker container names)
- **Solution**: Use localhost or valid hostname

### Issue 4: Timeout
- **Cause**: Network issues or firewall
- **Solution**: Check network connectivity and firewall settings

## Security Best Practices

1. **Use environment variables** for sensitive data
2. **URL-encode special characters** in passwords
3. **Use MongoDB Atlas** for production (managed security)
4. **Enable authentication** even for local development
5. **Use strong passwords** and rotate them regularly

## Next Steps

1. **Choose your MongoDB solution** (local, Atlas, or VPS)
2. **Update your .env file** with the correct URI
3. **Test the connection** using the test script
4. **Update your VPS deployment** with the correct MongoDB URI
5. **Test your application** to ensure database operations work 