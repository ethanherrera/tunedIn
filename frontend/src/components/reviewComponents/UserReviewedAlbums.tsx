import React, { useState, useEffect } from 'react';
import { albumReviewApi, spotifyApi } from '../../api/apiClient';
import { FiRefreshCw, FiShuffle } from 'react-icons/fi';
import GenreSearch from './GenreSearch';
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
  const [isReReviewModalOpen, setIsReReviewModalOpen] = useState<boolean>(false);
  const [isRandomReviewModalOpen, setIsRandomReviewModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
  const [selectedGenre, setSelectedGenre] = useState<{ id: number; name: string } | null>(null);
  const [allReviews, setAllReviews] = useState<ReviewWithAlbum[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithAlbum[]>([]);

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
      
      setAllReviews(reviewsWithAlbums);
      setFilteredReviews(reviewsWithAlbums);
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
    // Don't open the modal if clicking on action buttons
    if (e && (e.target as HTMLElement).closest('.review-actions')) {
      return;
    }
    
    setSelectedReview(review);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    // Refresh the reviews list when the modal is closed
    fetchUserReviews();
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

  const handleRerankRandomAlbum = () => {
    if (reviews.length === 0) {
      setError('No albums available to rerank. Please review some albums first.');
      return;
    }
    
    // Select a random album from the reviews
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

  const handleReReviewFromList = (review: ReviewWithAlbum, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the details modal
    setSelectedReview(review);
    setIsReReviewModalOpen(true);
  };

  const handleDeleteReviewFromList = async (review: ReviewWithAlbum, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the details modal
    
    if (window.confirm('Are you sure you want to delete this review?')) {
      // Set deleting state for this specific review
      setIsDeleting(prev => ({ ...prev, [review.id]: true }));
      
      try {
        await albumReviewApi.deleteAlbumReview(review.id);
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
    <div className="user-reviewed-albums">
      <div className="header">
        <h2>Your Reviewed Albums</h2>
        <div className="header-buttons">
          <GenreSearch 
            onGenreSelect={handleGenreSelect}
            buttonText="Filter by Genre"
            className="genre-filter"
            reviews={allReviews}
          />
          <button 
            onClick={handleRerankRandomAlbum}
            disabled={loading || reviews.length === 0}
            className="rerank-button"
            title="Rerank a random album from your list"
          >
            <FiShuffle className="button-icon" />
            Rerank Random Album
          </button>
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
          <p>Loading your reviewed albums...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="no-reviews">
          {selectedGenre ? (
            <p>No reviews found with the genre "{selectedGenre.name}". Try another genre or clear the filter.</p>
          ) : (
            <p>You haven't reviewed any albums yet. Search for albums to review them!</p>
          )}
        </div>
      ) : (
        <div className="reviews-list">
          {filteredReviews.map((review) => (
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
                
                {/* Add review action buttons */}
                <div className="review-actions">
                  <button 
                    className="album-list-delete-button"
                    onClick={(e) => handleDeleteReviewFromList(review, e)}
                    disabled={isDeleting[review.id]}
                  >
                    {isDeleting[review.id] ? 'Deleting...' : 'Delete Review'}
                  </button>
                  <button 
                    className="album-list-rereview-button"
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
        />
      )}
    </div>
  );
};

export default UserReviewedAlbums; 