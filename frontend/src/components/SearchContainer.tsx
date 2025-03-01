import React, { useState, useEffect } from 'react';
import './SearchContainer.css';
import './TrackDetailsModal.css';
import TrackRankingModal from './TrackRankingModal';
import TrackCardSearchResult from './TrackCardSearchResult';
import { spotifyApi, reviewApi } from '../api/apiClient';

// Updated Track interface to match what we need from Spotify's response
interface Track {
  albumImageUrl: string;
  albumName: string;
  artistName: string;
  trackName: string;
  spotifyId: string;
}

// Interface for review data
interface ReviewData {
  id: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number;
  createdAt: number;
  rank?: number;
  totalReviews?: number;
}

const SearchContainer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
          limit: 5      // Limit to top 5 results
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

  // Function to fetch review data for a track
  const fetchReviewData = async (trackId: string) => {
    setIsLoading(true);
    try {
      const reviews = await reviewApi.getTrackReviews(trackId);
      if (reviews && reviews.length > 0) {
        // Sort all user reviews by rating (highest to lowest)
        const userReviews = await reviewApi.getUserReviews();
        
        // Sort reviews by rating (highest to lowest), then by date
        userReviews.sort((a, b) => {
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return b.createdAt - a.createdAt;
        });
        
        // Find the position of the current review
        const totalReviews = userReviews.length;
        const reviewIndex = userReviews.findIndex(r => r.spotifyTrackId === trackId);
        
        // Add rank information to the review
        const reviewWithRank = {
          ...reviews[0],
          rank: reviewIndex !== -1 ? reviewIndex + 1 : undefined,
          totalReviews: totalReviews > 0 ? totalReviews : undefined
        };
        
        setReviewData(reviewWithRank);
      } else {
        setReviewData(null);
      }
    } catch (error) {
      console.error('Failed to fetch review data:', error);
      setReviewData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackClick = async (track: Track) => {
    setSelectedTrack(track);
    // Fetch review data before opening the modal
    await fetchReviewData(track.spotifyId);
    setIsDetailsModalOpen(true);
    setSearchTerm('');
    setSearchResults([]);
    setIsFocused(false);
  };

  const handleDetailsModalClose = () => {
    setIsDetailsModalOpen(false);
    setReviewData(null);
  };

  const handleReviewClick = () => {
    setIsDetailsModalOpen(false);
    setIsModalOpen(true);
  };

  const handleReReviewClick = () => {
    setIsDetailsModalOpen(false);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    // Simply close the modal - the TrackRankingModal component will handle
    // canceling the review submission if closed prematurely
    setIsModalOpen(false);
    // Refresh review data if the user has completed a review
    if (selectedTrack) {
      fetchReviewData(selectedTrack.spotifyId);
    }
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
        <>
          <SearchTrackDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={handleDetailsModalClose}
            track={selectedTrack}
            onReview={handleReviewClick}
            onReReview={handleReReviewClick}
            reviewData={reviewData}
            isLoading={isLoading}
          />
          <TrackRankingModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            track={selectedTrack}
          />
        </>
      )}
    </div>
  );
};

// A simplified version of TrackDetailsModal for search results
interface SearchTrackDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  onReview: () => void;
  onReReview: () => void;
  reviewData: ReviewData | null;
  isLoading: boolean;
}

const SearchTrackDetailsModal: React.FC<SearchTrackDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  track,
  onReview,
  onReReview,
  reviewData,
  isLoading
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  if (!isOpen) return null;

  const handleSpotifyOpen = () => {
    window.open(`https://open.spotify.com/track/${track.spotifyId}`, '_blank');
  };

  // Function to get color based on rating value
  const getRatingColor = (rating: number): string => {
    if (rating < 4.0) return '#e74c3c'; // Red for low ratings (dislike range: 0.0-3.9)
    if (rating < 8.0) return '#f39c12'; // Yellow/orange for mid ratings (neutral range: 4.0-7.9)
    return '#2ecc71'; // Green for high ratings (like range: 8.0-10.0)
  };

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  // Determine if the track has been reviewed
  const hasReview = reviewData !== null;

  // Truncate description if it's too long and not showing full description
  const displayDescription = hasReview && !showFullDescription && reviewData.description.length > 150
    ? `${reviewData.description.substring(0, 150)}...`
    : hasReview ? reviewData.description : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content track-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="track-details-content">
          <div className="track-details-album-cover">
            <img 
              src={track.albumImageUrl} 
              alt={`${track.albumName} by ${track.artistName}`} 
            />
          </div>
          
          <div className="track-details-info">
            <h2 className="track-details-name">{track.trackName}</h2>
            <p className="track-details-album">{track.albumName}</p>
            
            <div className="track-details-artist-row">
              <p className="track-details-artist">{track.artistName}</p>
              {isLoading ? (
                <div className="loading-indicator">Loading...</div>
              ) : hasReview ? (
                <button 
                  className="re-review-button"
                  onClick={onReReview}
                >
                  Re-review
                </button>
              ) : (
                <button 
                  className="re-review-button"
                  onClick={onReview}
                >
                  Review
                </button>
              )}
            </div>
            
            {hasReview && (
              <div className="track-details-ranking">
                <p className="ranking-label">Your tunedIn Score:</p>
                <div 
                  className="rating-indicator" 
                  style={{ 
                    backgroundColor: getRatingColor(reviewData.rating),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    marginLeft: '10px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {reviewData.rating.toFixed(1)}
                </div>
                {reviewData.rank && reviewData.totalReviews && (
                  <div className="rank-info-badge">
                    Rank: {reviewData.rank}/{reviewData.totalReviews}
                  </div>
                )}
              </div>
            )}
            
            <button 
              className="spotify-button"
              onClick={handleSpotifyOpen}
            >
              <svg className="spotify-icon" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Listen on Spotify
            </button>
            
            {isLoading ? (
              <div className="search-track-description">
                <p>Loading review information...</p>
              </div>
            ) : hasReview ? (
              <div className="review-description-section">
                <h3 className="review-description-title">Your Review:</h3>
                <p className="review-description-text">{displayDescription}</p>
                {reviewData.description.length > 150 && (
                  <button 
                    className="see-more-button" 
                    onClick={toggleDescription}
                  >
                    {showFullDescription ? 'See less' : 'See more'}
                  </button>
                )}
              </div>
            ) : (
              <div className="search-track-description">
                <p>This track hasn't been reviewed yet. Click the Review button to add your review!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchContainer; 