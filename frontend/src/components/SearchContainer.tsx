import React, { useState, useEffect } from 'react';
import './SearchContainer.css';
import TrackRankingModal from './TrackRankingModal';
import TrackCardSearchResult from './TrackCardSearchResult';
import { spotifyApi } from '../api/apiClient';

// Updated Track interface to match what we need from Spotify's response
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
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const searchSpotify = async () => {
      if (searchTerm.trim() === '') {
        setSearchResults([]);
        return;
      }

      try {
        const response = await spotifyApi.search({
          q: searchTerm,
          type: 'track', // Only search for tracks
          limit: 5,      // Limit to top 5 results
          accessToken: 'BQBvp1xSfS1gdM0mmNeuKRZiEEBs86h1etEXMtNUtbgPF1L2fCBUl5LV0NbDYfE3VTKSd7KIuUdjEhSqv65-GuHQYYAQHo6e2WlCmq_rGtCIHkeitfY6UBfWafC1YVkwIROOLhb2toJLZ3Ldlrixl6A1L2ZwYQLr-wznGSQy9zRa7L-rC3noIfuR4FUC_CAju-ZVJf0RKJS9a3ncOlDlIEhW7k4qqTvKHZp01QSm5M_Q9mQVaijXAMOMqBnDUztYhnkBhAKcKvtCDvvZGpGv6lPgMa5m8l5IdW30rmTODA' // TODO: Replace with actual user ID
        });

        // Transform Spotify track results to match our Track interface
        const transformedTracks: Track[] = response.tracks?.items.map(track => ({
          spotifyId: track.id,
          trackName: track.name,
          artistName: track.artists[0].name,
          albumName: track.album.name,
          albumImageUrl: track.album.images[0]?.url || ''
        })) || [];

        setSearchResults(transformedTracks);
      } catch (error) {
        console.error('Failed to search tracks:', error);
        setSearchResults([]);
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(searchSpotify, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleTrackClick = (track: Track) => {
    setSelectedTrack(track);
    setIsModalOpen(true);
    setSearchTerm('');
    setSearchResults([]);
    setIsFocused(false);
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
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
      
      {searchResults.length > 0 && isFocused && (
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