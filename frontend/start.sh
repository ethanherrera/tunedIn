#!/bin/sh
# Startup script for Nginx in Cloud Run

# Log startup
echo "Starting Nginx server for TunedIn frontend..."

# Get the PORT from environment variable or default to 8080
PORT=${PORT:-8080}
echo "Configuring nginx to listen on PORT=$PORT"

# Replace the port in the nginx config
sed -i "s/listen 8080/listen $PORT/g" /etc/nginx/conf.d/default.conf

# Start Nginx
echo "Starting Nginx..."
nginx -g "daemon off;" 