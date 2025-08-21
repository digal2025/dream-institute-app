# Optimized single-stage production build
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl bash

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files for all levels
COPY package*.json ./
COPY zoho-invoice-api/package*.json ./zoho-invoice-api/
COPY zoho-invoice-api/client/package*.json ./zoho-invoice-api/client/

# Install root dependencies
RUN npm ci --omit=dev --no-audit --no-fund --prefer-offline

# Install backend dependencies
RUN cd zoho-invoice-api && npm ci --omit=dev --no-audit --no-fund --prefer-offline

# Install frontend dependencies
RUN cd zoho-invoice-api/client && npm ci --omit=dev --no-audit --no-fund --prefer-offline

# Copy source code
COPY zoho-invoice-api/ ./zoho-invoice-api/

# Build the React application
RUN cd zoho-invoice-api/client && npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start the application
WORKDIR /app/zoho-invoice-api
CMD ["npm", "start"]