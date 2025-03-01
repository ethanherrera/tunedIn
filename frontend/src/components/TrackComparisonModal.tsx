import React, { useState, useEffect } from 'react';
import './TrackComparisonModal.css';
import { reviewApi, spotifyApi } from '../api/apiClient';

interface Track {
  albumImageUrl: string;
  albumName: string;
  artistName: string;
  trackName: string;
  spotifyId: string;
}

interface TrackComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrack: Track;
  onComplete?: () => void; // Optional callback for when all comparisons are done
}

const TrackComparisonModal: React.FC<TrackComparisonModalProps> = ({
  isOpen,
  onClose,
  initialTrack,
  onComplete
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [comparisonTracks, setComparisonTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's reviewed tracks when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserReviewedTracks();
      // Reset to first comparison when modal opens
      setCurrentTrackIndex(0);
    }
  }, [isOpen, initialTrack.spotifyId]);

  // Function to fetch user's reviewed tracks
  const fetchUserReviewedTracks = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user reviews from the backend
      const userReviews = await reviewApi.getUserReviews();
      
      // Create an array to hold tracks with details
      const reviewedTracks: Track[] = [];
      
      // Fetch track details for each review
      for (const review of userReviews) {
        // Skip the current track being reviewed if it's in the user's reviews
        if (review.spotifyTrackId === initialTrack.spotifyId) {
          continue;
        }
        
        try {
          const trackData = await spotifyApi.getTrack(review.spotifyTrackId);
          
          reviewedTracks.push({
            albumImageUrl: trackData.album.images[0]?.url || 'https://via.placeholder.com/300',
            albumName: trackData.album.name,
            artistName: trackData.artists[0].name,
            trackName: trackData.name,
            spotifyId: trackData.id
          });
        } catch (trackError) {
          console.error(`Failed to fetch track ${review.spotifyTrackId}:`, trackError);
          // Skip tracks that fail to load
        }
      }
      
      // If we have more than 5 tracks, randomly select 5 for comparison
      if (reviewedTracks.length > 5) {
        const shuffled = [...reviewedTracks].sort(() => 0.5 - Math.random());
        setComparisonTracks(shuffled.slice(0, 5));
      } else if (reviewedTracks.length > 0) {
        // Use all available tracks if we have between 1-5
        setComparisonTracks(reviewedTracks);
      } else {
        // If no reviewed tracks, show an error
        setError("You need to review more tracks before you can make comparisons.");
        // Close the modal after a delay
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to fetch user reviewed tracks:', err);
      setError('Failed to load your reviewed tracks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create a clean close handler
  const handleClose = () => {
    // Reset state
    setCurrentTrackIndex(0);
    setComparisonTracks([]);
    setError(null);
    // Call parent onClose
    onClose();
  };

  // Handle completion of all comparisons
  const handleCompletion = () => {
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete();
    } else {
      // If no callback provided, just close the modal
      handleClose();
    }
  };

  if (!isOpen) return null;

  // Show loading state
  if (loading || comparisonTracks.length === 0) {
    return (
      <div className="modal-overlay loading-overlay">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading tunedIn...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="modal-overlay">
        <div className="comparison-modal-content">
          <button className="close-button" onClick={handleClose}>×</button>
          <div className="error-container">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const challengerTrack = comparisonTracks[currentTrackIndex];

  const handleTrackSelect = (selectedTrack: Track) => {
    if (currentTrackIndex >= comparisonTracks.length - 1) {
      // All comparisons are done
      handleCompletion();
      return;
    }
    setCurrentTrackIndex(prevIndex => prevIndex + 1);
  };

  return (
    <div className="modal-overlay">
      <div className="comparison-modal-content">
        <button className="close-button" onClick={handleClose}>×</button>
        
        <h2 className="comparison-title">Please select which track you believe is better</h2>
        
        <div className="tracks-container">
          <div 
            className="track-option"
            onClick={() => handleTrackSelect(initialTrack)}
          >
            <div className="track-card">
              <div className="track-card-inner">
                <div className="album-cover">
                  <img
                    src={initialTrack.albumImageUrl}
                    alt={`${initialTrack.albumName} by ${initialTrack.artistName}`}
                  />
                </div>
                <div className="track-info">
                  <div>
                    <h3 className="track-name">{initialTrack.trackName}</h3>
                    <p className="artist-name">{initialTrack.artistName}</p>
                    <p className="album-name">{initialTrack.albumName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="comparison-divider">OR</div>

          <div 
            className="track-option"
            onClick={() => handleTrackSelect(challengerTrack)}
          >
            <div className="track-card">
              <div className="track-card-inner">
                <div className="album-cover">
                  <img
                    src={challengerTrack.albumImageUrl}
                    alt={`${challengerTrack.albumName} by ${challengerTrack.artistName}`}
                  />
                </div>
                <div className="track-info">
                  <div>
                    <h3 className="track-name">{challengerTrack.trackName}</h3>
                    <p className="artist-name">{challengerTrack.artistName}</p>
                    <p className="album-name">{challengerTrack.albumName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="comparison-progress">
          {currentTrackIndex + 1} of {comparisonTracks.length} comparisons
        </div>
      </div>
    </div>
  );
};

export default TrackComparisonModal; 