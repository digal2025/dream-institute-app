#!/bin/bash

# Static Deployment Script - Build locally and deploy static files
echo "🚀 Static Deployment to Dokploy"
echo "================================"

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

# Build React app locally
build_react_app() {
    print_status "Building React app locally..."
    
    cd zoho-invoice-api/client
    
    print_info "Installing dependencies..."
    npm install --omit=dev --no-audit --no-fund
    
    print_info "Building React app..."
    CI=false DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false SKIP_PREFLIGHT_CHECK=true npm run build
    
    if [ $? -eq 0 ]; then
        print_status "React build completed successfully!"
        cd ../..
        return 0
    else
        print_error "React build failed"
        cd ../..
        return 1
    fi
}

# Create a simple static server setup
create_static_setup() {
    print_status "Creating static server setup..."
    
    # Create a simple static server
    cat > zoho-invoice-api/static-server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Static server running on port ${PORT}`);
});
EOF

    print_status "Static server setup created"
}

# Update package.json for static deployment
update_package_for_static() {
    print_status "Updating package.json for static deployment..."
    
    # Create a backup
    cp zoho-invoice-api/package.json zoho-invoice-api/package.json.backup
    
    # Update the start script to use static server
    sed -i '' 's/"start": "node index.js"/"start": "node static-server.js"/' zoho-invoice-api/package.json
    
    print_status "Package.json updated for static deployment"
}

# Main execution
main() {
    echo "Starting static deployment process..."
    echo ""
    
    check_project_structure
    build_react_app
    
    if [ $? -eq 0 ]; then
        create_static_setup
        update_package_for_static
        
        echo ""
        print_status "Static deployment setup completed!"
        print_info "Your React app has been built locally"
        print_info "The static files are ready in zoho-invoice-api/client/build/"
        print_info "You can now deploy to Dokploy using the updated configuration"
        
        echo ""
        print_warning "Next steps:"
        print_info "1. Commit these changes: git add . && git commit -m 'feat: static deployment setup'"
        print_info "2. Push to GitHub: git push origin working-app-tested"
        print_info "3. Deploy to Dokploy using the deployment script"
    else
        print_error "Static deployment setup failed"
        exit 1
    fi
}

# Run main function
main "$@" 