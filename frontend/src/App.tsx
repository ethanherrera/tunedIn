import React from 'react';
import SearchContainer from './components/SearchContainer';
import UserRankingLists from './components/UserRankingLists';

function App() {
    return (
        <div className="app">
            <main className="app-content">
                <SearchContainer />
                <UserRankingLists />
            </main>
            <footer className="app-footer">
                <p>React + TypeScript Music Card Demo</p>
            </footer>
        </div>
    );
}

export default App;