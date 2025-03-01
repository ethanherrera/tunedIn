import React, { useState, useEffect } from 'react';
import { reviewApi, spotifyApi } from '../api/apiClient';
import TrackCardSearchResult from './TrackCardSearchResult';
import TrackDetailsModal from './TrackDetailsModal';
import TrackRankingModal from './TrackRankingModal';
import './UserReviewedTracks.css';

// Interface for the review data with track information
interface ReviewWithTrack {
  id: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number;
  createdAt: number;
  rank?: number;
  totalReviews?: number;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewWithTrack | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isReReviewModalOpen, setIsReReviewModalOpen] = useState<boolean>(false);

  // Function to get color based on rating value
  const getRatingColor = (rating: number): string => {
    if (rating < 4.0) return '#e74c3c'; // Red for low ratings (dislike range: 0.0-3.9)
    if (rating < 8.0) return '#f39c12'; // Yellow/orange for mid ratings (neutral range: 4.0-7.9)
    return '#2ecc71'; // Green for high ratings (like range: 8.0-10.0)
  };

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
      
      // Sort reviews by rating (highest to lowest), then by date for equal ratings
      reviewsWithTracks.sort((a, b) => {
        // First sort by rating
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // If ratings are equal, sort by date (newest first)
        return b.createdAt - a.createdAt;
      });
      
      // Add ranking information
      const totalReviews = reviewsWithTracks.length;
      reviewsWithTracks.forEach((review, index) => {
        review.rank = index + 1;
        review.totalReviews = totalReviews;
      });
      
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

  const handleTrackClick = (review: ReviewWithTrack, e?: React.MouseEvent) => {
    setSelectedReview(review);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
  };

  const handleReReview = () => {
    setIsDetailsModalOpen(false);
    setIsReReviewModalOpen(true);
  };

  const handleCloseReReviewModal = () => {
    setIsReReviewModalOpen(false);
    // Refresh the reviews list after re-reviewing
    fetchUserReviews();
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
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your reviewed tracks...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="no-reviews">
          <p>You haven't reviewed any tracks yet. Search for tracks to review them!</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="review-item"
              onClick={(e) => handleTrackClick(review, e)}
            >
              <div className="track-card-container">
                <div className="album-cover-container">
                  <div className="album-cover">
                    <img 
                      src={review.track.albumImageUrl} 
                      alt={`${review.track.albumName} by ${review.track.artistName}`}
                    />
                  </div>
                  {review.rank && review.totalReviews && (
                    <div className="rank-badge">
                      #{review.rank} / {review.totalReviews}
                    </div>
                  )}
                </div>
                
                <div className="track-info">
                  <h3 className="track-name">{review.track.trackName}</h3>
                  <p className="artist-name">{review.track.artistName}</p>
                  <p className="album-name">{review.track.albumName}</p>
                </div>
                
                <div 
                  className="rating-circle"
                  style={{
                    backgroundColor: 
                      review.rating < 4.0 ? '#e74c3c' :  // Red for low ratings
                      review.rating < 8.0 ? '#f39c12' :  // Yellow/orange for mid ratings
                      '#2ecc71'                          // Green for high ratings
                  }}
                >
                  {review.rating.toFixed(1)}
                </div>
              </div>
              
              <div className="review-details">
                <p className="review-description">{review.description}</p>
                <p className="review-date">
                  Reviewed on: {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReview && (
        <TrackDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          track={selectedReview.track}
          opinion={selectedReview.opinion}
          onReReview={handleReReview}
          description={selectedReview.description}
          rating={selectedReview.rating}
          reviewId={selectedReview.id}
          onReviewDeleted={fetchUserReviews}
          rank={selectedReview.rank}
          totalReviews={selectedReview.totalReviews}
        />
      )}

      {/* Re-Review Modal */}
      {selectedReview && (
        <TrackRankingModal
          isOpen={isReReviewModalOpen}
          onClose={handleCloseReReviewModal}
          track={selectedReview.track}
          existingReviewId={selectedReview.id}
        />
      )}
    </div>
  );
};

export default UserReviewedTracks; 