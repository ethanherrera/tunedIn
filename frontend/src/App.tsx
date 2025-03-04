import React, { useState, useEffect, memo } from 'react';
import SearchContainer from './components/searchComponents/SearchContainer';
import UserReviewedTracks from './components/reviewComponents/UserReviewedTracks';
import UserReviewedAlbums from './components/reviewComponents/UserReviewedAlbums';
import TopTracks from './components/topTracksComponents/TopTracks';
import ProfilePage from './components/profileComponents/ProfilePage';
import LoginPage from './components/loginComponents/LoginPage';
import FriendsSidebar from './components/friendComponents/FriendsSidebar';
import { spotifyApi } from './api/apiClient';
import './App.css';

// Memoize components to prevent unnecessary re-renders
const MemoizedSearchContainer = memo(SearchContainer);
const MemoizedTopTracks = memo(TopTracks);
const MemoizedUserReviewedTracks = memo(UserReviewedTracks);
const MemoizedUserReviewedAlbums = memo(UserReviewedAlbums);
const MemoizedProfilePage = memo(ProfilePage);
const MemoizedFriendsSidebar = memo(FriendsSidebar);

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeView, setActiveView] = useState<'search' | 'reviews' | 'top-tracks' | 'album-reviews' | 'profile'>('search');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
    
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
    
    // Handle sidebar collapse state
    const handleSidebarCollapse = (collapsed: boolean) => {
        setIsSidebarCollapsed(collapsed);
    };
    
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
                <div className="nav-buttons">
                    <button 
                        className={`nav-button ${activeView === 'search' ? 'active' : ''}`}
                        onClick={() => setActiveView('search')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="nav-icon" viewBox="0 0 16 16">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                        </svg>
                        Search
                    </button>
                    <button 
                        className={`nav-button ${activeView === 'top-tracks' ? 'active' : ''}`}
                        onClick={() => setActiveView('top-tracks')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="nav-icon" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10zm0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/>
                            <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                            <path d="M9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        </svg>
                        Your Top Tracks
                    </button>
                    <button 
                        className={`nav-button ${activeView === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveView('reviews')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="nav-icon" viewBox="0 0 16 16">
                            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                        </svg>
                        Your Reviewed Tracks
                    </button>
                    <button 
                        className={`nav-button ${activeView === 'album-reviews' ? 'active' : ''}`}
                        onClick={() => setActiveView('album-reviews')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="nav-icon" viewBox="0 0 16 16">
                            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm6.5 11V2H2v11h4.5zm2 0H14V2H8.5v11z"/>
                        </svg>
                        Your Reviewed Albums
                    </button>
                    <button 
                        className={`nav-button ${activeView === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveView('profile')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="nav-icon" viewBox="0 0 16 16">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                        </svg>
                        Your Profile
                    </button>
                </div>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="logout-icon" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                        <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                    </svg>
                    Logout
                </button>
            </header>
            
            <div className={`app-container ${!isSidebarCollapsed ? 'sidebar-active' : ''}`}>
                <main className="app-content">
                    {/* Keep all components mounted but only display the active one */}
                    <div style={{ display: activeView === 'search' ? 'block' : 'none' }}>
                        <MemoizedSearchContainer />
                    </div>
                    <div style={{ display: activeView === 'top-tracks' ? 'block' : 'none' }}>
                        <MemoizedTopTracks />
                    </div>
                    <div style={{ display: activeView === 'reviews' ? 'block' : 'none' }}>
                        <MemoizedUserReviewedTracks />
                    </div>
                    <div style={{ display: activeView === 'album-reviews' ? 'block' : 'none' }}>
                        <MemoizedUserReviewedAlbums />
                    </div>
                    <div style={{ display: activeView === 'profile' ? 'block' : 'none' }}>
                        <MemoizedProfilePage />
                    </div>
                </main>
                
                {/* Friends Sidebar */}
                <MemoizedFriendsSidebar 
                    isCollapsed={isSidebarCollapsed}
                    onCollapseChange={handleSidebarCollapse}
                />
            </div>
        </div>
    );
}

export default App;