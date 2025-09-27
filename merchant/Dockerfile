FROM node:18-alpine

WORKDIR /usr/src/app

# Install Python and build tools for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 4021

# Start the application
CMD ["node", "server.js"]
