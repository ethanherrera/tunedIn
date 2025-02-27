import React, { useState, useEffect } from 'react';
import './SearchContainer.css';
import trackData from '../data/hard-coded-tracks.json';
import TrackRankingModal from './TrackRankingModal';
import TrackCardSearchResult from './TrackCardSearchResult';

interface Track {
  albumImageUrl: string;
  albumName: string;
  artistName: string;
  trackName: string;
  spotifyId: string;
}

const SearchContainer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Combine featured track and comparison tracks
  const allTracks = [
    trackData.featuredTrack,
    ...trackData.comparisonTracks
  ];

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filteredTracks = allTracks
      .filter(track =>
        track.trackName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.artistName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5);

    setSearchResults(filteredTracks);
  }, [searchTerm]);

  const handleTrackClick = (track: Track) => {
    setSelectedTrack(track);
    setIsModalOpen(true);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="search-container-wrapper">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for your song..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="search-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>
      
      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((track) => (
            <div key={track.spotifyId} className="search-result-item">
              <TrackCardSearchResult 
                track={track} 
                onClick={handleTrackClick}
              />
            </div>
          ))}
        </div>
      )}

      {selectedTrack && (
        <TrackRankingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          track={selectedTrack}
        />
      )}
    </div>
  );
};

export default SearchContainer; 