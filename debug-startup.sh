#!/bin/bash

# Debug startup script for production deployment
echo "🚀 Starting Dream Institute Fee Management App..."
echo "📋 Environment: $NODE_ENV"
echo "🔌 Port: $PORT"
echo "💾 MongoDB URI available: $([ -n "$MONGODB_URI" ] && echo "YES" || echo "NO")"
echo "📁 Working directory: $(pwd)"
echo "👤 User: $(whoami)"

# Check if client build exists
if [ -d "./client/build" ]; then
    echo "✅ Client build found"
    echo "📊 Build size: $(du -sh ./client/build | cut -f1)"
else
    echo "❌ Client build not found"
    exit 1
fi

# Check if package.json exists
if [ -f "./package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found"
    exit 1
fi

# Start the application
echo "🎯 Starting Node.js application..."
exec node index.js