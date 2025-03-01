import React, { useState, useEffect } from 'react';
import './TrackRankingModal.css';
import { reviewApi } from '../api/apiClient';
import TrackComparisonModal from './TrackComparisonModal';

interface TrackRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: {
    albumImageUrl: string;
    albumName: string;
    artistName: string;
    trackName: string;
    spotifyId: string;
  };
}

const TrackRankingModal: React.FC<TrackRankingModalProps> = ({ isOpen, onClose, track }) => {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState<'dislike' | 'neutral' | 'like' | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const words = review.trim().split(/\s+/);
    setWordCount(review.trim() === '' ? 0 : words.length);
  }, [review]);

  if (!isOpen) return null;

  const mapRatingToOpinion = (rating: string): 'DISLIKE' | 'NEUTRAL' | 'LIKED' => {
    switch (rating) {
      case 'dislike':
        return 'DISLIKE';
      case 'neutral':
        return 'NEUTRAL';
      case 'like':
        return 'LIKED';
      default:
        throw new Error('Invalid rating');
    }
  };

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please select a rating');
      return;
    }

    if (wordCount > 200) {
      setError('Review cannot exceed 200 words');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await reviewApi.createReview({
        spotifyTrackId: track.spotifyId,
        opinion: mapRatingToOpinion(rating),
        description: review.trim()
      });

      // Show comparison modal after successful submission
      setShowComparison(true);
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        
        {/* Track Card Section */}
        <div className="track-card-modal">
          <div className="track-card-inner">
            <div className="album-cover">
              <img
                src={track.albumImageUrl}
                alt={`${track.albumName} by ${track.artistName}`}
              />
            </div>
            <div className="track-info">
              <div>
                <h3 className="track-name">{track.trackName}</h3>
                <p className="artist-name">{track.artistName}</p>
                <p className="album-name">{track.albumName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="review-section">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your review (max 200 words)..."
            maxLength={1000}
            className="review-input"
            disabled={isSubmitting}
          />
          <div className="word-count">
            <span className={wordCount > 200 ? 'exceeded' : ''}>
              {wordCount} / 200 words
            </span>
          </div>
        </div>

        {/* Rating Buttons */}
        <div className="rating-buttons">
          <button
            className={`rating-button dislike ${rating === 'dislike' ? 'active' : ''}`}
            onClick={() => setRating('dislike')}
            disabled={isSubmitting}
          >
            Disliked It
          </button>
          <button
            className={`rating-button neutral ${rating === 'neutral' ? 'active' : ''}`}
            onClick={() => setRating('neutral')}
            disabled={isSubmitting}
          >
            Neutral
          </button>
          <button
            className={`rating-button like ${rating === 'like' ? 'active' : ''}`}
            onClick={() => setRating('like')}
            disabled={isSubmitting}
          >
            Liked It
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button 
          className="submit-button" 
          onClick={handleSubmit}
          disabled={isSubmitting || wordCount > 200 || !rating}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>

      {showComparison && (
        <TrackComparisonModal
          isOpen={showComparison}
          onClose={() => {
            setShowComparison(false);
            onClose();
          }}
          initialTrack={track}
        />
      )}
    </div>
  );
};

export default TrackRankingModal; 