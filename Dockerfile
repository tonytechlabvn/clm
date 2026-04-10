# Stage 1: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Stage 2: Build
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Download Chrome for Testing during build (Puppeteer's tested version)
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer
RUN npx puppeteer browsers install chrome

ARG NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=build-placeholder
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install Chromium + dependencies for Puppeteer, plus openssl and docker-cli
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    openssl \
    wget \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Let Puppeteer use its own bundled Chrome for Testing (system Chromium 147 has crashpad bugs)
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs
# Docker CLI for openzca management (install only if available)
RUN apt-get update && apt-get install -y --no-install-recommends docker.io && rm -rf /var/lib/apt/lists/* || true
# Allow nextjs user to access Docker socket
RUN groupadd -g 988 dockerhost 2>/dev/null || true && usermod -aG dockerhost nextjs 2>/dev/null || true

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh

# Copy Puppeteer + Handlebars + Chrome for Testing (bundled, tested to work)
COPY --from=builder /app/node_modules/puppeteer ./node_modules/puppeteer
COPY --from=builder /app/node_modules/puppeteer-core ./node_modules/puppeteer-core
COPY --from=builder /app/node_modules/handlebars ./node_modules/handlebars
COPY --from=builder /app/.cache/puppeteer ./.cache/puppeteer

# Create uploads directory for generated images + writable tmp for Chromium crashpad
RUN mkdir -p /app/uploads/cma/generated /tmp/.chromium-data
RUN chmod 1777 /tmp

RUN chown -R nextjs:nodejs /app /tmp/.chromium-data
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
