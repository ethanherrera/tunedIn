import React, { useState, useEffect } from 'react';
import { spotifyApi, reviewApi } from '../api/apiClient';
import TrackDetailsModal from './TrackDetailsModal';
import TrackRankingModal from './TrackRankingModal';
import { FiRefreshCw } from 'react-icons/fi';
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

const TopTracks: React.FC = () => {
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [selectedTrackReview, setSelectedTrackReview] = useState<TrackReview | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(false);

  const fetchTopTracks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await spotifyApi.getTopItems('tracks', {
        timeRange: 'medium_term',
        limit: 10
      });
      
      // Transform the response to match our Track interface
      const tracks: Track[] = response.items.map((item: any) => ({
        spotifyId: item.id,
        trackName: item.name,
        artistName: item.artists[0].name,
        albumName: item.album.name,
        albumImageUrl: item.album.images[0]?.url || 'https://via.placeholder.com/300'
      }));
      
      setTopTracks(tracks);
    } catch (err) {
      console.error('Failed to fetch top tracks:', err);
      setError('Failed to load your top tracks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch top tracks when component mounts
  useEffect(() => {
    fetchTopTracks();
  }, []);

  const handleTrackClick = async (track: Track) => {
    setSelectedTrack(track);
    setIsLoadingReview(true);
    setSelectedTrackReview(null);
    
    try {
      // Fetch the review for this track
      const reviews = await reviewApi.getTrackReviews(track.spotifyId);
      
      // If the user has reviewed this track, set the review
      if (reviews && reviews.length > 0) {
        setSelectedTrackReview(reviews[0]);
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
    
    // If a track is selected, refresh its review data
    if (selectedTrack) {
      setIsLoadingReview(true);
      try {
        const reviews = await reviewApi.getTrackReviews(selectedTrack.spotifyId);
        if (reviews && reviews.length > 0) {
          setSelectedTrackReview(reviews[0]);
        } else {
          setSelectedTrackReview(null);
        }
      } catch (err) {
        console.error('Failed to refresh track review:', err);
      } finally {
        setIsLoadingReview(false);
      }
    }
  };

  return (
    <div className="top-tracks">
      <div className="header">
        <h2>Your Top Tracks</h2>
        <div className="header-buttons">
          <button 
            onClick={fetchTopTracks}
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
      
      {loading ? (
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
              key={track.spotifyId} 
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
  );
};

export default TopTracks; 