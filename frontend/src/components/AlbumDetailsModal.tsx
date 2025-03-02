import React from 'react';
import './AlbumDetailsModal.css';

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
      </div>
    </div>
  );
};

export default AlbumDetailsModal; 