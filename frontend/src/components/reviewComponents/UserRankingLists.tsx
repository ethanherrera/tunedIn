import React from 'react';
import './UserRankingLists.css';
import userRankings from '../../data/user-rankings.json';

const UserRankingLists: React.FC = () => {
  return (
    <div className="rankings-container">
      <h2 className="rankings-title">Your Track Rankings</h2>
      <div className="rankings-list">
        {userRankings.rankings.map((ranking) => (
          <div key={ranking.track.spotifyId} className="ranking-item">
            <div className="rank-number">#{ranking.rank}</div>
            <div className="track-card">
              <div className="track-card-inner">
                <div className="album-cover">
                  <img
                    src={ranking.track.albumImageUrl}
                    alt={`${ranking.track.albumName} by ${ranking.track.artistName}`}
                  />
                </div>
                <div className="track-info">
                  <div>
                    <h3 className="track-name">{ranking.track.trackName}</h3>
                    <p className="artist-name">{ranking.track.artistName}</p>
                    <p className="album-name">{ranking.track.albumName}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="score">{ranking.score.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserRankingLists; 