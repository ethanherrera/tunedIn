import React from 'react';
import { spotifyApi } from '../../api/apiClient';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const handleSpotifyLogin = async () => {
    try {
      const { url } = await spotifyApi.login();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to initiate Spotify login:', error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-container">
          <h1 className="app-logo">tunedIn</h1>
          <p className="app-tagline">Share your music opinions with the world</p>
        </div>
        
        <div className="login-content">
          <h2>Welcome to tunedIn</h2>
          <p>
            Connect with Spotify to start reviewing your favorite tracks and discover what others think about them.
          </p>
          
          <button 
            onClick={handleSpotifyLogin}
            className="spotify-login-button"
          >
            <div className="spotify-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="currentColor"/>
              </svg>
            </div>
            <span>Connect with Spotify</span>
          </button>
          
          <div className="login-footer">
            <p>By connecting, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 