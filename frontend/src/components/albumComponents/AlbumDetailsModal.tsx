import React, { useState, useEffect, useRef } from 'react';
import './AlbumDetailsModal.css';
import { spotifyApi, reviewApi, albumReviewApi } from '../../api/apiClient';
import TrackDetailsModal from '../trackComponents/TrackDetailsModal';
import TrackRankingModal from '../trackComponents/TrackRankingModal';

interface Track {
  albumImageUrl: string;
  albumName: string;
  artistName: string;
  trackName: string;
  spotifyId: string;
}

interface AlbumDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: {
    id: string;
    name: string;
    artists: Array<{
      id: string;
      name: string;
    }>;
    images: Array<{
      url: string;
      height?: number;
      width?: number;
    }>;
    release_date: string;
    album_type: string;
    total_tracks: number;
  };
}

const AlbumDetailsModal: React.FC<AlbumDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  album 
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendered, setIsRendered] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isTrackDetailsModalOpen, setIsTrackDetailsModalOpen] = useState(false);
  const [isTrackRankingModalOpen, setIsTrackRankingModalOpen] = useState(false);
  const [trackReviews, setTrackReviews] = useState<Record<string, any | null>>({});
  const [albumAverageScore, setAlbumAverageScore] = useState<number | null>(null);
  const [reviewedTracksCount, setReviewedTracksCount] = useState(0);
  const [tracksNeededForScore, setTracksNeededForScore] = useState(0);
  const [albumReview, setAlbumReview] = useState<any | null>(null);
  const initialRender = useRef(true);

  // Reset states when modal opens or closes
  useEffect(() => {
    if (isOpen && album.id) {
      // Reset states for a fresh load
      setIsLoading(true);
      setTracks([]);
      setTrackReviews({});
      setAlbumAverageScore(null);
      setReviewedTracksCount(0);
      setTracksNeededForScore(0);
      setAlbumReview(null);
      
      if (initialRender.current) {
        initialRender.current = false;
        requestAnimationFrame(() => {
          setIsRendered(true);
          loadData();
        });
      } else {
        setIsRendered(true);
        loadData();
      }
    } else {
      // When modal closes, reset ALL state completely
      setIsRendered(false);
      setIsLoading(true);
      setTracks([]);
      setTrackReviews({});
      setAlbumAverageScore(null);
      setReviewedTracksCount(0);
      setTracksNeededForScore(0);
      setAlbumReview(null);
      initialRender.current = true;
    }
  }, [isOpen, album.id]);

  // Add a cleanup function to the component to reset state when unmounted
  useEffect(() => {
    return () => {
      // Reset all state when component unmounts
      setIsLoading(true);
      setTracks([]);
      setTrackReviews({});
      setAlbumAverageScore(null);
      setReviewedTracksCount(0);
      setTracksNeededForScore(0);
      setAlbumReview(null);
    };
  }, []);

  // Simplified data loading function
  const loadData = async () => {
    try {
      // Load album tracks
      const albumData = await spotifyApi.getAlbum(album.id);
      
      if (albumData && albumData.tracks && albumData.tracks.items) {
        const formattedTracks = albumData.tracks.items.map((track: { id: string; name: string; artists: Array<{ name: string }> }) => ({
          spotifyId: track.id,
          trackName: track.name,
          artistName: track.artists[0].name,
          albumName: album.name,
          albumImageUrl: album.images && album.images.length > 0 
            ? album.images[0].url 
            : 'https://via.placeholder.com/300'
        }));
        
        // Set tracks in state
        setTracks(formattedTracks);
        console.log('Tracks loaded:', formattedTracks.length);
        
        // Load track reviews if we have tracks
        if (formattedTracks.length > 0) {
          const trackIds = formattedTracks.map(track => track.spotifyId);
          const reviews = await reviewApi.getTrackReviewsBatch(trackIds);
          setTrackReviews(reviews || {});
          
          // Calculate album score
          calculateAlbumScore(formattedTracks, reviews);
        }
        
        // Load album review
        const review = await albumReviewApi.getUserAlbumReview(album.id);
        setAlbumReview(review);
        
        if (review) {
          setAlbumAverageScore(review.rating);
        }
      }
    } catch (error) {
      console.error('Error loading album data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAlbumScore = (tracksToScore: Track[], reviews: Record<string, any | null>) => {
    if (!tracksToScore.length) return;
    
    if (albumReview) return;
    
    let reviewedCount = 0;
    let totalScore = 0;
    
    tracksToScore.forEach(track => {
      const trackReview = reviews[track.spotifyId];
      if (Array.isArray(trackReview) && trackReview.length > 0 && trackReview[0].rating !== undefined) {
        reviewedCount++;
        totalScore += trackReview[0].rating;
      }
    });
    
    setReviewedTracksCount(reviewedCount);
    
    const halfTracks = Math.ceil(tracksToScore.length / 2);
    const neededTracks = Math.max(0, halfTracks - reviewedCount);
    setTracksNeededForScore(neededTracks);
    
    if (reviewedCount >= halfTracks) {
      const averageScore = totalScore / reviewedCount;
      setAlbumAverageScore(averageScore);
    } else {
      setAlbumAverageScore(null);
    }
  };

  const handleTrackClick = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrack(track);
    setIsTrackDetailsModalOpen(true);
  };

  const handleTrackModalClose = () => {
    setIsTrackDetailsModalOpen(false);
  };

  const handleReviewTrack = () => {
    setIsTrackDetailsModalOpen(false);
    setIsTrackRankingModalOpen(true);
  };

  const handleRankingModalClose = () => {
    setIsTrackRankingModalOpen(false);
    setSelectedTrack(null);
    loadData(); // Reload data to refresh reviews
  };

  if (!isOpen || !isRendered) return null;

  const albumCoverUrl = album.images && album.images.length > 0 
    ? album.images[0].url 
    : 'https://via.placeholder.com/300';

  const artistName = album.artists && album.artists.length > 0 
    ? album.artists[0].name 
    : 'Unknown Artist';

  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingColor = (rating: number): string => {
    if (rating < 4.0) return '#e74c3c';
    if (rating < 7.0) return '#f39c12';
    return '#2ecc71';
  };

  return (
    <>
      <div className="album-details-modal-overlay" onClick={onClose}>
        <div className="album-details-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="album-details-modal-close-button" onClick={onClose}>×</button>
          
          {isLoading ? (
            <div className="album-details-modal-loading-container">
              <div className="album-details-modal-loading-spinner"></div>
              <p>Loading album details...</p>
            </div>
          ) : (
            <>
              <div className="album-details-modal-content-inner">
                <div className="album-details-modal-album-wrapper">
                  <div className="album-details-modal-album-cover">
                    <img 
                      src={albumCoverUrl} 
                      alt={`${album.name} by ${artistName}`} 
                    />
                  </div>
                </div>
                
                <div className="album-details-modal-info">
                  <h2 className="album-details-modal-name">{album.name}</h2>
                  
                  <div className="album-details-modal-artist-row">
                    <p className="album-details-modal-artist">{artistName}</p>
                  </div>
                  
                  <div className="album-details-modal-details">
                    <div className="album-details-modal-details-row">
                      <div className="album-details-modal-details-left">
                        <p className="album-details-modal-type">
                          <span className="album-details-modal-label">Type:</span> 
                          <span className="album-details-modal-value">{album.album_type}</span>
                        </p>
                        <p className="album-details-modal-tracks">
                          <span className="album-details-modal-label">Tracks:</span> 
                          <span className="album-details-modal-value">{album.total_tracks}</span>
                        </p>
                        <p className="album-details-modal-release-date">
                          <span className="album-details-modal-label">Released:</span> 
                          <span className="album-details-modal-value">{formatReleaseDate(album.release_date)}</span>
                        </p>
                      </div>
                      
                      {albumAverageScore === null && tracks.length > 0 && (
                        <div className="album-details-modal-details-right">
                          <span 
                            className="album-details-modal-rating-circle"
                            style={{
                              backgroundColor: '#888888'
                            }}
                          >
                            ~
                          </span>
                          <p className="album-details-modal-score-unlock-text">
                            Rate {tracksNeededForScore} more track{tracksNeededForScore !== 1 ? 's' : ''} to unlock score
                          </p>
                        </div>
                      )}

                      {albumAverageScore !== null && albumReview && (
                        <div className="album-details-modal-details-right">
                          <span 
                            className="album-details-modal-rating-circle"
                            style={{
                              backgroundColor: albumReview.opinion === 'UNDEFINED' 
                                ? '#888888' 
                                : getRatingColor(albumAverageScore)
                            }}
                          >
                            {albumReview.opinion === 'UNDEFINED' 
                              ? '~' 
                              : albumAverageScore.toFixed(1)}
                          </span>
                          <p className="album-details-modal-score-unlock-text">
                            {albumReview.opinion === 'UNDEFINED' 
                              ? 'Review more tracks to see album score'
                              : 'Your tunedIn score'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="album-details-modal-tracks-container">
                <h3 className="album-details-modal-tracks-title">Tracks</h3>
                
                {tracks && tracks.length > 0 ? (
                  <div className="album-details-modal-tracks-list">
                    {tracks.map(track => (
                      <div 
                        key={track.spotifyId} 
                        className="album-details-modal-track-card"
                        onClick={(e) => handleTrackClick(track, e)}
                      >
                        <div className="album-details-modal-track-card-inner">
                          <div className="album-details-modal-track-cover">
                            <img
                              src={track.albumImageUrl}
                              alt={`${track.albumName} by ${track.artistName}`}
                            />
                          </div>
                          <div className="album-details-modal-track-info">
                            <h3 className="album-details-modal-track-name">{track.trackName}</h3>
                            {trackReviews[track.spotifyId] && Array.isArray(trackReviews[track.spotifyId]) && trackReviews[track.spotifyId].length > 0 ? (
                              <div 
                                className="album-details-modal-rating-circle"
                                style={{
                                  backgroundColor: getRatingColor(trackReviews[track.spotifyId][0].rating)
                                }}
                              >
                                {trackReviews[track.spotifyId][0].rating.toFixed(1)}
                              </div>
                            ) : (
                              <div 
                                className="album-details-modal-rating-circle"
                                style={{
                                  backgroundColor: '#888888' // Grey for unreviewed tracks
                                }}
                              >
                                -
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="album-details-modal-no-tracks">No tracks found for this album.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedTrack && isTrackDetailsModalOpen && (
        <TrackDetailsModal
          isOpen={isTrackDetailsModalOpen}
          onClose={handleTrackModalClose}
          track={selectedTrack}
          onReview={handleReviewTrack}
          onReReview={handleReviewTrack}
          onReviewDeleted={() => {
            loadData();
            handleTrackModalClose();
          }}
          opinion={trackReviews[selectedTrack.spotifyId]?.[0]?.opinion}
          description={trackReviews[selectedTrack.spotifyId]?.[0]?.description}
          rating={trackReviews[selectedTrack.spotifyId]?.[0]?.rating}
          reviewId={trackReviews[selectedTrack.spotifyId]?.[0]?.id}
        />
      )}

      {selectedTrack && isTrackRankingModalOpen && (
        <TrackRankingModal
          isOpen={isTrackRankingModalOpen}
          onClose={handleRankingModalClose}
          track={{
            ...selectedTrack,
            albumId: album.id
          }}
          existingReviewId={trackReviews[selectedTrack.spotifyId]?.[0]?.id}
          onAlbumReviewSaved={loadData}
        />
      )}
    </>
  );
};

export default AlbumDetailsModal; 