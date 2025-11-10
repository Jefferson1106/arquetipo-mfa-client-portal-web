## Multi-stage build for Angular app served by Nginx

# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps separately for better caching
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy sources and build
COPY . .
RUN npm run build:prod

# ---------- Runtime stage ----------
FROM nginx:1.25-alpine AS runtime

# Replace default nginx config with production one if present
COPY nginx/nginx.prod.conf /etc/nginx/nginx.conf

# Copy built assets from dist
COPY --from=builder /app/dist/banking-portal /usr/share/nginx/html

EXPOSE 4200

# Optional healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:4200/health || wget -qO- http://localhost:4200/ || exit 1

CMD ["nginx", "-g", "daemon off;"]


