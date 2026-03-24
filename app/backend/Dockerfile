FROM node:24-alpine
RUN apk add --no-cache curl
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy only backend package.json for dependency caching
COPY backend/package.json ./backend/

# Install dependencies (need a stub frontend package.json for workspace resolution)
COPY frontend/package.json ./frontend/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy backend source
COPY backend/ ./backend/

# Build
RUN pnpm --filter reecall-webrtc-demo-backend build

EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
