#!/bin/bash

# Direct Deployment Script with GitHub Secrets Support
echo "🚀 Direct Deployment to Dokploy"
echo "================================="

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

# Get Dokploy credentials
get_credentials() {
    print_info "Setting up Dokploy credentials..."
    
    # Use provided credentials
    DOKPLOY_API_KEY="isvagBoxqnyZQYXVQpkcJbUHnJeutinTbjfzwdJisVwJarViygHfvfTNaPeLZWWI"
    DOKPLOY_APP_ID="vF22cYphY9Ht55NpJEWeb"
    DOKPLOY_DOMAIN="31.97.224.161:3000"
    
    print_status "Credentials configured"
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
    
    print_info "Domain: $DOKPLOY_DOMAIN"
    print_info "App ID: $DOKPLOY_APP_ID"
    print_info "API Key: ${DOKPLOY_API_KEY:0:8}..."
    
    # Make the deployment request
    print_info "Sending deployment request..."
    
    response=$(curl -s -w "%{http_code}" -X POST \
        "http://$DOKPLOY_DOMAIN/api/trpc/application.deploy" \
        -H "accept: application/json" \
        -H "x-api-key: $DOKPLOY_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"json\":{\"applicationId\":\"$DOKPLOY_APP_ID\"}}" \
        --max-time 30)
    
    # Extract status code
    http_code="${response: -3}"
    response_body="${response%???}"
    
    echo ""
    print_info "Response Code: $http_code"
    print_info "Response Body: $response_body"
    echo ""
    
    if [ "$http_code" = "200" ]; then
        print_status "Deployment triggered successfully!"
        print_status "Dokploy will now build and deploy your application"
        print_status "Check your Dokploy dashboard for build progress"
    else
        print_error "Deployment failed with status code: $http_code"
        print_error "Response: $response_body"
        print_warning "Please check your credentials and try again"
        exit 1
    fi
}

# Main execution
main() {
    echo "Starting direct deployment process..."
    echo ""
    
    get_credentials
    check_dependencies
    check_project_structure
    trigger_deployment
    
    echo ""
    print_status "Direct deployment process completed!"
    print_status "Your app should be available at: http://$DOKPLOY_DOMAIN"
    print_info "Build time: Usually 5-10 minutes"
}

# Run main function
main "$@" 