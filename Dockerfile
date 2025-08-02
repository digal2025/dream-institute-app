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

# Copy client package files and build frontend
COPY zoho-invoice-api/client/package*.json ./client/
WORKDIR /app/client

# Install dependencies with production optimizations
RUN npm ci --omit=dev --no-audit --no-fund

# Copy client source code
COPY zoho-invoice-api/client/ .

# Build the React application
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
COPY --from=builder /app/client/build ./client/build

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