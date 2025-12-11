# KITMED Platform Dockerfile
# Multi-stage build for optimized production image

# ===========================
# Dependencies Stage
# ===========================
FROM node:18-alpine AS deps

# Install system dependencies for sharp and sqlite
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# ===========================
# Builder Stage
# ===========================
FROM node:18-alpine AS builder

WORKDIR /app

# Build arguments for environment variables needed during build
ARG JWT_SECRET=build-time-placeholder-secret-key-for-kitmed-platform
ARG NEXTAUTH_SECRET=build-time-placeholder-secret-key-for-kitmed-platform
ARG DATABASE_URL=file:./dev.db

# Set environment variables for build
ENV JWT_SECRET=$JWT_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# ===========================
# Production Stage
# ===========================
FROM node:18-alpine AS runner

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    sqlite \
    dumb-init

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Copy standalone app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy package.json for Prisma CLI
COPY --from=builder /app/package.json ./

# Install only production dependencies and Prisma
RUN npm install --only=production prisma @prisma/client

# Create directories for uploads and database
RUN mkdir -p /app/uploads /app/data
RUN chown -R nextjs:nodejs /app/uploads /app/data

# Create volume for persistent data
VOLUME ["/app/uploads", "/app/data"]

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Database will be in the persistent volume
ENV DATABASE_URL="file:/app/data/production.db"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').request('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).end()"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]