import React, { useState, useEffect } from 'react';
import './TrackComparisonModal.css';
import { reviewApi, spotifyApi } from '../api/apiClient';

interface Track {
  albumImageUrl: string;
  albumName: string;
  artistName: string;
  trackName: string;
  spotifyId: string;
  ranking?: number; // Add ranking property for binary search
}

interface ReviewWithTrack extends Track {
  ranking: number;
  reviewId: string;
}

interface TrackComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrack: Track;
  onComplete?: () => void; // Optional callback for when all comparisons are done
  embedded?: boolean; // Whether this modal is embedded within another component
  onComparisonComplete?: (finalRanking?: number) => void; // Called when comparisons are complete with final ranking
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
  // State for binary search
  const [low, setLow] = useState<number>(0);
  const [high, setHigh] = useState<number>(0);
  const [mid, setMid] = useState<number>(0);
  const [finalRanking, setFinalRanking] = useState<number | null>(null);
  
  // State for all tracks in the opinion bucket, sorted by ranking
  const [allReviewedTracks, setAllReviewedTracks] = useState<ReviewWithTrack[]>([]);
  
  // Current comparison track (will be the mid point in binary search)
  const [currentComparisonTrack, setCurrentComparisonTrack] = useState<Track | null>(null);
  
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
      if (noTracksAvailable || allComparisonsCompleted) {
        console.log('TrackComparisonModal: Notifying comparison completion with ranking:', finalRanking);
        onComparisonComplete(finalRanking !== null ? finalRanking : undefined);
      }
    }
  }, [contentReady, noTracksAvailable, allComparisonsCompleted, finalRanking, onComparisonComplete]);

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
      setHasCalledComplete(false);
      setNoTracksAvailable(false);
      setAllComparisonsCompleted(false);
      setContentReady(false); // Content not ready yet
      setLoading(true); // Start loading
      setFinalRanking(null); // Reset final ranking
      
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

  // Update mid point when low or high changes (binary search)
  useEffect(() => {
    if (allReviewedTracks.length > 0) {
      const newMid = Math.floor((low + high) / 2);
      setMid(newMid);
      
      // Set the current comparison track to the track at the mid point
      if (newMid >= 0 && newMid < allReviewedTracks.length) {
        setCurrentComparisonTrack(allReviewedTracks[newMid]);
      }
    }
  }, [low, high, allReviewedTracks]);

  // Function to fetch user's reviewed tracks and set up binary search
  const fetchUserReviewedTracks = async () => {
    try {
      console.log('TrackComparisonModal: Fetching user reviews for binary search');
      // Get user reviews from the backend filtered by opinion
      const userReviews = await reviewApi.getUserReviews([selectedOpinion]);
      console.log('TrackComparisonModal: Received reviews count:', userReviews.length);
      
      // If no reviews, show message and exit early
      if (userReviews.length === 0) {
        console.log('TrackComparisonModal: No tracks available for comparison');
        setNoTracksAvailable(true);
        setFinalRanking(1); // First track gets ranking 1
        setLoading(false);
        setContentReady(true);
        setAllComparisonsCompleted(true);
        return;
      }
      
      // Filter out the current track being reviewed if it's in the user's reviews
      const filteredReviews = userReviews.filter(review => 
        review.spotifyTrackId !== initialTrack.spotifyId
      );
      
      if (filteredReviews.length === 0) {
        // If no reviewed tracks after filtering, just show a message
        console.log('TrackComparisonModal: No tracks available for comparison after filtering');
        setNoTracksAvailable(true);
        setFinalRanking(1); // First track gets ranking 1
        setLoading(false);
        setContentReady(true);
        setAllComparisonsCompleted(true);
        return;
      }
      
      // Extract all track IDs from the filtered reviews
      const trackIds = filteredReviews.map(review => review.spotifyTrackId);
      
      // Create a map to store track data
      const tracksDataMap: Record<string, any> = {};
      
      try {
        // Fetch tracks in batches of 50 (Spotify API limit)
        const batchSize = 50;
        const trackBatches = [];
        
        for (let i = 0; i < trackIds.length; i += batchSize) {
          trackBatches.push(trackIds.slice(i, i + batchSize));
        }
        
        // Fetch all batches in parallel
        const batchResults = await Promise.all(
          trackBatches.map(batch => spotifyApi.getTracksBatch(batch))
        );
        
        // Combine all batch results
        const allTracks = batchResults.flatMap(result => result.tracks);
        
        // Create a map of track ID to track data for easy lookup
        allTracks.forEach(track => {
          tracksDataMap[track.id] = track;
        });
      } catch (batchError) {
        console.error('Failed to fetch tracks in batch:', batchError);
        // Fall back to individual fetches if batch fails
        for (const trackId of trackIds) {
          try {
            const trackData = await spotifyApi.getTrack(trackId);
            tracksDataMap[trackId] = trackData;
          } catch (trackError) {
            console.error(`Failed to fetch track ${trackId}:`, trackError);
          }
        }
      }
      
      // Create an array to hold tracks with details
      const reviewedTracks: ReviewWithTrack[] = [];
      
      // Map the reviews to tracks with details
      for (const review of filteredReviews) {
        const trackData = tracksDataMap[review.spotifyTrackId];
        
        if (trackData) {
          reviewedTracks.push({
            albumImageUrl: trackData.album.images[0]?.url || '',
            albumName: trackData.album.name,
            artistName: trackData.artists[0].name,
            trackName: trackData.name,
            spotifyId: trackData.id,
            ranking: review.ranking,
            reviewId: review.id
          });
        }
      }
      
      if (reviewedTracks.length === 0) {
        // If no reviewed tracks after fetching data, just show a message
        console.log('TrackComparisonModal: No tracks available for comparison after fetching data');
        setNoTracksAvailable(true);
        setFinalRanking(1); // First track gets ranking 1
        setLoading(false);
        setContentReady(true);
        setAllComparisonsCompleted(true);
        return;
      }
      
      // Sort tracks by ranking (lowest to highest)
      const sortedTracks = [...reviewedTracks].sort((a, b) => a.ranking - b.ranking);
      setAllReviewedTracks(sortedTracks);
      
      // If there's only one track, we need a special comparison
      if (sortedTracks.length === 1) {
        console.log('TrackComparisonModal: Only one track for comparison, setting up direct comparison');
        setLow(0);
        setHigh(0);
        setMid(0);
        setCurrentComparisonTrack(sortedTracks[0]);
      } else {
        // Initialize binary search pointers
        setLow(0); // Start at the highest ranked track (lowest index)
        setHigh(sortedTracks.length - 1); // End at the lowest ranked track (highest index)
        
        // Set initial mid point
        const initialMid = Math.floor((0 + (sortedTracks.length - 1)) / 2);
        setMid(initialMid);
        
        // Set initial comparison track
        setCurrentComparisonTrack(sortedTracks[initialMid]);
      }
      
      console.log('TrackComparisonModal: Binary search initialized with', sortedTracks.length, 'tracks');
      
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

  // Handle track selection for binary search
  const handleTrackSelect = (selectedTrack: Track, isInitialTrack: boolean) => {
    // Special case for single track comparison
    if (allReviewedTracks.length === 1) {
      let newRanking: number;
      
      if (isInitialTrack) {
        // User thinks initial track is better than the only track
        // Insert it before that track
        newRanking = allReviewedTracks[0].ranking;
      } else {
        // User thinks the only track is better than initial track
        // Insert initial track after that track
        newRanking = allReviewedTracks[0].ranking + 1;
      }
      
      console.log('TrackComparisonModal: Single track comparison complete, final ranking:', newRanking);
      setFinalRanking(newRanking);
      setAllComparisonsCompleted(true);
      return;
    }
    
    // If binary search is complete (low >= high - 1), we've found our insertion point
    if (low >= high - 1) {
      // Determine final ranking based on the last comparison
      let newRanking: number;
      
      // Special case: if low is 0 and the user selected the initial track as better,
      // this means the track should be at the very top (rank 1)
      if (low === 0 && isInitialTrack) {
        // User thinks initial track is better than the highest ranked track
        // It should get the top ranking (1)
        newRanking = 1;
        
        console.log('TrackComparisonModal: Track rated better than all others, setting to top rank (1)');
      } else if (isInitialTrack) {
        // User thinks initial track is better than the high track
        // Insert it before the high track
        newRanking = allReviewedTracks[high].ranking;
      } else {
        // User thinks high track is better than initial track
        // Insert initial track after the high track
        newRanking = allReviewedTracks[high].ranking + 1;
      }
      
      console.log('TrackComparisonModal: Binary search complete, final ranking:', newRanking);
      setFinalRanking(newRanking);
      setAllComparisonsCompleted(true);
      
      return;
    }
    
    // Update pointers based on selection
    if (isInitialTrack) {
      // User thinks initial track is better than mid track
      // Search in the lower half (better rankings)
      setHigh(mid);
    } else {
      // User thinks mid track is better than initial track
      // Search in the upper half (worse rankings)
      setLow(mid + 1);
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
  if (allReviewedTracks.length === 0) {
    return (
      <div className={`${embedded ? 'embedded-comparison' : 'modal-overlay comparison-overlay'} ${contentReady ? 'ready' : ''} ${!visibleWhenReady ? 'prefetching' : ''}`}>
        {!embedded && <button className="close-button" onClick={handleClose}>×</button>}
        <div className="thank-you-container">
          <p>Thank you for your review!</p>
        </div>
      </div>
    );
  }

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

  // If no current comparison track, show loading
  if (!currentComparisonTrack) {
    return (
      <div className={`${embedded ? 'embedded-comparison' : 'modal-overlay comparison-overlay'} ${contentReady ? 'ready' : ''} ${!visibleWhenReady ? 'prefetching' : ''}`}>
        {!embedded && <button className="close-button" onClick={handleClose}>×</button>}
        <div className="loading-container">
          <p>Loading comparison...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? 'embedded-comparison' : 'modal-overlay comparison-overlay'} ${contentReady ? 'ready' : ''} ${!visibleWhenReady ? 'prefetching' : ''}`}>
      {!embedded && <button className="close-button" onClick={handleClose}>×</button>}
      
      <div className={embedded ? 'embedded-comparison-content' : 'comparison-modal-content'}>
        <h2 className="comparison-title">Please select which track you believe is better</h2>
        
        <div className="tracks-container">
          <div 
            className="track-option"
            onClick={() => handleTrackSelect(initialTrack, true)}
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
            onClick={() => handleTrackSelect(currentComparisonTrack, false)}
          >
            <div className="track-card">
              <div className="track-card-inner">
                <div className="album-cover">
                  <img
                    src={currentComparisonTrack.albumImageUrl}
                    alt={`${currentComparisonTrack.albumName} by ${currentComparisonTrack.artistName}`}
                  />
                </div>
                <div className="track-info">
                  <div>
                    <h3 className="track-name">{currentComparisonTrack.trackName}</h3>
                    <p className="artist-name">{currentComparisonTrack.artistName}</p>
                    <p className="album-name">{currentComparisonTrack.albumName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="comparison-progress">
          <div className="progress-label">Finding the perfect spot for your review...</div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ 
                width: `${Math.round(((high - low) === 0 ? 100 : (1 - (high - low) / (allReviewedTracks.length - 1)) * 100))}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackComparisonModal; 