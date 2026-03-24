FROM node:24-alpine AS build
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy only frontend package.json for dependency caching
COPY frontend/package.json ./frontend/

# Install dependencies (need a stub backend package.json for workspace resolution)
COPY backend/package.json ./backend/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy frontend source
COPY frontend/ ./frontend/

# Build
ARG VITE_API_URL=http://localhost:3000
RUN pnpm --filter reecall-webrtc-demo-frontend build

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
