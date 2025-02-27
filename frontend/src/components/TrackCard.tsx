import React from 'react';
import './TrackCard.css';

const TrackCard = () => {
    // Track data
    const track = {
        albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2737359994525d219f64872d3b1",
        albumName: "Cut To The Feeling",
        artistName: "Carly Rae Jepsen",
        trackName: "Cut To The Feeling",
        spotifyId: "11dFghVXANMlKmJXsNCbNl"
    };

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

export default TrackCard;