import React, { useState, useEffect } from 'react';
import { albumReviewApi, spotifyApi } from '../../api/apiClient';
import { FiRefreshCw } from 'react-icons/fi';
import AlbumDetailsModal from '../albumComponents/AlbumDetailsModal';
import './UserReviewedAlbums.css';

// Interface for the review data with album information
interface ReviewWithAlbum {
  id: string;
  userId?: string;
  spotifyAlbumId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED' | 'UNDEFINED';
  description: string;
  rating: number;
  ranking: number;
  createdAt: number;
  rank?: number; // For display purposes
  totalReviews?: number; // For display purposes
  genres?: string[]; // Album genres
  spotifyTrackIds: string[];
  album: {
    albumImageUrl: string;
    albumName: string;
    artistName: string;
    releaseDate: string;
    spotifyId: string;
    totalTracks: number;
  };
}

const UserReviewedAlbums: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewWithAlbum[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewWithAlbum | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [shouldRefreshReviews, setShouldRefreshReviews] = useState<boolean>(false);

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
      // Get the current user ID
      const userProfile = await spotifyApi.getMe();
      const userId = userProfile.id;
      
      // Fetch all album reviews for the user
      const userAlbumReviews = await albumReviewApi.getUserAlbumReviews();
      
      // If there are no reviews, return early
      if (userAlbumReviews.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }
      
      // Extract all album IDs from the reviews
      const albumIds = userAlbumReviews.map(review => review.spotifyAlbumId);
      
      // Use the batch API to fetch all albums at once
      let albumsData: Record<string, any> = {};
      
      try {
        // Fetch albums in batches of 20 (Spotify API limit)
        const batchSize = 20;
        const albumBatches = [];
        
        for (let i = 0; i < albumIds.length; i += batchSize) {
          albumBatches.push(albumIds.slice(i, i + batchSize));
        }
        
        // Fetch all batches in parallel
        const batchResults = await Promise.all(
          albumBatches.map(batch => spotifyApi.getAlbumsBatch(batch))
        );
        
        // Combine all batch results
        const allAlbums = batchResults.flatMap(result => result.albums);
        
        // Create a map of album ID to album data for easy lookup
        albumsData = allAlbums.reduce((acc, album) => {
          acc[album.id] = album;
          return acc;
        }, {} as Record<string, any>);
        
      } catch (batchError) {
        console.error('Failed to fetch albums in batch:', batchError);
        // Fall back to individual fetches if batch fails
        for (const review of userAlbumReviews) {
          try {
            const albumData = await spotifyApi.getAlbum(review.spotifyAlbumId);
            albumsData[review.spotifyAlbumId] = albumData;
          } catch (albumError) {
            console.error(`Failed to fetch album ${review.spotifyAlbumId}:`, albumError);
          }
        }
      }
      
      // Create an array to hold reviews with album details
      const reviewsWithAlbums: ReviewWithAlbum[] = userAlbumReviews.map(review => {
        const albumData = albumsData[review.spotifyAlbumId];
        
        if (albumData) {
          return {
            ...review,
            genres: albumData.genres || [],
            album: {
              albumImageUrl: albumData.images[0]?.url || 'https://via.placeholder.com/300',
              albumName: albumData.name,
              artistName: albumData.artists[0].name,
              releaseDate: albumData.release_date,
              spotifyId: albumData.id,
              totalTracks: albumData.total_tracks || 0
            }
          };
        } else {
          // Fallback for albums that couldn't be fetched
          return {
            ...review,
            genres: [],
            album: {
              albumImageUrl: 'https://via.placeholder.com/300',
              albumName: 'Unknown Album',
              artistName: 'Unknown Artist',
              releaseDate: 'Unknown',
              spotifyId: review.spotifyAlbumId,
              totalTracks: 0
            }
          };
        }
      });
      
      // Sort reviews primarily by rating (highest to lowest)
      // This will override the previous opinion-based sorting
      reviewsWithAlbums.sort((a, b) => {
        // First, put all UNDEFINED opinions at the bottom
        if (a.opinion === 'UNDEFINED' && b.opinion !== 'UNDEFINED') {
          return 1; // a goes after b
        }
        if (a.opinion !== 'UNDEFINED' && b.opinion === 'UNDEFINED') {
          return -1; // a goes before b
        }
        
        // Then sort by rating (highest to lowest)
        return b.rating - a.rating;
      });
      
      // Update the display information for each review
      reviewsWithAlbums.forEach((review, index) => {
        // Set the total count to the total number of reviews
        review.totalReviews = reviewsWithAlbums.length;
        // Set the rank to the overall position in the list (1-based index)
        review.rank = index + 1;
      });
      
      setReviews(reviewsWithAlbums);
    } catch (err) {
      console.error('Failed to fetch user album reviews:', err);
      setError('Failed to load your reviewed albums. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews when component mounts
  useEffect(() => {
    fetchUserReviews();
  }, []);

  const handleAlbumClick = (review: ReviewWithAlbum, e?: React.MouseEvent) => {
    setSelectedReview(review);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    // Only refresh the reviews list if a review was made
    if (shouldRefreshReviews) {
      fetchUserReviews();
      setShouldRefreshReviews(false);
    }
  };

  const handleReviewUpdated = () => {
    // Set the flag to refresh reviews when the modal closes
    setShouldRefreshReviews(true);
  };

  return (
    <div className="user-reviewed-albums">
      <div className="header">
        <h2>Your Reviewed Albums</h2>
        <div className="header-buttons">
          <button 
            onClick={fetchUserReviews}
            disabled={loading}
            className="refresh-button"
            title="Refresh your reviewed albums"
          >
            <FiRefreshCw className="button-icon" />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your reviewed albums...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="no-reviews">
          <p>You haven't reviewed any albums yet. Search for albums to review them!</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="review-item"
              onClick={(e) => handleAlbumClick(review, e)}
            >
              <div className="album-card-container">
                <div className="album-cover-container">
                  <div className="album-cover">
                    <img 
                      src={review.album.albumImageUrl} 
                      alt={`${review.album.albumName} by ${review.album.artistName}`}
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
                
                <div className="album-info">
                  <h3 className="album-name">{review.album.albumName}</h3>
                  <p className="artist-name">{review.album.artistName}</p>
                  <p className="release-date">Released: {review.album.releaseDate}</p>
                  <p className="track-count">{review.album.totalTracks} tracks</p>
                </div>
                
                <div 
                  className="rating-circle"
                  style={{
                    backgroundColor: 
                      review.opinion === 'DISLIKE' ? '#e74c3c' :  // Red for dislike
                      review.opinion === 'NEUTRAL' ? '#f39c12' :  // Yellow/orange for neutral
                      review.opinion === 'LIKED' ? '#2ecc71' :    // Green for liked
                      '#888888'                                   // Gray for undefined
                  }}
                >
                  {review.opinion === 'UNDEFINED' ? '~' : review.rating.toFixed(1)}
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

      {/* Album details and re-review modals would go here */}
      {selectedReview && (
        <AlbumDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          album={{
            id: selectedReview.spotifyAlbumId,
            name: selectedReview.album.albumName,
            artists: [{ 
              id: '', // We don't have the artist ID in the review data
              name: selectedReview.album.artistName 
            }],
            images: [{ 
              url: selectedReview.album.albumImageUrl 
            }],
            release_date: selectedReview.album.releaseDate,
            album_type: '', // We don't have this info in the review data
            total_tracks: selectedReview.album.totalTracks
          }}
          onReviewUpdated={handleReviewUpdated}
        />
      )}
    </div>
  );
};

export default UserReviewedAlbums; 