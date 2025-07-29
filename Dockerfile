# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy client package files
COPY zoho-invoice-api/client/package*.json ./client/
WORKDIR /app/client

# Install frontend dependencies and build
RUN npm ci --only=production
COPY zoho-invoice-api/client/ .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy backend dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY zoho-invoice-api/ ./zoho-invoice-api/

# Copy built frontend from builder stage
COPY --from=builder /app/client/build ./zoho-invoice-api/client/build

# Change to zoho-invoice-api directory
WORKDIR /app/zoho-invoice-api

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/test || exit 1

# Expose port (matching your app's actual port)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]