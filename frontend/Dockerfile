FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install dependencies
RUN rm -rf node_modules && \
    npm cache clean --force && \
    npm install

# Copy the rest of the application
COPY . .

# Expose the port Vite runs on
EXPOSE 5137

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5137"]