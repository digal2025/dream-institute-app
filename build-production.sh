#!/bin/bash

# Production Build Script for Dream Institute Fee Management App
echo "🚀 Starting Production Build Process"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Set environment variables
export NODE_ENV=production
export CI=false
export DISABLE_ESLINT_PLUGIN=true
export GENERATE_SOURCEMAP=false
export SKIP_PREFLIGHT_CHECK=true
export NODE_OPTIONS="--max-old-space-size=4096"

print_info "Environment variables set:"
print_info "NODE_ENV: $NODE_ENV"
print_info "CI: $CI"
print_info "DISABLE_ESLINT_PLUGIN: $DISABLE_ESLINT_PLUGIN"
print_info "GENERATE_SOURCEMAP: $GENERATE_SOURCEMAP"
print_info "SKIP_PREFLIGHT_CHECK: $SKIP_PREFLIGHT_CHECK"
print_info "NODE_OPTIONS: $NODE_OPTIONS"

# Step 1: Install root dependencies
print_info "Step 1: Installing root dependencies..."
npm install --omit=dev --no-audit --no-fund
if [ $? -eq 0 ]; then
    print_status "Root dependencies installed successfully"
else
    print_error "Failed to install root dependencies"
    exit 1
fi

# Step 2: Install backend dependencies
print_info "Step 2: Installing backend dependencies..."
cd zoho-invoice-api
npm install --omit=dev --no-audit --no-fund
if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Step 3: Install frontend dependencies
print_info "Step 3: Installing frontend dependencies..."
cd client
npm install --omit=dev --no-audit --no-fund
if [ $? -eq 0 ]; then
    print_status "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Step 4: Build React application
print_info "Step 4: Building React application..."
npm run build
if [ $? -eq 0 ]; then
    print_status "React application built successfully"
else
    print_error "Failed to build React application"
    exit 1
fi

# Step 5: Return to root directory
print_info "Step 5: Returning to root directory..."
cd ../..

print_status "🎉 Production build completed successfully!"
print_info "Your application is ready for deployment"
print_info "Build artifacts are in: zoho-invoice-api/client/build/" 