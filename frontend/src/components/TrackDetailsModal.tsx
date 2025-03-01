import React, { useState } from 'react';
import './TrackDetailsModal.css';
import { reviewApi } from '../api/apiClient';

interface TrackDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: {
    albumImageUrl: string;
    albumName: string;
    artistName: string;
    trackName: string;
    spotifyId: string;
  };
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  onReReview: () => void;
  description: string;
  rating: number;
  reviewId?: string;
  onReviewDeleted?: () => void;
  rank?: number;
  totalReviews?: number;
}

const TrackDetailsModal: React.FC<TrackDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  track, 
  opinion,
  onReReview,
  description,
  rating,
  reviewId,
  onReviewDeleted,
  rank,
  totalReviews
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!isOpen) return null;

  // Function to get color based on rating value
  const getRatingColor = (rating: number): string => {
    if (rating < 4.0) return '#e74c3c'; // Red for low ratings (dislike range: 0.0-3.9)
    if (rating < 8.0) return '#f39c12'; // Yellow/orange for mid ratings (neutral range: 4.0-7.9)
    return '#2ecc71'; // Green for high ratings (like range: 8.0-10.0)
  };
  
  // Format the rating to always show one decimal place
  const formattedRating = rating.toFixed(1);

  const handleSpotifyOpen = () => {
    window.open(`https://open.spotify.com/track/${track.spotifyId}`, '_blank');
  };

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const handleDeleteReview = async () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      setIsDeleting(true);
      try {
        if (reviewId) {
          await reviewApi.deleteReview(reviewId);
        } else {
          await reviewApi.deleteReviewByTrackId(track.spotifyId);
        }
        
        if (onReviewDeleted) {
          onReviewDeleted();
        }
        onClose();
      } catch (error) {
        console.error('Failed to delete review:', error);
        alert('Failed to delete review. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Truncate description if it's too long and not showing full description
  const displayDescription = !showFullDescription && description.length > 150
    ? `${description.substring(0, 150)}...`
    : description;

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
              <button 
                className="re-review-button"
                onClick={onReReview}
              >
                Re-review
              </button>
            </div>
            
            <div className="track-details-ranking">
              <p className="ranking-label">Your tunedIn Score:</p>
              <div 
                className="rating-indicator" 
                style={{ 
                  backgroundColor: getRatingColor(rating),
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
                {formattedRating}
              </div>
              {rank && totalReviews && (
                <div className="rank-info-badge">
                  Rank: #{rank}
                </div>
              )}
            </div>
            
            <button 
              className="spotify-button"
              onClick={handleSpotifyOpen}
            >
              <svg className="spotify-icon" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Listen on Spotify
            </button>
            
            <div className="review-description-section">
              <h3 className="review-description-title">Review Description:</h3>
              <p className="review-description-text">{displayDescription}</p>
              {description.length > 150 && (
                <button 
                  className="see-more-button" 
                  onClick={toggleDescription}
                >
                  {showFullDescription ? 'See less' : 'See more'}
                </button>
              )}
            </div>
            
            <div className="review-actions">
              <button 
                className="delete-review-button"
                onClick={handleDeleteReview}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Review'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackDetailsModal; 