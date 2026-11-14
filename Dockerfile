# Multi-stage Dockerfile for Ordomática
# Stage 1: Build Web UI and verify test suite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm ci

# Copy full application sources
COPY . .

# Run test verification and build production static bundle
RUN npm test && npm run build

# Stage 2: Production runtime environment
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=127.0.0.1
ENV PORT=3001
ENV MCP_HOST=0.0.0.0
ENV MCP_PORT=3002
ENV WEB_HOST=0.0.0.0
ENV WEB_PORT=3000
ENV API_URL=http://127.0.0.1:3001

# Copy package definitions and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled Web application assets
COPY --from=builder /app/dist ./dist

# Copy TypeScript sources for runtime execution via tsx
COPY --from=builder /app/src ./src

# Expose Web Interface (3000) and MCP Server (3002)
# The internal API on 3001 is NOT exposed, preserving private encapsulation.
EXPOSE 3000
EXPOSE 3002

# Run healthcheck on internal API
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Launch the unified service coordinator (Web + MCP + Internal API)
CMD ["npm", "start"]
