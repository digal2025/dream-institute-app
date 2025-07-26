# Deployment Troubleshooting Guide

## Bad Gateway Error Fix

### 1. Check if the application is running on VPS

SSH into your VPS and run:

```bash
# Check if the application is running
ps aux | grep node

# Check if port 3000 is listening
netstat -tlnp | grep :3000

# Check application logs
pm2 logs
# or
journalctl -u your-app-service -f
```

### 2. Start the application if not running

```bash
# Navigate to your app directory
cd /path/to/your/app

# Install dependencies
npm install

# Build the frontend
npm run build

# Start the application
npm start
```

### 3. Configure Nginx (if using Nginx)

Create or update `/etc/nginx/sites-available/fees.dreaminstitute.co.in`:

```nginx
server {
    listen 80;
    server_name fees.dreaminstitute.co.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/fees.dreaminstitute.co.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Configure Apache (if using Apache)

Create or update `/etc/apache2/sites-available/fees.dreaminstitute.co.in.conf`:

```apache
<VirtualHost *:80>
    ServerName fees.dreaminstitute.co.in
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    ErrorLog ${APACHE_LOG_DIR}/fees.dreaminstitute.co.in_error.log
    CustomLog ${APACHE_LOG_DIR}/fees.dreaminstitute.co.in_access.log combined
</VirtualHost>
```

Enable modules and site:
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2ensite fees.dreaminstitute.co.in
sudo systemctl reload apache2
```

### 5. Configure SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx
# or for Apache
sudo apt install certbot python3-certbot-apache

# Get SSL certificate
sudo certbot --nginx -d fees.dreaminstitute.co.in
# or for Apache
sudo certbot --apache -d fees.dreaminstitute.co.in
```

### 6. Use PM2 for process management

```bash
# Install PM2 globally
npm install -g pm2

# Start your application with PM2
cd /path/to/your/app
pm2 start npm --name "dream-institute-app" -- start

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs dream-institute-app
```

### 7. Check firewall settings

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check firewall status
sudo ufw status
```

### 8. Test the configuration

```bash
# Test locally on VPS
curl http://localhost:3000/api/test

# Test from external
curl -I http://fees.dreaminstitute.co.in
```

## Common Issues and Solutions

### Issue 1: Application not starting
- Check Node.js version: `node --version`
- Check npm version: `npm --version`
- Check logs: `pm2 logs` or `journalctl -u your-service`

### Issue 2: Port already in use
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Issue 3: Permission issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /path/to/your/app
# Fix permissions
chmod -R 755 /path/to/your/app
```

### Issue 4: Environment variables
Make sure your `.env` file is properly configured on the VPS with all required variables.

## DNS Configuration

Ensure your DNS record points to your VPS IP:
- Type: A
- Name: fees
- Value: Your VPS IP address
- TTL: 300 (or default)

## Dokploy Configuration

Make sure your dokploy.json is properly configured:

```json
{
  "build": {
    "command": "npm run install-all && npm run build"
  },
  "start": {
    "command": "npm start"
  },
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3000",
    "CI": "false",
    "DISABLE_ESLINT_PLUGIN": "true"
  }
}
``` 