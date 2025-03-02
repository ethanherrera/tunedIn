import React, { useState, useEffect } from 'react';
import './SearchContainer.css';
import TrackRankingModal from './TrackRankingModal';
import TrackCardSearchResult from './TrackCardSearchResult';
import TrackDetailsModal from './TrackDetailsModal';
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
          <TrackDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={handleDetailsModalClose}
            track={selectedTrack}
            onReview={handleReviewClick}
            onReReview={handleReReviewClick}
            opinion={reviewData?.opinion}
            description={reviewData?.description}
            rating={reviewData?.rating}
            reviewId={reviewData?.id}
            rank={reviewData?.rank}
            totalReviews={reviewData?.totalReviews}
            isLoading={isLoading}
            onReviewDeleted={() => fetchReviewData(selectedTrack.spotifyId)}
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

export default SearchContainer; 