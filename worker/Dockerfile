FROM node:20-slim

#OpenSSL
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

#Prisma schema from root
COPY prisma ./prisma/

#worker package files
COPY worker/package*.json ./

RUN npm ci
#worker source
COPY worker/src ./src/
COPY worker/tsconfig.json ./

#Generate Prisma Client
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev"]