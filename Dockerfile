FROM node:20-alpine

# Install system dependencies needed by Baileys (ffmpeg, etc.)
RUN apk add --no-cache ffmpeg git python3 make g++ libwebp-tools

WORKDIR /app

# Copy package files first (Docker layer caching)
COPY package*.json ./

# Install Node dependencies
RUN npm install --legacy-peer-deps --omit=dev

# Copy entire project
COPY . .

# Create sessions folder (persists auth between restarts)
RUN mkdir -p sessions

# Health-check port
EXPOSE 5000

ENV TZ=Africa/Lagos
ENV NODE_ENV=production

CMD ["node", "index.js"]
