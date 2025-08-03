#!/bin/bash

# Check Deployment Status Script
echo "🔍 Checking Deployment Status"
echo "============================="

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

# Check if the application is running locally
check_local_app() {
    print_info "Checking local application..."
    
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        print_status "Local app is running on port 3001"
        print_info "Access your app at: http://localhost:3001"
    else
        print_warning "Local app not responding on port 3001"
    fi
}

# Check if the production app is accessible
check_production_app() {
    print_info "Checking production application..."
    
    if curl -s http://31.97.224.161:3000 > /dev/null 2>&1; then
        print_status "Production app is accessible"
        print_info "Access your app at: http://31.97.224.161:3000"
    else
        print_warning "Production app not responding"
        print_info "This could mean:"
        print_info "- Build is still in progress"
        print_info "- App is starting up"
        print_info "- There's an issue with the deployment"
    fi
}

# Check GitHub Actions status
check_github_actions() {
    print_info "Checking GitHub Actions..."
    print_info "Go to: https://github.com/digal2025/dream-institute-app/actions"
    print_info "Look for the latest workflow run"
}

# Check Dokploy dashboard
check_dokploy_dashboard() {
    print_info "Checking Dokploy Dashboard..."
    print_info "Go to your Dokploy dashboard"
    print_info "Look for the latest deployment with commit: dfed5b4"
    print_info "Check if the build completed successfully"
}

# Main execution
main() {
    echo "Starting deployment status check..."
    echo ""
    
    check_local_app
    echo ""
    check_production_app
    echo ""
    check_github_actions
    echo ""
    check_dokploy_dashboard
    
    echo ""
    print_info "Summary:"
    print_info "- Local app should be running on port 3001"
    print_info "- Check Dokploy dashboard for build status"
    print_info "- Production app should be available at http://31.97.224.161:3000"
}

# Run main function
main "$@" 