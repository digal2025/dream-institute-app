#!/bin/bash

# Manual deployment script for when GitHub Actions is unavailable
echo "🚀 Manual Docker Build and Deploy Script"
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Set variables (you'll need to update these with your actual values)
DOCKERHUB_USERNAME="your_dockerhub_username"
IMAGE_NAME="fee-management-app"
TAG="latest"

echo "📦 Building Docker image..."
docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG} .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    
    echo "🔐 Pushing to Docker Hub..."
    docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}
    
    if [ $? -eq 0 ]; then
        echo "✅ Image pushed successfully!"
        echo "🎯 Triggering Dokploy deployment..."
        
        # Trigger Dokploy deployment (update with your actual values)
        curl -X 'POST' \
        'https://31.97.224.161:3000/api/trpc/application.deploy' \
        -H 'accept: application/json' \
        -H 'x-api-key: YOUR_DOKPLOY_API_KEY' \
        -H 'Content-Type: application/json' \
        -d '{
            "json":{
                "applicationId": "YOUR_DOKPLOY_APP_ID"
            }
        }'
        
        echo "✅ Deployment triggered!"
    else
        echo "❌ Failed to push image to Docker Hub"
        exit 1
    fi
else
    echo "❌ Docker build failed"
    exit 1
fi

echo "🎉 Manual deployment completed!" 