# Use Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Install Python and build tools for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Start the application
CMD ["npm", "start"]
