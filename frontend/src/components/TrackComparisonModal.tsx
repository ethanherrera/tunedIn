import React, { useState } from 'react';
import './TrackComparisonModal.css';
import trackData from '../data/hard-coded-tracks.json';

interface Track {
  albumImageUrl: string;
  albumName: string;
  artistName: string;
  trackName: string;
  spotifyId: string;
}

interface TrackComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrack: Track;
}

const TrackComparisonModal: React.FC<TrackComparisonModalProps> = ({
  isOpen,
  onClose,
  initialTrack
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  if (!isOpen) return null;

  const challengerTrack = trackData.comparisonTracks[currentTrackIndex];

  const handleTrackSelect = (selectedTrack: Track) => {
    if (selectedTrack === initialTrack) {
      if (currentTrackIndex >= trackData.comparisonTracks.length - 1) {
        onClose();
        return;
      }
      setCurrentTrackIndex(prevIndex => prevIndex + 1);
    } else {
      // If challenger track wins, replace initial track with challenger and move to next
      if (currentTrackIndex >= trackData.comparisonTracks.length - 1) {
        onClose();
        return;
      }
      setCurrentTrackIndex(prevIndex => prevIndex + 1);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="comparison-modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        
        <h2 className="comparison-title">Please select which track you believe is better</h2>
        
        <div className="tracks-container">
          <div 
            className="track-option"
            onClick={() => handleTrackSelect(initialTrack)}
          >
            <div className="track-card">
              <div className="track-card-inner">
                <div className="album-cover">
                  <img
                    src={initialTrack.albumImageUrl}
                    alt={`${initialTrack.albumName} by ${initialTrack.artistName}`}
                  />
                </div>
                <div className="track-info">
                  <div>
                    <h3 className="track-name">{initialTrack.trackName}</h3>
                    <p className="artist-name">{initialTrack.artistName}</p>
                    <p className="album-name">{initialTrack.albumName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="comparison-divider">OR</div>

          <div 
            className="track-option"
            onClick={() => handleTrackSelect(challengerTrack)}
          >
            <div className="track-card">
              <div className="track-card-inner">
                <div className="album-cover">
                  <img
                    src={challengerTrack.albumImageUrl}
                    alt={`${challengerTrack.albumName} by ${challengerTrack.artistName}`}
                  />
                </div>
                <div className="track-info">
                  <div>
                    <h3 className="track-name">{challengerTrack.trackName}</h3>
                    <p className="artist-name">{challengerTrack.artistName}</p>
                    <p className="album-name">{challengerTrack.albumName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="comparison-progress">
          {currentTrackIndex + 1} of {trackData.comparisonTracks.length} comparisons
        </div>
      </div>
    </div>
  );
};

export default TrackComparisonModal; 