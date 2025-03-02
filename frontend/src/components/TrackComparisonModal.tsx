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
  embedded?: boolean; // Whether this modal is embedded within another component
  onComparisonComplete?: () => void; // Called when comparisons are complete or none available
  onDataReady?: () => void; // Callback for when data is ready but before showing the modal
  visibleWhenReady?: boolean; // Whether the modal should be visible when data is ready
  selectedOpinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED'; // The selected opinion to filter comparisons
}

const TrackComparisonModal: React.FC<TrackComparisonModalProps> = ({
  isOpen,
  onClose,
  initialTrack,
  onComplete,
  embedded = false,
  onComparisonComplete,
  onDataReady,
  visibleWhenReady = true,
  selectedOpinion
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [comparisonTracks, setComparisonTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true); // Start as loading
  const [error, setError] = useState<string | null>(null);
  const [hasCalledComplete, setHasCalledComplete] = useState(false);
  const [noTracksAvailable, setNoTracksAvailable] = useState(false);
  const [allComparisonsCompleted, setAllComparisonsCompleted] = useState(false);
  const [contentReady, setContentReady] = useState(false); // Add new state for content readiness

  // Call onComparisonComplete when appropriate
  useEffect(() => {
    // Call the comparison complete callback when:
    // 1. No tracks are available
    // 2. All comparisons have been completed
    if (contentReady && onComparisonComplete) {
      if (noTracksAvailable || allComparisonsCompleted || comparisonTracks.length === 0) {
        console.log('TrackComparisonModal: Notifying comparison completion');
        onComparisonComplete();
      }
    }
  }, [contentReady, noTracksAvailable, allComparisonsCompleted, comparisonTracks.length, onComparisonComplete]);

  // Call onDataReady when content is ready
  useEffect(() => {
    if (contentReady && onDataReady) {
      console.log('TrackComparisonModal: Data ready, notifying parent');
      onDataReady();
    }
  }, [contentReady, onDataReady]);

  // Fetch user's reviewed tracks when the modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('TrackComparisonModal: Modal opened, fetching reviewed tracks');
      // Reset to initial state
      setCurrentTrackIndex(0);
      setHasCalledComplete(false);
      setNoTracksAvailable(false);
      setAllComparisonsCompleted(false);
      setContentReady(false); // Content not ready yet
      setLoading(true); // Start loading
      
      // Fetch the data
      fetchUserReviewedTracks();
    }
  }, [isOpen, initialTrack.spotifyId]);

  // Log component remounting for debugging
  useEffect(() => {
    console.log('TrackComparisonModal: Component mounted/remounted');
    return () => {
      console.log('TrackComparisonModal: Component unmounting');
    };
  }, []);

  // Function to fetch user's reviewed tracks
  const fetchUserReviewedTracks = async () => {
    try {
      console.log('TrackComparisonModal: Fetching user reviews');
      // Get user reviews from the backend filtered by opinion
      const userReviews = await reviewApi.getUserReviews([selectedOpinion]);
      console.log('TrackComparisonModal: Received reviews count:', userReviews.length);
      
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
            albumImageUrl: trackData.album.images[0]?.url || '',
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
        // If no reviewed tracks, just show a message
        console.log('TrackComparisonModal: No tracks available for comparison');
        setNoTracksAvailable(true);
      }
    } catch (err) {
      console.error('Failed to fetch user reviewed tracks:', err);
      setError('Failed to load your reviewed tracks. Please try again.');
    } finally {
      setLoading(false);
      setContentReady(true); // Content is ready to display now
    }
  };

  // Create a clean close handler
  const handleClose = () => {
    console.log('TrackComparisonModal: handleClose called');
    // Reset state
    setCurrentTrackIndex(0);
    setComparisonTracks([]);
    setError(null);
    // Call parent onClose
    onClose();
  };

  // Handle completion of all comparisons
  const handleCompletion = () => {
    console.log('TrackComparisonModal: handleCompletion called');
    // Call the onComplete callback if provided
    if (onComplete && !hasCalledComplete) {
      console.log('TrackComparisonModal: Calling onComplete callback');
      // Mark that we've called onComplete to prevent multiple calls
      setHasCalledComplete(true);
      onComplete();
    } else {
      // If no callback provided, just close the modal
      console.log('TrackComparisonModal: No onComplete callback, closing modal');
      handleClose();
    }
  };

  // Don't render anything until we're ready and should be visible
  if (!isOpen || (!visibleWhenReady && contentReady) || (!contentReady)) return null;

  // Show message when no tracks are available for comparison
  if (noTracksAvailable) {
    return (
      <div className={`${embedded ? 'embedded-comparison' : 'modal-overlay comparison-overlay'} ${contentReady ? 'ready' : ''} ${!visibleWhenReady ? 'prefetching' : ''}`}>
        {!embedded && <button className="close-button" onClick={handleClose}>×</button>}
        <div className="thank-you-container">
          <p>Thank you for your review!</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`${embedded ? 'embedded-comparison' : 'modal-overlay comparison-overlay'} ${contentReady ? 'ready' : ''} ${!visibleWhenReady ? 'prefetching' : ''}`}>
        {!embedded && <button className="close-button" onClick={handleClose}>×</button>}
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Show message when there are no comparison tracks (but not due to an error)
  if (comparisonTracks.length === 0) {
    return (
      <div className={`${embedded ? 'embedded-comparison' : 'modal-overlay comparison-overlay'} ${contentReady ? 'ready' : ''} ${!visibleWhenReady ? 'prefetching' : ''}`}>
        {!embedded && <button className="close-button" onClick={handleClose}>×</button>}
        <div className="thank-you-container">
          <p>Thank you for your review!</p>
        </div>
      </div>
    );
  }

  const challengerTrack = comparisonTracks[currentTrackIndex];

  // Show thank you message when all comparisons are completed
  if (allComparisonsCompleted && embedded) {
    return (
      <div className={`embedded-comparison ${contentReady ? 'ready' : ''} ${!visibleWhenReady ? 'prefetching' : ''}`}>
        <div className="thank-you-container">
          <p>Thank you for your review!</p>
        </div>
      </div>
    );
  }

  const handleTrackSelect = (selectedTrack: Track) => {
    if (currentTrackIndex >= comparisonTracks.length - 1) {
      // This is the last comparison, mark as completed
      setAllComparisonsCompleted(true);
      
      // If embedded, we just show the thank you message
      if (embedded) {
        // No need to explicitly call onComparisonComplete here since
        // it will be triggered by the useEffect when allComparisonsCompleted changes
        return;
      }
      
      // All comparisons are done
      handleCompletion();
      return;
    }
    
    // Move to the next comparison
    setCurrentTrackIndex(prevIndex => prevIndex + 1);
  };

  return (
    <div className={`${embedded ? 'embedded-comparison' : 'modal-overlay comparison-overlay'} ${contentReady ? 'ready' : ''} ${!visibleWhenReady ? 'prefetching' : ''}`}>
      {!embedded && <button className="close-button" onClick={handleClose}>×</button>}
      
      <div className={embedded ? 'embedded-comparison-content' : 'comparison-modal-content'}>
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