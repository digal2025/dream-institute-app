#!/bin/bash

echo "🔍 Docker Container Debug Script"
echo "================================"

echo "📋 Environment Variables:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "MONGODB_URI available: $([ -n "$MONGODB_URI" ] && echo "✅ Yes" || echo "❌ No")"

echo ""
echo "📂 File Structure:"
ls -la /app/

echo ""
echo "📦 Package.json exists:"
ls -la /app/package.json 2>/dev/null && echo "✅ Found" || echo "❌ Missing"

echo ""
echo "🔌 Network Configuration:"
echo "Binding to: 0.0.0.0:3000"

echo ""
echo "🚀 Starting Node.js application..."
exec npm start