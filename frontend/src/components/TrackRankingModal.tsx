import React, { useState, useEffect } from 'react';
import './TrackRankingModal.css';
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

  useEffect(() => {
    const words = review.trim().split(/\s+/);
    setWordCount(review.trim() === '' ? 0 : words.length);
  }, [review]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // Show comparison modal after submitting review
    setShowComparison(true);
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
            
          >
            Disliked It
          </button>
          <button
            className={`rating-button neutral ${rating === 'neutral' ? 'active' : ''}`}
            onClick={() => setRating('neutral')}
          >
            Neutral
          </button>
          <button
            className={`rating-button like ${rating === 'like' ? 'active' : ''}`}
            onClick={() => setRating('like')}
          >
            Liked It
          </button>
        </div>

        <button 
          className="submit-button" 
          onClick={handleSubmit}
          disabled={wordCount > 200}
        >
          Submit Rating
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