# TunedIn

Run the application using:
```
docker compose down && docker compose build && docker compose up
```

## Environment Variables

The backend application uses environment variables for configuration. These are defined in the `.env` file in the backend directory.

### Setting Up Environment Variables

1. Copy the `.env.example` file to `.env` in the backend directory:
   ```
   cp backend/.env.example backend/.env
   ```

2. Update the values in the `.env` file with your actual configuration:
   - Firebase Admin SDK credentials
   - Spotify API credentials
   - MongoDB connection details
   - Other application settings

### Required Environment Variables

#### Firebase Admin SDK
- `FIREBASE_TYPE`: Service account type
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_PRIVATE_KEY_ID`: Firebase private key ID
- `FIREBASE_PRIVATE_KEY`: Firebase private key
- `FIREBASE_CLIENT_EMAIL`: Firebase client email
- `FIREBASE_CLIENT_ID`: Firebase client ID
- `FIREBASE_CLIENT_X509_CERT_URL`: Firebase client X509 certificate URL

#### Spotify API
- `SPOTIFY_CLIENT_ID`: Spotify API client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify API client secret
- `SPOTIFY_REDIRECT_URI`: Spotify API redirect URI

#### MongoDB
- `MONGODB_HOST`: MongoDB host
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
