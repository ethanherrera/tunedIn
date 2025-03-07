import React, { useState, useEffect } from 'react';
import LoginPage from './pages/login/page';
import { spotifyApi } from './api/apiClient';
import './app.css';
import "./index.css"
import Main from './pages/main/pages/Main';
import { Progress } from './components/ui/progress';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    
    // Check authentication on component mount
    useEffect(() => {
        const verifyAuth = async () => {
            try {
                // Start loading progress
                setLoadingProgress(25);
                
                // First check for cookies as a quick check
                const cookies = document.cookie.split(';');
                const hasDisplayNameCookie = cookies.some(cookie => 
                    cookie.trim().startsWith('displayName=')
                );
                
                setLoadingProgress(50);
                
                if (!hasDisplayNameCookie) {
                    // If no cookie, we know we're not authenticated
                    setLoadingProgress(100);
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }
                
                setLoadingProgress(75);
                
                // If cookie exists, verify with backend
                await spotifyApi.getMe();
                setLoadingProgress(100);
                setIsAuthenticated(true);
                setIsLoading(false);
            } catch (error) {
                console.log('User not authenticated or token expired');
                setLoadingProgress(100);
                setIsAuthenticated(false);
                setIsLoading(false);
            }
        };
        
        verifyAuth();
    }, []);
    
    // Show loading indicator while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-full">
                <div className="w-1/3 max-w-md">
                    <Progress value={loadingProgress} className="h-2" />
                </div>
            </div>
        );
    }
    
    // If not authenticated, show login page
    if (!isAuthenticated) {
        return (
            <div className="app">
                <LoginPage />
            </div>
        );
    }
    
    // If authenticated, show main app with logout button
    return (
        <div className="app">
            <div className="app-header">
                <Main />
            </div>
        </div>
    );
}

export default App;