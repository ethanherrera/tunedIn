import React from 'react';
import './TrackCard.css';

interface TrackCardSearchResultProps {
  track: {
    albumImageUrl: string;
    albumName: string;
    artistName: string;
    trackName: string;
    spotifyId: string;
  };
  onClick: (track: any) => void;
}

const TrackCardSearchResult: React.FC<TrackCardSearchResultProps> = ({ track, onClick }) => {
  return (
    <div className="track-card search-track-card" onClick={() => onClick(track)}>
      <div className="track-card-inner">
        <div className="album-cover">
          <img
            src={track.albumImageUrl}
            alt={`${track.albumName} by ${track.artistName}`}
          />
        </div>
        <div className="track-info">
          <div>
            <h3 className="track-name">{track.trackName}</h3>
            <p className="artist-name">{track.artistName}</p>
            <p className="album-name">{track.albumName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCardSearchResult; 