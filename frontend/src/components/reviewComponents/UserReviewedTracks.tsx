import React, { useState, useEffect } from 'react';
import { reviewApi, spotifyApi } from '../../api/apiClient';
import TrackCardSearchResult from '../searchComponents/TrackCardSearchResult';
import TrackDetailsModal from '../trackComponents/TrackDetailsModal';
import TrackRankingModal from '../trackComponents/TrackRankingModal';
import { FiRefreshCw, FiShuffle } from 'react-icons/fi';
import GenreSearch from './GenreSearch';
import './UserReviewedTracks.css';

// Interface for the review data with track information
interface ReviewWithTrack {
  id: string;
  userId?: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number;
  ranking: number;
  createdAt: number;
  rank?: number; // For display purposes
  totalReviews?: number; // For display purposes
  genres?: string[]; // Track genres
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
  const [isRandomReviewModalOpen, setIsRandomReviewModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
  const [selectedGenre, setSelectedGenre] = useState<{ id: number; name: string } | null>(null);
  const [allReviews, setAllReviews] = useState<ReviewWithTrack[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithTrack[]>([]);

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
      
      // If there are no reviews, return early
      if (userReviews.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }
      
      // Extract all track IDs from the reviews
      const trackIds = userReviews.map(review => review.spotifyTrackId);
      
      // Use the batch API to fetch all tracks at once
      let tracksData: Record<string, any> = {};
      let artistsData: Record<string, any> = {};
      
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
        tracksData = allTracks.reduce((acc, track) => {
          acc[track.id] = track;
          return acc;
        }, {} as Record<string, any>);
        
        // Collect all artist IDs to fetch their genres
        const artistIds = new Set<string>();
        allTracks.forEach(track => {
          track.artists.forEach(artist => {
            artistIds.add(artist.id);
          });
        });
        
        // Fetch artist data to get genres (in batches of 50)
        const artistIdArray = Array.from(artistIds);
        const artistBatches = [];
        
        for (let i = 0; i < artistIdArray.length; i += batchSize) {
          artistBatches.push(artistIdArray.slice(i, i + batchSize));
        }
        
        // Fetch artist data sequentially to avoid rate limiting
        for (const batch of artistBatches) {
          for (const artistId of batch) {
            try {
              const artistData = await spotifyApi.getArtist(artistId);
              artistsData[artistId] = artistData;
            } catch (error) {
              console.error(`Failed to fetch artist ${artistId}:`, error);
            }
          }
        }
        
      } catch (batchError) {
        console.error('Failed to fetch tracks in batch:', batchError);
        // Fall back to individual fetches if batch fails
        for (const review of userReviews) {
          try {
            const trackData = await spotifyApi.getTrack(review.spotifyTrackId);
            tracksData[review.spotifyTrackId] = trackData;
            
            // Fetch artist data for genres
            for (const artist of trackData.artists) {
              try {
                const artistData = await spotifyApi.getArtist(artist.id);
                artistsData[artist.id] = artistData;
              } catch (error) {
                console.error(`Failed to fetch artist ${artist.id}:`, error);
              }
            }
          } catch (trackError) {
            console.error(`Failed to fetch track ${review.spotifyTrackId}:`, trackError);
          }
        }
      }
      
      // Create an array to hold reviews with track details
      const reviewsWithTracks: ReviewWithTrack[] = userReviews.map(review => {
        const trackData = tracksData[review.spotifyTrackId];
        
        if (trackData) {
          // Collect genres from all artists of the track
          const genres = new Set<string>();
          trackData.artists.forEach((artist: any) => {
            const artistData = artistsData[artist.id];
            if (artistData && artistData.genres) {
              artistData.genres.forEach((genre: string) => genres.add(genre));
            }
          });
          
          return {
            ...review,
            genres: Array.from(genres),
            track: {
              albumImageUrl: trackData.album.images[0]?.url || 'https://via.placeholder.com/300',
              albumName: trackData.album.name,
              artistName: trackData.artists[0].name,
              trackName: trackData.name,
              spotifyId: trackData.id
            }
          };
        } else {
          // Fallback for tracks that couldn't be fetched
          return {
            ...review,
            genres: [],
            track: {
              albumImageUrl: 'https://via.placeholder.com/300',
              albumName: 'Unknown Album',
              artistName: 'Unknown Artist',
              trackName: 'Unknown Track',
              spotifyId: review.spotifyTrackId
            }
          };
        }
      });
      
      // Sort reviews by opinion buckets (LIKED first, then NEUTRAL, then DISLIKE)
      // Within each bucket, sort by ranking (lowest to highest)
      reviewsWithTracks.sort((a, b) => {
        // First sort by opinion buckets
        const opinionOrder = { 'LIKED': 1, 'NEUTRAL': 2, 'DISLIKE': 3 };
        const opinionComparison = opinionOrder[a.opinion] - opinionOrder[b.opinion];
        
        if (opinionComparison !== 0) {
          return opinionComparison; // Different opinion buckets
        }
        
        // Within the same opinion bucket, sort by ranking (lowest to highest)
        return a.ranking - b.ranking;
      });
      
      // Update totalReviews counts for each opinion bucket
      const likedReviews = reviewsWithTracks.filter(r => r.opinion === 'LIKED');
      const neutralReviews = reviewsWithTracks.filter(r => r.opinion === 'NEUTRAL');
      const dislikeReviews = reviewsWithTracks.filter(r => r.opinion === 'DISLIKE');
      
      // Update the display information for each review
      reviewsWithTracks.forEach((review, index) => {
        // Set the total count to the total number of reviews
        review.totalReviews = reviewsWithTracks.length;
        // Set the rank to the overall position in the list (1-based index)
        review.rank = index + 1;
      });
      
      setAllReviews(reviewsWithTracks);
      setFilteredReviews(reviewsWithTracks);
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
    // Don't open the modal if clicking on action buttons
    if (e && (e.target as HTMLElement).closest('.review-actions')) {
      return;
    }
    
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

  const handleRerankRandomTrack = () => {
    if (reviews.length === 0) {
      setError('No tracks available to rerank. Please review some tracks first.');
      return;
    }
    
    // Select a random track from the reviews
    const randomIndex = Math.floor(Math.random() * reviews.length);
    const randomReview = reviews[randomIndex];
    
    setSelectedReview(randomReview);
    setIsRandomReviewModalOpen(true);
  };

  const handleCloseRandomReviewModal = () => {
    setIsRandomReviewModalOpen(false);
    // Refresh the reviews list after re-reviewing
    fetchUserReviews();
  };

  const handleReReviewFromList = (review: ReviewWithTrack, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the details modal
    setSelectedReview(review);
    setIsReReviewModalOpen(true);
  };

  const handleDeleteReviewFromList = async (review: ReviewWithTrack, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the details modal
    
    if (window.confirm('Are you sure you want to delete this review?')) {
      // Set deleting state for this specific review
      setIsDeleting(prev => ({ ...prev, [review.id]: true }));
      
      try {
        await reviewApi.deleteReview(review.id);
        // Refresh the reviews list after deletion
        fetchUserReviews();
      } catch (error) {
        console.error('Failed to delete review:', error);
        alert('Failed to delete review. Please try again.');
      } finally {
        // Clear deleting state for this review
        setIsDeleting(prev => ({ ...prev, [review.id]: false }));
      }
    }
  };

  const handleGenreSelect = (genre: { id: number; name: string }) => {
    setSelectedGenre(genre);
    console.log('Selected genre in parent component:', genre);
    
    // Filter reviews by the selected genre
    if (allReviews.length > 0) {
      const filtered = allReviews.filter(review => 
        review.genres && review.genres.some(g => 
          g.toLowerCase() === genre.name.toLowerCase() || 
          g.toLowerCase().includes(genre.name.toLowerCase())
        )
      );
      setFilteredReviews(filtered);
    }
  };

  const clearGenreFilter = () => {
    setSelectedGenre(null);
    setFilteredReviews(allReviews);
    setReviews(allReviews);
  };

  return (
    <div className="user-reviewed-tracks">
      <div className="header">
        <h2>Your Reviewed Tracks</h2>
        <div className="header-buttons">
          <GenreSearch 
            onGenreSelect={handleGenreSelect}
            buttonText="Filter by Genre"
            className="genre-filter"
            reviews={allReviews}
          />
          <button 
            onClick={handleRerankRandomTrack}
            disabled={loading || reviews.length === 0}
            className="rerank-button"
            title="Rerank a random track from your list"
          >
            <FiShuffle className="button-icon" />
            Rerank Random Track
          </button>
          <button 
            onClick={fetchUserReviews}
            disabled={loading}
            className="refresh-button"
            title="Refresh your reviewed tracks"
          >
            <FiRefreshCw className="button-icon" />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {selectedGenre && (
        <div className="active-filter">
          <p>Filtering by genre: <strong>{selectedGenre.name}</strong></p>
          <button 
            className="clear-filter-button"
            onClick={clearGenreFilter}
          >
            Clear Filter
          </button>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your reviewed tracks...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="no-reviews">
          {selectedGenre ? (
            <p>No reviews found with the genre "{selectedGenre.name}". Try another genre or clear the filter.</p>
          ) : (
            <p>You haven't reviewed any tracks yet. Search for tracks to review them!</p>
          )}
        </div>
      ) : (
        <div className="reviews-list">
          {filteredReviews.map((review) => (
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
                      <span className={`opinion-${review.opinion.toLowerCase()}`}>
                        #{review.rank}
                      </span>
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
                      review.opinion === 'DISLIKE' ? '#e74c3c' :  // Red for dislike
                      review.opinion === 'NEUTRAL' ? '#f39c12' :  // Yellow/orange for neutral
                      '#2ecc71'                                   // Green for liked
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
                
                {/* Add review action buttons */}
                <div className="review-actions">
                  <button 
                    className="track-list-delete-button"
                    onClick={(e) => handleDeleteReviewFromList(review, e)}
                    disabled={isDeleting[review.id]}
                  >
                    {isDeleting[review.id] ? 'Deleting...' : 'Delete Review'}
                  </button>
                  <button 
                    className="track-list-rereview-button"
                    onClick={(e) => handleReReviewFromList(review, e)}
                  >
                    Re-review
                  </button>
                </div>
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
          isOpen={isReReviewModalOpen || isRandomReviewModalOpen}
          onClose={isReReviewModalOpen ? handleCloseReReviewModal : handleCloseRandomReviewModal}
          track={selectedReview.track}
          existingReviewId={selectedReview.id}
        />
      )}
    </div>
  );
};

export default UserReviewedTracks; 