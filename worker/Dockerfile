FROM node:20-slim

# System deps: OpenSSL for Prisma, libvips for sharp, python/make for native modules
RUN apt-get update && \
    apt-get install -y \
      openssl \
      ca-certificates \
      libvips-dev \
      python3 \
      make \
      g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Prisma schema (we're building from inside worker/ so prisma/ is right here)
COPY prisma ./prisma/

# Dependencies first (better Docker layer caching — only reinstalls if package.json changes)
COPY package*.json ./
RUN npm ci

# Source and TypeScript config
COPY src ./src/
COPY tsconfig.json ./

# Tesseract trained data (lives in worker/ root)
COPY eng.traineddata ./

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript → dist/
RUN npx tsc

EXPOSE 3001

# Run compiled JS — not tsx watch (that's for local dev only)
CMD ["node", "dist/server.js"]