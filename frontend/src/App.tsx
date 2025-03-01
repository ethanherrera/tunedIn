import React, { useState, useEffect } from 'react';
import SearchContainer from './components/SearchContainer';
import UserReviewedTracks from './components/UserReviewedTracks';
import LoginPage from './components/LoginPage';
import { spotifyApi } from './api/apiClient';
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    // Combined authentication check
    useEffect(() => {
        const verifyAuth = async () => {
            try {
                // First check for cookies as a quick check
                const cookies = document.cookie.split(';');
                const hasDisplayNameCookie = cookies.some(cookie => 
                    cookie.trim().startsWith('displayName=')
                );
                
                if (!hasDisplayNameCookie) {
                    // If no cookie, we know we're not authenticated
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }
                
                // If cookie exists, verify with backend
                await spotifyApi.getMe();
                setIsAuthenticated(true);
            } catch (error) {
                console.log('User not authenticated or token expired');
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        
        verifyAuth();
    }, []);
    
    // Only render content when loading is complete
    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading tunedIn...</p>
            </div>
        );
    }
    
    // If not authenticated, show login page
    if (!isAuthenticated) {
        return <LoginPage />;
    }
    
    // If authenticated, show main app
    return (
        <div className="app">
            <header className="app-header">
                <h1 className="app-title">tunedIn</h1>
                <button 
                    onClick={() => {
                        // Clear cookies and reload page
                        document.cookie.split(';').forEach(cookie => {
                            const [name] = cookie.trim().split('=');
                            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                        });
                        window.location.reload();
                    }}
                    className="logout-button"
                >
                    Logout
                </button>
            </header>
            
            <main className="app-content">
                <SearchContainer />
                <UserReviewedTracks />
            </main>
        </div>
    );
}

export default App;