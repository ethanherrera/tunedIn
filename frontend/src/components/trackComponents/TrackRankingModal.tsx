import React, { useState, useEffect } from 'react';
import './TrackRankingModal.css';
import { reviewApi } from '../../api/apiClient';
import TrackComparisonModal from './TrackComparisonModal';

// Add interface for the review data
interface ReviewData {
  id: string;
  userId: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number;
  ranking: number;
  createdAt: number;
  genres: string[];
}

interface TrackRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: {
    albumImageUrl: string;
    albumName: string;
    artistName: string;
    trackName: string;
    spotifyId: string;
    albumId: string;
  };
  existingReviewId?: string;
  onAlbumReviewSaved?: () => void;
}

const TrackRankingModal: React.FC<TrackRankingModalProps> = ({ isOpen, onClose, track, existingReviewId, onAlbumReviewSaved }) => {
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
  // Store the existing review data
  const [existingReview, setExistingReview] = useState<ReviewData | null>(null);
  // Flag to track if we're loading the existing review
  const [isLoadingExistingReview, setIsLoadingExistingReview] = useState(false);

  // Fetch existing review data when the modal opens with an existingReviewId
  useEffect(() => {
    const fetchExistingReview = async () => {
      if (!existingReviewId || !isOpen) return;
      
      setIsLoadingExistingReview(true);
      try {
        // Use the reviewApi to get the review by ID
        const response = await reviewApi.getTrackReviews(track.spotifyId);
        const reviewData = response.find(r => r.id === existingReviewId);
        
        if (reviewData) {
          setExistingReview(reviewData);
          // Autofill the description field with the existing review's description
          setReview(reviewData.description);
          // Set the initial rating based on the existing review's opinion
          setRating(mapOpinionToRating(reviewData.opinion));
          // Update word count
          const words = reviewData.description.trim().split(/\s+/);
          setWordCount(reviewData.description.trim() === '' ? 0 : words.length);
        }
      } catch (err) {
        console.error('Failed to fetch existing review:', err);
        setError('Failed to load your existing review. You can still create a new one.');
      } finally {
        setIsLoadingExistingReview(false);
      }
    };
    
    fetchExistingReview();
  }, [existingReviewId, isOpen, track.spotifyId]);

  // Reset form data when modal is closed or when track changes
  useEffect(() => {
    if (isOpen) {
      // Only reset if we don't have an existing review to load
      if (!existingReviewId) {
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
    }
  }, [isOpen, track.spotifyId, existingReviewId]);

  // Helper function to map opinion to rating
  const mapOpinionToRating = (opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED'): 'dislike' | 'neutral' | 'like' => {
    switch (opinion) {
      case 'DISLIKE':
        return 'dislike';
      case 'NEUTRAL':
        return 'neutral';
      case 'LIKED':
        return 'like';
      default:
        return 'neutral';
    }
  };

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
    
    // Automatically submit the review when comparisons are complete
    if (rating) {
      setTimeout(() => {
        submitReview(ranking);
      }, 500); // Small delay to allow user to see the final comparison result
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
    if (isDeleting) return;
    
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      if (existingReviewId) {
        const response = await reviewApi.deleteReview(existingReviewId);
        console.log('Review deleted:', response);
      } else {
        const response = await reviewApi.deleteReviewByTrackId(track.spotifyId);
        console.log('Review deleted by track ID:', response);
      }
      
      // Notify parent component that the review was deleted (which may update album review UI)
      if (onAlbumReviewSaved) {
        onAlbumReviewSaved();
      }
      
      onClose();
    } catch (err) {
      console.error('Failed to delete review:', err);
      setError('Failed to delete your review. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract submit logic to a reusable function
  const submitReview = async (ranking?: number) => {
    try {
      setIsSubmitting(true);
      
      // Get the opinion value from the rating
      if (!rating) {
        setError('Please select a rating (Dislike, Neutral, or Like)');
        return;
      }
      
      const opinionValue = mapRatingToOpinion(rating);
      
      console.log('Submitting review with data:', {
        spotifyTrackId: track.spotifyId,
        opinion: opinionValue,
        description: review,
        ranking: ranking || finalRanking || 0,
        ...(existingReviewId && { id: existingReviewId })
      });
      
      const reviewData = {
        spotifyTrackId: track.spotifyId,
        opinion: opinionValue,
        description: review,
        ranking: ranking || finalRanking || 0, // Use the ranking from binary search if available
        ...(existingReviewId && { id: existingReviewId }) // Include ID if updating
      };
      
      // Use the unified saveReview method
      try {
        const reviewResponse = await reviewApi.saveReview(reviewData);
        console.log(existingReviewId ? 'Review updated:' : 'Review created:', reviewResponse);
        
        // Mark as submitted to prevent duplicate submissions
        setHasSubmittedReview(true);
        
        // The backend now automatically handles album reviews when a track is reviewed
        
        // Close the modal
        onClose();
        
        // Trigger the callback if provided
        if (onAlbumReviewSaved) {
          onAlbumReviewSaved();
        }
      } catch (error: any) {
        console.error('Error saving review:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        }
        setError(`Failed to save review: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error('Error in submitReview function:', e);
      setError(`An error occurred: ${e.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    submitReview();
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
          {/* Submit button removed - review is automatically submitted when comparisons are complete */}
        </div>
      </div>
    </div>
  );
};

export default TrackRankingModal; 