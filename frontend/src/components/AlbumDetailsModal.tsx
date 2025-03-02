import React, { useState, useEffect } from 'react';
import './AlbumDetailsModal.css';
import { spotifyApi } from '../api/apiClient';

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && album.id) {
      fetchAlbumTracks();
    }
  }, [isOpen, album.id]);

  const fetchAlbumTracks = async () => {
    setIsLoading(true);
    try {
      // Fetch the album with tracks
      const albumData = await spotifyApi.getAlbum(album.id);
      
      if (albumData && albumData.tracks && albumData.tracks.items) {
        // Transform the tracks to match our Track interface
        const formattedTracks = albumData.tracks.items.map((track: { id: string; name: string; artists: Array<{ name: string }> }) => ({
          spotifyId: track.id,
          trackName: track.name,
          artistName: track.artists[0].name,
          albumName: album.name,
          albumImageUrl: album.images && album.images.length > 0 
            ? album.images[0].url 
            : 'https://via.placeholder.com/300'
        }));
        
        setTracks(formattedTracks);
      }
    } catch (error) {
      console.error('Failed to fetch album tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get the album cover image (use the first image or a placeholder)
  const albumCoverUrl = album.images && album.images.length > 0 
    ? album.images[0].url 
    : 'https://via.placeholder.com/300';

  // Get the primary artist name
  const artistName = album.artists && album.artists.length > 0 
    ? album.artists[0].name 
    : 'Unknown Artist';

  // Format release date
  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="album-details-modal-overlay" onClick={onClose}>
      <div className="album-details-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="album-details-modal-close-button" onClick={onClose}>×</button>
        
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
          </div>
        </div>

        <div className="album-details-modal-tracks-container">
          <h3 className="album-details-modal-tracks-title">Tracks</h3>
          
          {isLoading ? (
            <div className="album-details-modal-loading">Loading tracks...</div>
          ) : tracks.length > 0 ? (
            <div className="album-details-modal-tracks-list">
              {tracks.map(track => (
                <div key={track.spotifyId} className="album-details-modal-track-card">
                  <div className="album-details-modal-track-card-inner">
                    <div className="album-details-modal-track-cover">
                      <img
                        src={track.albumImageUrl}
                        alt={`${track.albumName} by ${track.artistName}`}
                      />
                    </div>
                    <div className="album-details-modal-track-info">
                      <div>
                        <h3 className="album-details-modal-track-name">{track.trackName}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="album-details-modal-no-tracks">No tracks found for this album.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumDetailsModal; 