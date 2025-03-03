import React from 'react';
import './AlbumCard.css';

interface Image {
  url: string;
  height?: number;
  width?: number;
}

interface Artist {
  id: string;
  name: string;
  uri: string;
  href: string;
  popularity?: number;
  genres?: string[];
  images?: Image[];
}

interface Copyright {
  text: string;
  type: string;
}

interface Restrictions {
  reason: string;
}

interface SimplifiedTrack {
  id: string;
  name: string;
  uri: string;
  href: string;
  // Other track properties as needed
}

interface PagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

interface AlbumCardProps {
  album: {
    id: string;
    name: string;
    uri: string;
    href: string;
    album_type: string;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
    available_markets: string[];
    images: Image[];
    artists: Artist[];
    external_urls: { [key: string]: string };
    type: string;
    copyrights?: Copyright[];
    external_ids?: { [key: string]: string };
    genres?: string[];
    label?: string;
    popularity?: number;
    restrictions?: Restrictions;
    tracks?: PagingObject<SimplifiedTrack>;
  };
  onClick?: (album: any, e?: React.MouseEvent) => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(album, e);
    }
  };

  // Get the album cover image (use the first image or a placeholder)
  const albumCoverUrl = album.images && album.images.length > 0 
    ? album.images[0].url 
    : 'https://via.placeholder.com/300';

  // Get the primary artist name
  const artistName = album.artists && album.artists.length > 0 
    ? album.artists[0].name 
    : 'Unknown Artist';

  return (
    <div className="album-card" onClick={handleClick}>
      <div className="album-card-inner">
        <div className="album-card-cover">
          <img
            src={albumCoverUrl}
            alt={`${album.name} by ${artistName}`}
          />
        </div>
        <div className="album-card-info">
          <div>
            <h3 className="album-card-name">{album.name}</h3>
            <p className="album-card-artist">{artistName}</p>
            <p className="album-card-type">{album.album_type}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumCard; 