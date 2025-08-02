#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting production build process..."

# Set environment variables
export NODE_ENV=production
export CI=false
export DISABLE_ESLINT_PLUGIN=true
export GENERATE_SOURCEMAP=false
export NODE_OPTIONS="--max-old-space-size=4096"

echo "📦 Installing root dependencies..."
npm install --omit=dev --no-audit --no-fund

echo "📦 Installing backend dependencies..."
cd zoho-invoice-api
npm install --omit=dev --no-audit --no-fund

echo "📦 Installing client dependencies..."
cd client
npm install --omit=dev --no-audit --no-fund

echo "🔨 Building React application..."
echo "📊 Available memory: $(free -h | grep Mem | awk '{print $2}')"
echo "📊 Node.js version: $(node --version)"
echo "📊 NPM version: $(npm --version)"

# Build with increased memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "✅ Build completed successfully!"
echo "📁 Build output: $(pwd)/build"
echo "📊 Build size: $(du -sh build | cut -f1)"

# Go back to root
cd ../..

echo "🎉 Production build ready!" 