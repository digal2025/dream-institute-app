# Docker Production Build Troubleshooting Guide

## 🚨 **Current Issue: Docker Desktop I/O Error**

**Error Message:**
```
ERROR: failed to build: failed to solve: write /var/lib/desktop-containerd/daemon/io.containerd.metadata.v1.bolt/meta.db: input/output error
```

## 🔧 **Immediate Solutions**

### 1. **Restart Docker Desktop**
```bash
# On macOS:
# 1. Quit Docker Desktop from the menu bar
# 2. Wait 30 seconds
# 3. Restart Docker Desktop
# 4. Wait for it to fully start
```

### 2. **Reset Docker Desktop**
```bash
# If restart doesn't work:
# 1. Open Docker Desktop
# 2. Go to Settings > Troubleshoot
# 3. Click "Reset to factory defaults"
# 4. Restart Docker Desktop
```

### 3. **Clear Docker Cache**
```bash
# Try these commands after restarting Docker:
docker system prune -a -f
docker builder prune -a -f
```

## 📋 **Alternative Solutions for Production**

### Option 1: Use Dokploy Without Docker
Since Dokploy can build without Docker, we can optimize the build process:

```json
// dokploy.json - Updated configuration
{
  "build": {
    "command": "npm install --omit=dev --no-audit --no-fund && cd zoho-invoice-api && npm install --omit=dev --no-audit --no-fund && cd client && npm install --omit=dev --no-audit --no-fund && CI=false DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false NODE_OPTIONS='--max-old-space-size=4096' npm run build"
  }
}
```

### Option 2: Simplified Dockerfile
Use the simpler Dockerfile.simple instead of the multi-stage build:

```dockerfile
# Dockerfile.simple - Single stage build
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package*.json ./
COPY zoho-invoice-api/package*.json ./zoho-invoice-api/
COPY zoho-invoice-api/client/package*.json ./zoho-invoice-api/client/

RUN npm ci --omit=dev --no-audit --no-fund
RUN cd zoho-invoice-api && npm ci --omit=dev --no-audit --no-fund
RUN cd zoho-invoice-api/client && npm ci --omit=dev --no-audit --no-fund

COPY . .
RUN cd zoho-invoice-api/client && npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🔍 **Root Cause Analysis**

### Docker Desktop Issues
1. **Storage Corruption**: The metadata.db file is corrupted
2. **Disk Space**: Insufficient disk space for Docker operations
3. **File System Issues**: macOS file system permissions or corruption

### Build Process Issues
1. **Large Context**: The build context is 1.42GB (too large)
2. **Complex Multi-stage**: Multi-stage builds can be problematic
3. **Memory Constraints**: Build process might be hitting memory limits

## 🛠️ **Optimizations Made**

### 1. **Reduced Build Context**
- Added `.dockerignore` to exclude unnecessary files
- Optimized COPY commands to copy only required files

### 2. **Memory Optimization**
- Added `NODE_OPTIONS="--max-old-space-size=4096"`
- Disabled source maps: `GENERATE_SOURCEMAP=false`
- Disabled ESLint: `DISABLE_ESLINT_PLUGIN=true`

### 3. **Build Speed**
- Added `--no-audit --no-fund` flags
- Used `--omit=dev` for production dependencies only
- Optimized layer caching

## 📊 **Testing Results**

### Local Build (Working)
```bash
✅ npm run build - SUCCESS
✅ ./build.sh - SUCCESS
✅ Build size: 1.9M
```

### Docker Build (Failing)
```bash
❌ docker build - I/O Error
❌ docker system prune - I/O Error
```

## 🎯 **Recommended Action Plan**

### Immediate (Today)
1. **Restart Docker Desktop** completely
2. **Test with Dockerfile.simple** if Docker works
3. **Deploy to Dokploy** using the optimized build script

### Short Term (This Week)
1. **Monitor Dokploy builds** for any issues
2. **Test Docker builds** after Docker restart
3. **Optimize build context** further if needed

### Long Term (Next Week)
1. **Consider alternative deployment** if Docker issues persist
2. **Implement CI/CD pipeline** with GitHub Actions
3. **Add build monitoring** and alerts

## 📞 **If Issues Persist**

### Contact Support
- **Docker Desktop**: Report the I/O error to Docker support
- **Dokploy**: Check if they have specific Docker requirements
- **System Admin**: Check disk space and file system health

### Alternative Deployment
- **Vercel**: For frontend-only deployment
- **Railway**: For full-stack deployment
- **Heroku**: For traditional deployment
- **AWS/GCP**: For cloud deployment

---

**Last Updated**: $(date)
**Status**: 🔧 Troubleshooting in Progress 