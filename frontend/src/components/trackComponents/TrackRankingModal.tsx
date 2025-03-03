import React, { useState, useEffect } from 'react';
import './TrackRankingModal.css';
import { reviewApi } from '../../api/apiClient';
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
  existingReviewId?: string;
}

const TrackRankingModal: React.FC<TrackRankingModalProps> = ({ isOpen, onClose, track, existingReviewId }) => {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState<'dislike' | 'neutral' | 'like' | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Store review data to submit after comparisons
  const [pendingReview, setPendingReview] = useState<{
    spotifyTrackId: string;
    opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
    description: string;
  } | null>(null);
  // Flag to prevent duplicate submissions
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  // Flag to track if comparisons are complete
  const [comparisonsComplete, setComparisonsComplete] = useState(false);
  // Flag to track if we're prefetching comparisons
  const [isPrefetchingComparisons, setIsPrefetchingComparisons] = useState(false);
  // Flag to indicate when comparison data is ready
  const [comparisonDataReady, setComparisonDataReady] = useState(false);
  // Store the final ranking determined by binary search
  const [finalRanking, setFinalRanking] = useState<number | null>(null);

  // Reset form data when modal is closed or when track changes
  useEffect(() => {
    if (isOpen) {
      // Track has changed, reset the form
      setReview('');
      setRating(null);
      setError(null);
      setWordCount(0);
      setPendingReview(null);
      setHasSubmittedReview(false);
      setShowComparison(false);
      setComparisonsComplete(false);
      setIsPrefetchingComparisons(false);
      setComparisonDataReady(false);
      setFinalRanking(null);
    }
  }, [isOpen, track.spotifyId]);

  // Start prefetching when rating changes
  useEffect(() => {
    if (rating) {
      console.log('TrackRankingModal: Rating changed, prefetching comparisons');
      // When rating changes, immediately start prefetching and show comparisons
      setIsPrefetchingComparisons(true);
      setComparisonsComplete(false);
      setComparisonDataReady(false);
      // Show the comparison modal immediately when rating is selected
      setShowComparison(true);
    } else {
      // Reset states when rating is cleared
      setShowComparison(false);
      setComparisonsComplete(false);
      setIsPrefetchingComparisons(false);
      setComparisonDataReady(false);
    }
  }, [rating]);

  // Handle data ready notification
  const handleDataReady = () => {
    console.log('TrackRankingModal: Comparison data prefetch completed');
    setComparisonDataReady(true);
    // Show comparison section as soon as data is ready
    setShowComparison(true);
  };

  // Handle comparison completion
  const handleComparisonComplete = (ranking?: number) => {
    console.log('TrackRankingModal: Comparisons completed with ranking:', ranking);
    setComparisonsComplete(true);
    if (ranking !== undefined) {
      setFinalRanking(ranking);
    }
  };

  // Handle clean up when modal closes
  const handleClose = () => {
    // Reset all form data
    setReview('');
    setRating(null);
    setError(null);
    setWordCount(0);
    setShowComparison(false);
    setPendingReview(null);
    // Call the parent onClose function
    onClose();
  };

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

  // Generate a random rating within a range depending on the opinion
  const generateRandomRating = (): number => {
    if (!rating) return 5.0; // Default to middle if no rating (shouldn't happen)
    
    // Define ranges for each opinion type
    const ranges = {
      'dislike': { min: 0.0, max: 3.9 },
      'neutral': { min: 4.0, max: 7.9 },
      'like': { min: 8.0, max: 10.0 }
    };
    
    const range = ranges[rating];
    
    // Generate random number within the range, rounded to 1 decimal
    return Math.round((range.min + Math.random() * (range.max - range.min)) * 10) / 10;
  };

  const handleDeleteReview = async () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      setIsDeleting(true);
      try {
        if (existingReviewId) {
          await reviewApi.deleteReview(existingReviewId);
        } else {
          await reviewApi.deleteReviewByTrackId(track.spotifyId);
        }
        
        // Close modal after successful deletion
        handleClose();
      } catch (err) {
        setError('Failed to delete review. Please try again.');
        console.error('Error deleting review:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !rating || wordCount > 200) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const opinionValue = mapRatingToOpinion(rating);
      
      // Create the review data
      const reviewData = {
        spotifyTrackId: track.spotifyId,
        opinion: opinionValue,
        description: review,
        rating: 0, // Rating will be calculated on the backend
        ranking: finalRanking || 0 // Use the ranking from binary search if available
      };
      
      // If we have an existing review ID, update it
      if (existingReviewId) {
        await reviewApi.updateReview(existingReviewId, reviewData);
      } else {
        // Otherwise create a new review
        await reviewApi.createReview(reviewData);
      }
      
      // Mark as submitted to prevent duplicate submissions
      setHasSubmittedReview(true);
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Failed to submit your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="track-ranking-modal-overlay">
      <div className="track-ranking-modal-content track-ranking-modal-combined-modal">
        <button className="track-ranking-modal-close-button" onClick={handleClose}>×</button>
        
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
        <div className="track-ranking-modal-review-section">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your review (max 200 words)..."
            maxLength={1000}
            className="track-ranking-modal-review-input"
            disabled={isSubmitting || isDeleting}
          />
          <div className="track-ranking-modal-word-count">
            <span className={wordCount > 200 ? 'exceeded' : ''}>
              {wordCount} / 200 words
            </span>
          </div>
        </div>

        {/* Rating Buttons */}
        <div className="track-ranking-modal-rating-buttons">
          <div className="track-ranking-modal-rating-button-container">
            <span className="track-ranking-modal-rating-label">I didn't like it...</span>
            <button
              className={`track-ranking-modal-rating-button dislike ${rating === 'dislike' ? 'active' : ''}`}
              onClick={() => setRating('dislike')}
              disabled={isSubmitting || isDeleting}
            />
          </div>
          <div className="track-ranking-modal-rating-button-container">
            <span className="track-ranking-modal-rating-label">It was fine.</span>
            <button
              className={`track-ranking-modal-rating-button neutral ${rating === 'neutral' ? 'active' : ''}`}
              onClick={() => setRating('neutral')}
              disabled={isSubmitting || isDeleting}
            />
          </div>
          <div className="track-ranking-modal-rating-button-container">
            <span className="track-ranking-modal-rating-label">I liked it!</span>
            <button
              className={`track-ranking-modal-rating-button like ${rating === 'like' ? 'active' : ''}`}
              onClick={() => setRating('like')}
              disabled={isSubmitting || isDeleting}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="track-ranking-modal-error-message">{error}</div>}

        {/* Comparison Modal */}
        {rating && (
          <TrackComparisonModal
            key={`comparison-${rating}-${track.spotifyId}`}
            isOpen={true}
            onClose={() => {
              setShowComparison(false);
              setComparisonsComplete(false);
            }}
            initialTrack={track}
            onDataReady={handleDataReady}
            onComparisonComplete={handleComparisonComplete}
            embedded={true}
            visibleWhenReady={true}
            selectedOpinion={mapRatingToOpinion(rating)}
          />
        )}

        {/* Action Buttons */}
        <div className="track-ranking-modal-action-buttons">
          {/* Only show submit button when comparisons are complete */}
          {comparisonsComplete && (
            <button
              className="track-ranking-modal-submit-button"
              onClick={handleSubmit}
              disabled={isSubmitting || isDeleting || !rating || wordCount > 200}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackRankingModal; 