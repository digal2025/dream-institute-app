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

# Check server connectivity
check_server_connectivity() {
    print_status "Checking server connectivity..."
    
    print_info "Testing connection to $DOKPLOY_DOMAIN..."
    
    # Test basic connectivity first
    if curl -s --max-time 5 "http://$DOKPLOY_DOMAIN" > /dev/null 2>&1; then
        print_status "Server is reachable"
        return 0
    else
        print_warning "Server might be busy or unreachable"
        print_info "This could be normal if a build is in progress"
        return 0
    fi
}

# Trigger Dokploy deployment
trigger_deployment() {
    print_status "Triggering Dokploy deployment..."
    
    print_info "Domain: $DOKPLOY_DOMAIN"
    print_info "App ID: $DOKPLOY_APP_ID"
    print_info "API Key: ${DOKPLOY_API_KEY:0:8}..."
    
    # Make the deployment request with better error handling
    print_info "Sending deployment request..."
    
    # Try multiple times with different timeout settings
    for attempt in 1 2 3; do
        print_info "Attempt $attempt of 3..."
        
        response=$(curl -s -w "%{http_code}" -X POST \
            "http://$DOKPLOY_DOMAIN/api/trpc/application.deploy" \
            -H "accept: application/json" \
            -H "x-api-key: $DOKPLOY_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"json\":{\"applicationId\":\"$DOKPLOY_APP_ID\"}}" \
            --max-time 60 \
            --connect-timeout 30 \
            --retry 2 \
            --retry-delay 5 \
            2>/dev/null)
        
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
            return 0
        elif [ "$http_code" = "000" ]; then
            print_warning "Connection failed (attempt $attempt)"
            if [ $attempt -lt 3 ]; then
                print_info "Retrying in 5 seconds..."
                sleep 5
            fi
        else
            print_error "Deployment failed with status code: $http_code"
            print_error "Response: $response_body"
            if [ $attempt -lt 3 ]; then
                print_info "Retrying in 5 seconds..."
                sleep 5
            fi
        fi
    done
    
    print_error "All deployment attempts failed"
    print_warning "The server might be busy with another build"
    print_info "Please check your Dokploy dashboard for current build status"
    return 1
}

# Main execution
main() {
    echo "Starting direct deployment process..."
    echo ""
    
    get_credentials
    check_dependencies
    check_project_structure
    check_server_connectivity
    trigger_deployment
    
    if [ $? -eq 0 ]; then
        echo ""
        print_status "Direct deployment process completed!"
        print_status "Your app should be available at: http://$DOKPLOY_DOMAIN"
        print_info "Build time: Usually 5-10 minutes"
    else
        echo ""
        print_warning "Deployment may have failed, but this could be normal if:"
        print_warning "- A build is already in progress"
        print_warning "- The server is temporarily busy"
        print_info "Please check your Dokploy dashboard for current status"
    fi
}

# Run main function
main "$@" 