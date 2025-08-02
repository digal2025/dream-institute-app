# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Set environment variables for build
ENV NODE_ENV=production
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files first for better caching
COPY package*.json ./
COPY zoho-invoice-api/package*.json ./zoho-invoice-api/
COPY zoho-invoice-api/client/package*.json ./zoho-invoice-api/client/

# Install root dependencies
RUN npm ci --omit=dev --no-audit --no-fund

# Install backend dependencies
WORKDIR /app/zoho-invoice-api
RUN npm ci --omit=dev --no-audit --no-fund

# Install client dependencies and build
WORKDIR /app/zoho-invoice-api/client
RUN npm ci --omit=dev --no-audit --no-fund

# Copy all source code
WORKDIR /app
COPY . .

# Build the React application
WORKDIR /app/zoho-invoice-api/client
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl bash

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy backend package files and install dependencies
COPY zoho-invoice-api/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Copy backend application code
COPY zoho-invoice-api/ ./

# Copy built frontend from builder stage
COPY --from=builder /app/zoho-invoice-api/client/build ./client/build

# Copy debug script
COPY debug-startup.sh ./
RUN chmod +x debug-startup.sh

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check with better timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start the application with debug info
CMD ["./debug-startup.sh"]