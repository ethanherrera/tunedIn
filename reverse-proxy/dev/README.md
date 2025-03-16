# Nginx Reverse Proxy for Local Development

This directory contains the configuration files for the Nginx reverse proxy used in local development.

## Files

- `Dockerfile.dev`: Docker configuration for building the Nginx container
- `nginx.conf.dev`: Nginx configuration file that sets up the reverse proxy
- `.env.dev`: Environment variables for the Nginx container

## Configuration

The Nginx reverse proxy is configured to:

- Listen on port 80
- Forward requests to the frontend application running on port 5137
- Set appropriate headers for proxying

## Usage

The Nginx reverse proxy is configured in the root `docker-compose.local.yml` file and will be started along with the other services when running:

```bash
docker-compose -f docker-compose.local.yml up -d
```

## Accessing the Application

Once the containers are running, you can access the application at:

- http://localhost

This will proxy to the frontend application running on port 5137.

## Customization

If you need to modify the Nginx configuration:

1. Edit the `nginx.conf.dev` file
2. Restart the Nginx container:
   ```bash
   docker-compose -f docker-compose.local.yml restart nginx
   ``` 