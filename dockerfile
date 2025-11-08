# Dockerfile for RAG Agent
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    python3 \
    py3-pip \
    build-base && \
    curl --version

# Copy package files
COPY package*.json ./

# Install Node dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port for Next.js
EXPOSE 3000

# Default command starts the Next.js server
CMD ["npm", "start"]