# Build client
FROM node:20-alpine AS client-builder
WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build server
FROM node:20-alpine AS server-builder
WORKDIR /build/server
RUN apk add --no-cache python3 make g++
COPY server/package*.json ./
RUN npm ci
COPY client/ /build/client/
COPY server/ ./
RUN npm run build

# Runtime
FROM node:20-alpine
WORKDIR /app

COPY --from=server-builder /build/server/node_modules ./node_modules
COPY --from=server-builder /build/server/dist ./dist
COPY --from=client-builder /build/client/dist ./client/dist

RUN mkdir -p /app/data/photos

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
