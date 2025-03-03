import React, { useState, useEffect, useRef, useCallback } from 'react';
import { spotifyApi, reviewApi } from '../api/apiClient';
import TrackDetailsModal from './TrackDetailsModal';
import TrackRankingModal from './TrackRankingModal';
import { FiRefreshCw, FiFilter, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import './TopTracks.css';

interface Track {
  albumImageUrl: string;
  albumName: string;
  artistName: string;
  trackName: string;
  spotifyId: string;
}

// Interface for review data
interface TrackReview {
  id: string;
  userId: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number;
  ranking: number;
  createdAt: number;
}

// Interface for filter options
interface FilterOptions {
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  limit: number;
  offset: number;
}

const TopTracks: React.FC = () => {
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [selectedTrackReview, setSelectedTrackReview] = useState<TrackReview | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: 'medium_term',
    limit: 10,
    offset: 0
  });
  // Add a state to store pre-fetched reviews
  const [trackReviews, setTrackReviews] = useState<Record<string, TrackReview | null>>({});
  
  // Reference to the observer and the loading element
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreTracks();
      }
    }, { threshold: 0.5 });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const fetchTopTracks = async (isInitialLoad = true) => {
    if (isInitialLoad) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }
    
    try {
      console.log('Fetching top tracks with filters:', filters);
      
      // Make a direct copy of the filters to ensure we're passing the correct values
      const apiParams = {
        timeRange: filters.timeRange,
        limit: filters.limit,
        offset: filters.offset
      };
      
      console.log('API params:', apiParams);
      
      const response = await spotifyApi.getTopItems('tracks', apiParams);
      
      console.log('API response received:', response);
      
      // Transform the response to match our Track interface
      const tracks: Track[] = response.items.map((item: any) => ({
        spotifyId: item.id,
        trackName: item.name,
        artistName: item.artists[0].name,
        albumName: item.album.name,
        albumImageUrl: item.album.images[0]?.url || 'https://via.placeholder.com/300'
      }));
      
      // Update state based on whether this is an initial load or loading more
      if (isInitialLoad) {
        setTopTracks(tracks);
      } else {
        setTopTracks(prevTracks => [...prevTracks, ...tracks]);
      }
      
      // Check if there are more tracks to load
      setHasMore(response.next !== null);
      
      // Pre-fetch reviews for all tracks in this batch
      if (tracks.length > 0) {
        const trackIds = tracks.map(track => track.spotifyId);
        try {
          const batchReviews = await reviewApi.getTrackReviewsBatch(trackIds);
          setTrackReviews(prevReviews => ({
            ...prevReviews,
            ...batchReviews
          }));
        } catch (reviewError) {
          console.error('Failed to fetch reviews in batch:', reviewError);
          // Continue even if review fetch fails
        }
      }
    } catch (error) {
      console.error('Failed to fetch top tracks:', error);
      setError('Failed to load tracks. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more tracks when user scrolls to bottom
  const loadMoreTracks = () => {
    if (loading || loadingMore || !hasMore) return;
    
    setFilters(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  // Fetch top tracks when component mounts or filters change
  useEffect(() => {
    // If offset is 0, it's an initial load (either first load or filter change)
    // Otherwise, it's a "load more" action
    const isInitialLoad = filters.offset === 0;
    fetchTopTracks(isInitialLoad);
  }, [filters]);

  // Reset tracks when time range or limit changes
  useEffect(() => {
    // This effect will run when timeRange or limit changes
    // We don't need to do anything here as the filters effect will handle it
    // Just making it explicit that we're watching these values
  }, [filters.timeRange, filters.limit]);

  const handleTrackClick = async (track: Track) => {
    setSelectedTrack(track);
    
    // Check if we already have the review in our pre-fetched data
    if (trackReviews[track.spotifyId] !== undefined) {
      setSelectedTrackReview(trackReviews[track.spotifyId]);
      setIsDetailsModalOpen(true);
      return;
    }
    
    // If not, fetch it individually
    setIsLoadingReview(true);
    setSelectedTrackReview(null);
    
    try {
      // Fetch the review for this track
      const reviews = await reviewApi.getTrackReviews(track.spotifyId);
      
      // If the user has reviewed this track, set the review
      if (reviews && reviews.length > 0) {
        setSelectedTrackReview(reviews[0]);
        
        // Also update our cache
        setTrackReviews(prevReviews => ({
          ...prevReviews,
          [track.spotifyId]: reviews[0]
        }));
      }
    } catch (err) {
      console.error('Failed to fetch track review:', err);
      // Continue showing the modal even if review fetch fails
    } finally {
      setIsLoadingReview(false);
      setIsDetailsModalOpen(true);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
  };

  const handleReview = () => {
    setIsDetailsModalOpen(false);
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = async () => {
    setIsReviewModalOpen(false);
    
    // After a review is added or updated, refresh the reviews
    if (selectedTrack) {
      try {
        const reviews = await reviewApi.getTrackReviews(selectedTrack.spotifyId);
        
        if (reviews && reviews.length > 0) {
          setSelectedTrackReview(reviews[0]);
          
          // Update our cache
          setTrackReviews(prevReviews => ({
            ...prevReviews,
            [selectedTrack.spotifyId]: reviews[0]
          }));
        }
      } catch (err) {
        console.error('Failed to refresh track review:', err);
      }
    }
  };

  const handleFilterChange = (name: keyof FilterOptions, value: any) => {
    console.log(`Changing filter ${name} to:`, value);
    
    // Reset offset to 0 when changing time range or limit to avoid confusion
    if (name === 'timeRange' || name === 'limit') {
      setFilters(prev => ({
        ...prev,
        [name]: value,
        offset: 0
      }));
      // Reset hasMore when changing filters
      setHasMore(true);
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const timeRangeOptions = [
    { value: 'short_term', label: 'Last 4 Weeks' },
    { value: 'medium_term', label: 'Last 6 Months' },
    { value: 'long_term', label: 'Last Year' }
  ];

  const limitOptions = [5, 10, 20, 50];

  return (
    <div className="top-tracks-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
        </div>
        <div className="sidebar-content">
          <h3>Filter Options</h3>
          
          <div className="filter-section">
            <label>Time Range</label>
            <div className="filter-options">
              {timeRangeOptions.map(option => (
                <button
                  key={option.value}
                  className={`filter-button ${filters.timeRange === option.value ? 'active' : ''}`}
                  onClick={() => handleFilterChange('timeRange', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="filter-section">
            <label>Number of Tracks Per Page</label>
            <div className="filter-options">
              {limitOptions.map(limit => (
                <button
                  key={limit}
                  className={`filter-button ${filters.limit === limit ? 'active' : ''}`}
                  onClick={() => handleFilterChange('limit', limit)}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>
          
          <div className="filter-section">
            <label>Page</label>
            <div className="offset-controls">
              <button 
                className="offset-button"
                disabled={filters.offset === 0}
                onClick={() => handleFilterChange('offset', Math.max(0, filters.offset - filters.limit))}
              >
                Previous
              </button>
              <span className="offset-display">
                {filters.offset} - {filters.offset + filters.limit}
              </span>
              <button 
                className="offset-button"
                onClick={() => handleFilterChange('offset', filters.offset + filters.limit)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="top-tracks">
        <div className="header">
          <h2>Your Top Tracks</h2>
          <div className="header-buttons">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="filter-toggle-button"
              title="Toggle filter options"
            >
              <FiFilter className="button-icon" />
              Filters
            </button>
            <button 
              onClick={() => {
                setFilters(prev => ({ ...prev, offset: 0 }));
                setHasMore(true);
              }}
              disabled={loading}
              className="refresh-button"
              title="Refresh your top tracks"
            >
              <FiRefreshCw className="button-icon" />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading && topTracks.length === 0 ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your top tracks...</p>
          </div>
        ) : topTracks.length === 0 ? (
          <div className="no-tracks">
            <p>We couldn't find any top tracks for you. Try listening to more music on Spotify!</p>
          </div>
        ) : (
          <div className="tracks-list">
            {topTracks.map((track, index) => (
              <div 
                key={`${track.spotifyId}-${index}`} 
                className="track-item"
                onClick={() => handleTrackClick(track)}
              >
                <div className="track-card-container">
                  <div className="album-cover-container">
                    <div className="album-cover">
                      <img 
                        src={track.albumImageUrl} 
                        alt={`${track.albumName} by ${track.artistName}`}
                      />
                    </div>
                    <div className="rank-badge">
                      <span>
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                  
                  <div className="track-info">
                    <h3 className="track-name">{track.trackName}</h3>
                    <p className="artist-name">{track.artistName}</p>
                    <p className="album-name">{track.albumName}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator at the bottom */}
            {!loading && (
              <div 
                ref={loadingElementRef} 
                className="loading-more-container"
              >
                {loadingMore && (
                  <div className="loading-spinner-small"></div>
                )}
                {!hasMore && topTracks.length > 0 && (
                  <p className="end-message">You've reached the end of your top tracks!</p>
                )}
              </div>
            )}
          </div>
        )}

        {selectedTrack && (
          <>
            <TrackDetailsModal
              isOpen={isDetailsModalOpen}
              onClose={handleCloseDetailsModal}
              track={selectedTrack}
              onReview={handleReview}
              isLoading={isLoadingReview}
              opinion={selectedTrackReview?.opinion}
              description={selectedTrackReview?.description}
              rating={selectedTrackReview?.rating}
              reviewId={selectedTrackReview?.id}
              onReviewDeleted={fetchTopTracks}
              onReReview={handleReview}
            />
            <TrackRankingModal
              isOpen={isReviewModalOpen}
              onClose={handleCloseReviewModal}
              track={selectedTrack}
              existingReviewId={selectedTrackReview?.id}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TopTracks; 