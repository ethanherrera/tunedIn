import React from 'react';
import SearchContainer from './components/SearchContainer';
import UserRankingLists from './components/UserRankingLists';
import UserReviewedTracks from './components/UserReviewedTracks';
import { spotifyApi } from './api/apiClient';

function App() {
    const handleSpotifyLogin = async () => {
        try {
            const { url } = await spotifyApi.login();
            window.location.href = url;
        } catch (error) {
            console.error('Failed to initiate Spotify login:', error);
        }
    };

    return (
        <div className="app">
            <main className="app-content">
                <button 
                    onClick={handleSpotifyLogin}
                    className="spotify-login-button"
                    style={{
                        backgroundColor: '#1DB954',
                        color: 'white',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '24px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        margin: '20px 0',
                        transition: 'background-color 0.2s ease',
                    }}
                >
                    Connect with Spotify
                </button>
                <SearchContainer />
                <UserReviewedTracks />
            </main>
        </div>
    );
}

export default App;