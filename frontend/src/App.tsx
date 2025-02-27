import React from 'react';
import TrackCard from './components/TrackCard';

function App() {
    return (
        <div className="app">
            <header className="app-header">
                <h1>Featured Track</h1>
            </header>
            <main className="app-content">
                <TrackCard />
            </main>
            <footer className="app-footer">
                <p>React + TypeScript Music Card Demo</p>
            </footer>
        </div>
    );
}

export default App;