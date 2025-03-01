import React, { useState, useEffect } from 'react';
import { reviewApi, spotifyApi } from '../api/apiClient';
import TrackCardSearchResult from './TrackCardSearchResult';
import './UserReviewedTracks.css';

// Interface for the review data with track information
interface ReviewWithTrack {
  id: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  createdAt: number;
  track: {
    albumImageUrl: string;
    albumName: string;
    artistName: string;
    trackName: string;
    spotifyId: string;
  };
}

const UserReviewedTracks: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewWithTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const userReviews = await reviewApi.getUserReviews();
      
      // Create an array to hold reviews with track details
      const reviewsWithTracks: ReviewWithTrack[] = [];
      
      // Fetch track details for each review
      for (const review of userReviews) {
        try {
          const trackData = await spotifyApi.getTrack(review.spotifyTrackId);
          
          reviewsWithTracks.push({
            ...review,
            track: {
              albumImageUrl: trackData.album.images[0]?.url || 'https://via.placeholder.com/300',
              albumName: trackData.album.name,
              artistName: trackData.artists[0].name,
              trackName: trackData.name,
              spotifyId: trackData.id
            }
          });
        } catch (trackError) {
          console.error(`Failed to fetch track ${review.spotifyTrackId}:`, trackError);
          
          // Add the review with placeholder track data
          reviewsWithTracks.push({
            ...review,
            track: {
              albumImageUrl: 'https://via.placeholder.com/300',
              albumName: 'Unknown Album',
              artistName: 'Unknown Artist',
              trackName: 'Unknown Track',
              spotifyId: review.spotifyTrackId
            }
          });
        }
      }
      
      // Sort reviews by creation date (newest first)
      reviewsWithTracks.sort((a, b) => b.createdAt - a.createdAt);
      
      setReviews(reviewsWithTracks);
    } catch (err) {
      console.error('Failed to fetch user reviews:', err);
      setError('Failed to load your reviewed tracks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews when component mounts
  useEffect(() => {
    fetchUserReviews();
  }, []);

  const handleTrackClick = (track: any) => {
    // Open the track in Spotify
    window.open(`https://open.spotify.com/track/${track.spotifyId}`, '_blank');
  };

  return (
    <div className="user-reviewed-tracks">
      <div className="header">
        <h2>Your Reviewed Tracks</h2>
        <button 
          onClick={fetchUserReviews}
          disabled={loading}
          className="refresh-button"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {reviews.length === 0 && !loading && !error ? (
        <div className="no-reviews">
          <p>You haven't reviewed any tracks yet. Search for tracks to review them!</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="track-card-container">
                <TrackCardSearchResult 
                  track={review.track} 
                  onClick={handleTrackClick}
                />
                <div className={`opinion-circle opinion-circle-${review.opinion.toLowerCase()}`} 
                     title={review.opinion}>
                </div>
              </div>
              <div className="review-details">
                <p className="review-description">{review.description}</p>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserReviewedTracks; 