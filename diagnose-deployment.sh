#!/bin/bash

echo "=== Dream Institute App Deployment Diagnostic ==="
echo ""

echo "1. Checking if Node.js is installed..."
node --version
npm --version
echo ""

echo "2. Checking if the application is running..."
ps aux | grep node | grep -v grep
echo ""

echo "3. Checking if port 3000 is listening..."
netstat -tlnp | grep :3000
echo ""

echo "4. Checking if the application responds locally..."
curl -s http://localhost:3000/api/test || echo "Application not responding on localhost:3000"
echo ""

echo "5. Checking if nginx is installed and running..."
if command -v nginx &> /dev/null; then
    echo "Nginx is installed"
    systemctl status nginx --no-pager -l
else
    echo "Nginx is not installed"
fi
echo ""

echo "6. Checking if apache2 is installed and running..."
if command -v apache2 &> /dev/null; then
    echo "Apache2 is installed"
    systemctl status apache2 --no-pager -l
else
    echo "Apache2 is not installed"
fi
echo ""

echo "7. Checking firewall status..."
ufw status
echo ""

echo "8. Checking if the domain resolves..."
nslookup fees.dreaminstitute.co.in
echo ""

echo "9. Testing external connectivity..."
curl -I http://fees.dreaminstitute.co.in 2>/dev/null || echo "Domain not accessible"
echo ""

echo "10. Checking application directory..."
if [ -d "/app" ]; then
    echo "Application directory exists at /app"
    ls -la /app/
else
    echo "Application directory not found at /app"
    echo "Current directory: $(pwd)"
    ls -la
fi
echo ""

echo "=== Diagnostic Complete ===" 