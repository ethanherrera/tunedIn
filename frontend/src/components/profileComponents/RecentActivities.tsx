import React, { useState, useEffect } from 'react';
import { userApi, spotifyApi } from '../../api/apiClient';
import { FiClock, FiMusic, FiThumbsUp, FiThumbsDown, FiMeh, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import './ProfilePage.css';

// Interface for the recent activity data
interface RecentActivity {
  id: string;
  trackReview: {
    id: string;
    userId: string;
    spotifyTrackId: string;
    opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
    description: string;
    rating: number;
    ranking: number;
    createdAt: number;
    genres: string[];
  };
  timestamp: number;
}

// Interface for track details
interface TrackDetails {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height?: number;
      width?: number;
    }>;
  };
  external_urls?: {
    spotify?: string;
  };
}

// Interface for activity with track details
interface EnhancedActivity extends RecentActivity {
  trackDetails?: TrackDetails;
}

const RecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<EnhancedActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    // If we already have activities, we're just refreshing
    const isRefreshing = activities.length > 0;
    
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      // Fetch recent activities
      const recentActivities = await userApi.getRecentActivities();
      
      // Extract track IDs from activities
      const trackIds = recentActivities.map(activity => activity.trackReview.spotifyTrackId);
      
      // Fetch track details if there are any activities
      if (trackIds.length > 0) {
        // Use a Set to get unique track IDs
        const uniqueTrackIds = [...new Set(trackIds)];
        
        // Use batch request to get all track details at once
        const trackDetailsResponse = await spotifyApi.getTracksBatch(uniqueTrackIds);
        
        // Map track details to activities
        const enhancedActivities = recentActivities.map(activity => {
          const trackDetail = trackDetailsResponse.tracks.find(
            track => track.id === activity.trackReview.spotifyTrackId
          );
          
          return {
            ...activity,
            trackDetails: trackDetail
          };
        });
        
        setActivities(enhancedActivities);
      } else {
        setActivities(recentActivities);
      }
    } catch (err) {
      console.error('Failed to fetch recent activities:', err);
      setError('Failed to load your recent activities. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Helper function to get opinion icon
  const getOpinionIcon = (opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED') => {
    switch (opinion) {
      case 'LIKED':
        return <FiThumbsUp className="activity-opinion-icon liked" />;
      case 'DISLIKE':
        return <FiThumbsDown className="activity-opinion-icon disliked" />;
      case 'NEUTRAL':
        return <FiMeh className="activity-opinion-icon neutral" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="activities-loading">
        <div className="profile-loading-spinner"></div>
        <p>Loading your recent activities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activities-error">
        <p>{error}</p>
        <button 
          className="profile-retry-button"
          onClick={fetchRecentActivities}
        >
          <FiRefreshCw /> Try Again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="activities-empty">
        <p>You don't have any recent activities yet.</p>
        <p>Start reviewing tracks to see your activity here!</p>
      </div>
    );
  }

  return (
    <div className="recent-activities-container">
      <div className="activities-header">
        <h2 className="activities-title">
          <FiClock /> Recent Activities
        </h2>
        <button 
          className="activities-refresh-button"
          onClick={fetchRecentActivities}
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? 'spinning' : ''} /> 
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="activities-list">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div className="activity-header">
              <div className="activity-type">
                <FiMusic /> Track Review
              </div>
              <div className="activity-time">
                <FiClock /> {formatTimestamp(activity.timestamp)}
              </div>
            </div>
            
            <div className="activity-content">
              {activity.trackDetails ? (
                <div className="activity-track-details">
                  {activity.trackDetails.album.images && activity.trackDetails.album.images.length > 0 && (
                    <img 
                      src={activity.trackDetails.album.images[0].url} 
                      alt={activity.trackDetails.album.name}
                      className="activity-album-image"
                    />
                  )}
                  
                  <div className="activity-track-info-container">
                    <div className="activity-track-name">
                      {activity.trackDetails.name}
                    </div>
                    <div className="activity-track-artist">
                      by {activity.trackDetails.artists.map(artist => artist.name).join(', ')}
                    </div>
                    <div className="activity-track-album">
                      from {activity.trackDetails.album.name}
                    </div>
                    
                    <div className="activity-opinion-rating">
                      {getOpinionIcon(activity.trackReview.opinion)}
                      <span className="activity-rating">
                        Rating: {activity.trackReview.rating}/10
                      </span>
                    </div>
                    
                    {activity.trackDetails.external_urls?.spotify && (
                      <a 
                        href={activity.trackDetails.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="activity-spotify-link"
                      >
                        <FiExternalLink /> Open in Spotify
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="activity-loading-track">
                  <div className="profile-loading-spinner"></div>
                  <p>Loading track details...</p>
                </div>
              )}
              
              {activity.trackReview.description && (
                <div className="activity-description">
                  "{activity.trackReview.description}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities; 