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

# Install only production dependencies and PM2 globally
RUN npm install --omit=dev && npm install -g pm2


# Run the application using PM2
# CMD ["pm2-runtime", "dist/index.js", "-i", "max"]
CMD [ "pm2","start","dist/index.js" ]