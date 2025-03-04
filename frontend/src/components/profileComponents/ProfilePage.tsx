import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/apiClient';
import { FiRefreshCw, FiUser, FiMail, FiMusic, FiUsers } from 'react-icons/fi';
import RecentActivities from './RecentActivities';
import FriendsModal from '../friendComponents/FriendsModal';
import './ProfilePage.css';

// Use a more generic interface that can handle both backend and frontend types
interface ProfileData {
  id: string;
  display_name?: string | null;
  email?: string | null;
  external_urls?: {
    spotify?: string | null;
  } | null;
  href?: string | null;
  images?: Array<{
    url: string;
    height?: number | null;
    width?: number | null;
  }> | null;
  uri?: string | null;
  country?: string | null;
  product?: string | null;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the user controller API instead of Spotify API
      const userData = await userApi.getProfile();
      // Cast the response to our ProfileData interface
      setProfile(userData as unknown as ProfileData);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError('Failed to load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading-container">
        <div className="profile-loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error-container">
        <p>{error}</p>
        <button 
          className="profile-retry-button"
          onClick={fetchUserProfile}
        >
          <FiRefreshCw /> Try Again
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-not-found-container">
        <p>Profile information not available.</p>
        <button 
          className="profile-retry-button"
          onClick={fetchUserProfile}
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Your Profile</h1>
        <div className="profile-header-buttons">
          <button 
            className="profile-friends-button"
            onClick={() => setShowFriendsModal(true)}
          >
            <FiUsers /> Friends
          </button>
          <button 
            className="profile-refresh-button"
            onClick={fetchUserProfile}
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>
      
      <div className="profile-content">
        <div className="profile-image-container">
          {profile.images && profile.images.length > 0 ? (
            <img 
              src={profile.images[0].url} 
              alt={`${profile.display_name}'s profile`} 
              className="profile-image"
            />
          ) : (
            <div className="profile-image-placeholder">
              <FiUser size={80} />
            </div>
          )}
        </div>
        
        <div className="profile-details">
          <div className="profile-detail-item">
            <span className="profile-detail-label">
              <FiUser /> Display Name:
            </span>
            <span className="profile-detail-value">{profile.display_name || 'Not available'}</span>
          </div>
          
          <div className="profile-detail-item">
            <span className="profile-detail-label">
              <FiUser /> User ID:
            </span>
            <span className="profile-detail-value">{profile.id}</span>
          </div>
          
          <div className="profile-detail-item">
            <span className="profile-detail-label">
              <FiMail /> Email:
            </span>
            <span className="profile-detail-value">{profile.email || 'Not available'}</span>
          </div>
          
          {profile.country && (
            <div className="profile-detail-item">
              <span className="profile-detail-label">
                <FiMusic /> Country:
              </span>
              <span className="profile-detail-value">{profile.country}</span>
            </div>
          )}
          
          {profile.product && (
            <div className="profile-detail-item">
              <span className="profile-detail-label">
                <FiMusic /> Subscription:
              </span>
              <span className="profile-detail-value">
                {profile.product.charAt(0).toUpperCase() + profile.product.slice(1)}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {profile.external_urls?.spotify && (
        <div className="profile-spotify-link">
          <a 
            href={profile.external_urls.spotify} 
            target="_blank" 
            rel="noopener noreferrer"
            className="profile-spotify-button"
          >
            Open in Spotify
          </a>
        </div>
      )}

      {/* Friends Modal */}
      <FriendsModal 
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
      />

      <RecentActivities />
    </div>
  );
};

export default ProfilePage; 