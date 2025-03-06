#!/bin/bash
# =====================================================
# DOCKER CONNECTIVITY TROUBLESHOOTING SCRIPT
# =====================================================

set -e

echo "=== Docker Connectivity Troubleshooting Tool ==="
echo "This script will help diagnose and fix Docker connectivity issues."

# Check Docker daemon status
echo "=== Checking Docker daemon status ==="
if ! docker info &>/dev/null; then
  echo "ERROR: Docker daemon is not running or not accessible."
  echo "Please start Docker and try again."
  exit 1
else
  echo "Docker daemon is running."
fi

# Check internet connectivity
echo "=== Checking internet connectivity ==="
if ! curl -s --connect-timeout 5 https://www.google.com &>/dev/null; then
  echo "WARNING: Cannot connect to the internet. Check your network connection."
else
  echo "Internet connectivity is working."
fi

# Check Docker Hub connectivity
echo "=== Checking Docker Hub connectivity ==="
if ! curl -s --connect-timeout 10 https://registry-1.docker.io/v2/ &>/dev/null; then
  echo "WARNING: Cannot connect to Docker Hub. This may cause image pull failures."
else
  echo "Docker Hub connectivity is working."
fi

# Check GCR connectivity
echo "=== Checking Google Container Registry connectivity ==="
if ! curl -s --connect-timeout 10 https://gcr.io/v2/ &>/dev/null; then
  echo "WARNING: Cannot connect to Google Container Registry. This may cause push/pull failures."
else
  echo "GCR connectivity is working."
fi

# Check DNS resolution
echo "=== Checking DNS resolution ==="
if ! nslookup registry-1.docker.io &>/dev/null; then
  echo "WARNING: Cannot resolve Docker Hub domain. DNS issues detected."
else
  echo "DNS resolution for Docker Hub is working."
fi

if ! nslookup gcr.io &>/dev/null; then
  echo "WARNING: Cannot resolve GCR domain. DNS issues detected."
else
  echo "DNS resolution for GCR is working."
fi

# Check Docker configuration
echo "=== Checking Docker configuration ==="
if [ -f ~/.docker/config.json ]; then
  echo "Docker config file exists."
  if grep -q "credHelpers" ~/.docker/config.json; then
    echo "Credential helpers are configured."
  else
    echo "WARNING: No credential helpers found in Docker config."
  fi
else
  echo "WARNING: Docker config file not found."
fi

# Check gcloud authentication
echo "=== Checking gcloud authentication ==="
if ! gcloud auth list &>/dev/null; then
  echo "WARNING: gcloud authentication issue detected."
  echo "Try running 'gcloud auth login' to authenticate."
else
  echo "gcloud authentication is working."
fi

# Try to pre-pull base images
echo "=== Attempting to pre-pull base images ==="
echo "This may take some time..."

# Function to retry commands
retry_command() {
  local -r cmd="$1"
  local -r max_attempts=${2:-3}
  local -r delay=${3:-5}
  local attempt=1
  
  until eval $cmd; do
    if (( attempt == max_attempts )); then
      echo "Command '$cmd' failed after $max_attempts attempts."
      return 1
    fi
    
    echo "Attempt $attempt failed. Retrying in ${delay}s..."
    sleep $delay
    ((attempt++))
  done
  
  return 0
}

# Try to pull Node image
echo "Pulling node:20-alpine..."
if retry_command "docker pull node:20-alpine" 3 10; then
  echo "Successfully pulled node:20-alpine."
else
  echo "Failed to pull node:20-alpine."
fi

# Try to pull Nginx image
echo "Pulling nginx:stable-alpine..."
if retry_command "docker pull nginx:stable-alpine" 3 10; then
  echo "Successfully pulled nginx:stable-alpine."
else
  echo "Failed to pull nginx:stable-alpine."
fi

# Suggest fixes
echo ""
echo "=== Suggested fixes ==="
echo "1. If you're behind a corporate firewall or VPN, try disconnecting."
echo "2. Try using a different network connection."
echo "3. Check if Docker is configured to use a proxy:"
echo "   - Look in ~/.docker/config.json for proxy settings"
echo "   - Check environment variables HTTP_PROXY, HTTPS_PROXY"
echo "4. Try refreshing your gcloud credentials:"
echo "   gcloud auth login"
echo "   gcloud auth configure-docker"
echo "5. If DNS issues were detected, try adding Google DNS to your network settings:"
echo "   - Add 8.8.8.8 and 8.8.4.4 as DNS servers"
echo "6. If all else fails, try using a VPN service to bypass network restrictions."
echo ""
echo "=== Troubleshooting complete ===" 