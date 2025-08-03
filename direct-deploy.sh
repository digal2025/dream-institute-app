#!/bin/bash

# Direct Deployment Script - Bypasses GitHub Actions
echo "🚀 Direct Deployment to Dokploy"
echo "================================="

# Configuration
DOKPLOY_DOMAIN="31.97.224.161:3000"
DOKPLOY_API_KEY="your_dokploy_api_key_here"
DOKPLOY_APP_ID="your_dokploy_app_id_here"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if required tools are available
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is required but not installed"
        exit 1
    fi
    
    print_status "All dependencies available"
}

# Check if we're in the right directory
check_project_structure() {
    print_status "Checking project structure..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    if [ ! -f "zoho-invoice-api/package.json" ]; then
        print_error "zoho-invoice-api/package.json not found"
        exit 1
    fi
    
    if [ ! -f "zoho-invoice-api/client/package.json" ]; then
        print_error "zoho-invoice-api/client/package.json not found"
        exit 1
    fi
    
    print_status "Project structure is correct"
}

# Trigger Dokploy deployment
trigger_deployment() {
    print_status "Triggering Dokploy deployment..."
    
    # Check if API key and App ID are configured
    if [ "$DOKPLOY_API_KEY" = "your_dokploy_api_key_here" ] || [ "$DOKPLOY_APP_ID" = "your_dokploy_app_id_here" ]; then
        print_warning "Please update the script with your actual Dokploy credentials"
        print_warning "Edit direct-deploy.sh and replace:"
        print_warning "  - your_dokploy_api_key_here"
        print_warning "  - your_dokploy_app_id_here"
        exit 1
    fi
    
    # Make the deployment request
    response=$(curl -s -w "%{http_code}" -X POST \
        "https://$DOKPLOY_DOMAIN/api/trpc/application.deploy" \
        -H "accept: application/json" \
        -H "x-api-key: $DOKPLOY_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"json\":{\"applicationId\":\"$DOKPLOY_APP_ID\"}}" \
        --max-time 30)
    
    # Extract status code
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        print_status "Deployment triggered successfully!"
        print_status "Response: $response_body"
    else
        print_error "Deployment failed with status code: $http_code"
        print_error "Response: $response_body"
        exit 1
    fi
}

# Main execution
main() {
    echo "Starting direct deployment process..."
    
    check_dependencies
    check_project_structure
    trigger_deployment
    
    print_status "Direct deployment process completed!"
    print_status "Check your Dokploy dashboard for deployment status"
    print_status "Your app should be available at: https://$DOKPLOY_DOMAIN"
}

# Run main function
main "$@" 