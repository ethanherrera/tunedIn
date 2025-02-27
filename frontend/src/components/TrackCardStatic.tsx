import React from 'react';
import './TrackCard.css';

interface TrackCardStaticProps {
  track: {
    albumImageUrl: string;
    albumName: string;
    artistName: string;
    trackName: string;
    spotifyId: string;
  };
}

const TrackCardStatic: React.FC<TrackCardStaticProps> = ({ track }) => {
  return (
    <div className="track-card">
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

export default TrackCardStatic; 