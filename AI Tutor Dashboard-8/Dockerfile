# Multi-stage build for React + Vite application

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (включая devDependencies для build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production with nginx
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check - check if nginx is responding (301 redirect is expected and healthy)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider --server-response http://localhost/ 2>&1 | grep -E "HTTP.*301|HTTP.*200" || exit 1

# Use SIGQUIT for graceful shutdown of nginx (SIGTERM is too aggressive)
STOPSIGNAL SIGQUIT

# Start nginx (daemon off for proper signal handling)
CMD ["nginx", "-g", "daemon off;"]
