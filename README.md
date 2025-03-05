# TunedIn Development Environment

This repository contains the development environment for the TunedIn application.

## Development Setup

The application is containerized using Docker and Docker Compose for local development.

### Prerequisites

- Docker
- Docker Compose

### Starting the Development Environment

To start the development environment, run:

```bash
./start-local-dev.sh
```

This will start the following services:
- MongoDB (available at localhost:27017)
- Backend (available at http://localhost:8000)
- Frontend (available at http://localhost:5137)

### Stopping the Development Environment

To stop the development environment, run:

```bash
./stop-local-dev.sh
```

### Viewing Logs

To view the logs of all services, run:

```bash
docker-compose -f docker-compose.local.yml logs -f
```

To view logs for a specific service, run:

```bash
docker-compose -f docker-compose.local.yml logs -f [service-name]
```

Where `[service-name]` is one of: `mongodb`, `backend`, or `frontend`.

## Project Structure

- `backend/`: Spring Boot backend service
- `database/`: MongoDB database configuration
- `frontend/`: Frontend application

## Configuration Files

### Docker Configuration

- `docker-compose.local.yml`: Docker Compose configuration for local development
- `backend/Dockerfile.local`: Backend Docker configuration
- `database/Dockerfile.local`: Database Docker configuration
- `frontend/Dockerfile.local`: Frontend Docker configuration

### Environment Configuration

Each service has its own environment configuration file:

- `backend/.env.local`: Backend environment variables
- `database/.env.local`: Database environment variables
- `frontend/.env.local`: Frontend environment variables

## Environment Variables

### Backend Environment Variables

#### Spotify API
- `SPOTIFY_CLIENT_ID`: Spotify API client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify API client secret
- `SPOTIFY_REDIRECT_URI`: Spotify API redirect URI

#### MongoDB
- `MONGODB_HOST`: MongoDB host (set to `mongodb-local` for local development)
- `MONGODB_PORT`: MongoDB port
- `MONGODB_DATABASE`: MongoDB database name
- `MONGODB_USERNAME`: MongoDB username
- `MONGODB_PASSWORD`: MongoDB password
- `MONGODB_AUTH_DATABASE`: MongoDB authentication database

#### Server Configuration
- `API_HOST`: API host address
- `SERVER_PORT`: Server port
- `DEBUG`: Debug mode flag

#### Frontend Configuration
- `FRONTEND_URL`: Frontend URL for CORS and redirects
- `FRONTEND_PORT`: Frontend port for Docker container

### Setting Up Environment Variables

1. Copy the `.env.example` file to `.env.local` in the backend directory:
   ```
   cp backend/.env.example backend/.env.local
   ```

2. Update the values in the `.env.local` file with your actual configuration:
   - Spotify API credentials
   - MongoDB connection details
   - Other application settings
