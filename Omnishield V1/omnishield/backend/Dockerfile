# ── Backend Dockerfile ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production=false

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Production image ───────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install production deps only
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S omnishield -u 1001 -G nodejs
USER omnishield

EXPOSE 4000

CMD ["node", "dist/server.js"]
