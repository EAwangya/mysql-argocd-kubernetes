# Use slim version to reduce image size
FROM node:24-slim

# Set working directory
WORKDIR /usr/src/app

# Install dependencies for netcat (minimal base image)
RUN apt-get update && \
    apt-get install -y --no-install-recommends netcat-openbsd && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy only package files first to leverage layer caching
COPY package*.json ./

# Install only production dependencies if not developing
RUN npm install --omit=dev

# Copy app source
COPY . .

# Ensure wait-for script is executable
RUN chmod +x wait-for-mysql.sh

# Expose port
EXPOSE 3000

# Start the app with the wait-for script
CMD ["./wait-for-mysql.sh", "npm", "start"]




# # Stage 1: Build stage
# FROM node:24-slim AS builder

# # Set working directory
# WORKDIR /usr/src/app

# # Install dependencies for building
# RUN apt-get update && \
#     apt-get install -y --no-install-recommends netcat-openbsd && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/*

# # Copy package files and install dependencies
# COPY package*.json ./
# RUN npm install --omit=dev

# # Copy application source
# COPY . .

# # Ensure wait-for script is executable
# RUN chmod +x wait-for-mysql.sh

# # Stage 2: Runtime stage
# FROM node:24-slim AS runtime

# WORKDIR /usr/src/app

# # Copy only necessary files from build stage
# COPY --from=builder /usr/src/app /usr/src/app

# # Expose port
# EXPOSE 3000

# # Start the app with the wait-for script
# CMD ["./wait-for-mysql.sh", "npm", "start"]

