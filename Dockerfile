# Stage 1: Base image
FROM node:22-alpine3.20 as base

# Stage 2: Builder
FROM base as builder

WORKDIR /app/build

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json .
COPY tsconfig.json .

# Install dependencies (including dev dependencies for building)
RUN npm install

# Copy source code
COPY src/ src/

# Build the application
RUN npm run build

# Stage 3: Runner (production image)
FROM base as runner

WORKDIR /app/main

# Copy built files from the builder stage
COPY --from=builder /app/build/dist ./dist

# Copy package.json and package-lock.json for production dependencies
COPY --from=builder /app/build/package*.json .

# Install only production dependencies
RUN npm install --omit=dev

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=4000

# Expose the port the app runs on
EXPOSE 4000

# Run the application
CMD ["node", "dist/index.js"]