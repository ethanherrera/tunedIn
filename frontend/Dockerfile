FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json ./
# If you use yarn, remove the next line
RUN npm install

# Copy the rest of the application
COPY . ./

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 5173

# Command to run the application in development
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]