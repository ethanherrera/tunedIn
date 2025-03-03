import React, { useState } from 'react';
import './TrackCard.css';
import TrackRankingModal from './TrackRankingModal';
import trackData from '../../data/hard-coded-tracks.json';

const TrackCard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    return (
        <>
            <div className="track-card" onClick={() => setIsModalOpen(true)}>
                <div className="track-card-inner">
                    <div className="album-cover">
                        <img
                            src={trackData.featuredTrack.albumImageUrl}
                            alt={`${trackData.featuredTrack.albumName} by ${trackData.featuredTrack.artistName}`}
                        />
                    </div>
                    <div className="track-info">
                        <div>
                            <h3 className="track-name">{trackData.featuredTrack.trackName}</h3>
                            <p className="artist-name">{trackData.featuredTrack.artistName}</p>
                            <p className="album-name">{trackData.featuredTrack.albumName}</p>
                        </div>
                    </div>
                </div>
            </div>

            <TrackRankingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                track={trackData.featuredTrack}
            />
        </>
    );
};

export default TrackCard;