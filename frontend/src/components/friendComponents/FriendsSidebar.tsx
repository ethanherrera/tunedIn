import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiUsers, FiUserCheck, FiCheck, FiX, FiDisc } from 'react-icons/fi';
import './FriendsSidebar.css';
import '../reviewComponents/UserReviewedTracks.css';
import { friendsApi, spotifyApi } from '../../api/apiClient';

// Types and interfaces
type TabType = 'friends' | 'requests';

interface Friend {
  id: string;
  display_name: string;
  image_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FriendRequest {
  id: string;
  display_name?: string;
  image_url?: string;
  timestamp?: string;
  senderId?: string;
  receiverId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TrackReview {
  id: string;
  userId: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number;
  ranking: number;
  createdAt: number;
  genres: string[];
}

interface TrackDetails {
  albumImageUrl: string;
  albumName: string;
  artistName: string;
  trackName: string;
  spotifyId: string;
}

interface ReviewWithTrackDetails extends TrackReview {
  track?: TrackDetails;
}

// FriendReviewedTracks component
interface FriendReviewedTracksProps {
  friend: Friend;
  onClose: () => void;
}

const FriendReviewedTracks: React.FC<FriendReviewedTracksProps> = ({ friend, onClose }) => {
  const [reviews, setReviews] = useState<ReviewWithTrackDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFriendReviews();
  }, [friend.id]);

  const fetchFriendReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await friendsApi.getFriendReviews(friend.id);
      
      // If there are no reviews, return early
      if (response.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }
      
      // Extract all track IDs from the reviews
      const trackIds = response.map((review: any) => review.spotifyTrackId);
      
      // Use the batch API to fetch all tracks at once
      let tracksData: Record<string, any> = {};
      
      try {
        // Fetch tracks in batches of 50 (Spotify API limit)
        const batchSize = 50;
        const trackBatches = [];
        
        for (let i = 0; i < trackIds.length; i += batchSize) {
          trackBatches.push(trackIds.slice(i, i + batchSize));
        }
        
        // Fetch all batches in parallel
        const batchResults = await Promise.all(
          trackBatches.map(batch => spotifyApi.getTracksBatch(batch))
        );
        
        // Combine all batch results
        const allTracks = batchResults.flatMap(result => result.tracks);
        
        // Create a map of track ID to track data for easy lookup
        tracksData = allTracks.reduce((acc, track) => {
          acc[track.id] = track;
          return acc;
        }, {} as Record<string, any>);
        
      } catch (batchError) {
        console.error('Failed to fetch tracks in batch:', batchError);
        // Fall back to individual fetches if batch fails
        for (const review of response) {
          try {
            const trackData = await spotifyApi.getTrack(review.spotifyTrackId);
            tracksData[review.spotifyTrackId] = trackData;
          } catch (trackError) {
            console.error(`Failed to fetch track ${review.spotifyTrackId}:`, trackError);
          }
        }
      }
      
      // Create an array to hold reviews with track details
      const reviewsWithTracks: ReviewWithTrackDetails[] = response.map((review: any) => {
        const trackData = tracksData[review.spotifyTrackId];
        
        if (trackData) {
          return {
            ...review,
            track: {
              albumImageUrl: trackData.album.images[0]?.url || 'https://via.placeholder.com/300',
              albumName: trackData.album.name,
              artistName: trackData.artists[0].name,
              trackName: trackData.name,
              spotifyId: trackData.id
            }
          };
        } else {
          // Fallback for tracks that couldn't be fetched
          return {
            ...review,
            track: {
              albumImageUrl: 'https://via.placeholder.com/300',
              albumName: 'Unknown Album',
              artistName: 'Unknown Artist',
              trackName: 'Unknown Track',
              spotifyId: review.spotifyTrackId
            }
          };
        }
      });
      
      setReviews(reviewsWithTracks || []);
    } catch (err) {
      console.error('Failed to fetch friend reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return '#4ade80'; // Green for high ratings
    if (rating >= 5) return '#facc15'; // Yellow for medium ratings
    return '#f87171'; // Red for low ratings
  };

  const renderReviewsList = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading reviews...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-message">
          {error}
          <button onClick={fetchFriendReviews}>Try Again</button>
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="no-reviews">
          {friend.display_name} hasn't reviewed any tracks yet.
        </div>
      );
    }

    return (
      <div className="reviews-list">
        {reviews.map(review => (
          <div key={review.id} className="review-item">
            <div className="track-card-container">
              <div className="album-cover-container">
                <div className="album-cover">
                  {review.track?.albumImageUrl ? (
                    <img src={review.track.albumImageUrl} alt={review.track.albumName} />
                  ) : (
                    <div className="album-cover-placeholder"></div>
                  )}
                </div>
              </div>
              <div className="track-info">
                <div className="track-name">{review.track?.trackName || 'Unknown Track'}</div>
                <div className="artist-name">{review.track?.artistName || 'Unknown Artist'}</div>
                <div className="album-name">{review.track?.albumName || 'Unknown Album'}</div>
              </div>
            </div>
            <div className="review-details">
              <div 
                className="rating-circle" 
                style={{ backgroundColor: getRatingColor(review.rating) }}
              >
                {review.rating}
              </div>
              {review.description && (
                <div className="review-description">"{review.description}"</div>
              )}
              <div className="review-date">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="user-reviewed-tracks">
      <div className="header">
        <h2>{friend.display_name}'s Reviews</h2>
        <div className="header-buttons">
          <button className="refresh-button" onClick={fetchFriendReviews}>
            Refresh
          </button>
          <button className="refresh-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      {renderReviewsList()}
    </div>
  );
};

// Main FriendsSidebar component
interface FriendsSidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

const FriendsSidebar: React.FC<FriendsSidebarProps> = ({ isCollapsed, onCollapseChange }) => {
  const [friendUserId, setFriendUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [requestStatus, setRequestStatus] = useState<{ message: string; success: boolean; type?: 'success' | 'error' | 'already-sent' } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  // Fetch friends and friend requests on component mount
  useEffect(() => {
    fetchFriendsAndRequests();
  }, []);

  const fetchFriendsAndRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch friends list and friend requests in parallel
      const [friendsResponse, requestsResponse] = await Promise.all([
        friendsApi.getFriendsList(),
        friendsApi.getPendingRequests()
      ]);
      
      setFriends(friendsResponse || []);
      setFriendRequests(requestsResponse || []);
    } catch (err) {
      console.error('Failed to fetch friends data:', err);
      // Check if the error is related to authentication
      if (err instanceof Error && err.message.includes('User ID not found')) {
        setError('You need to be logged in to view friends. Please log in again.');
      } else {
        setError('Failed to load friends data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await friendsApi.acceptFriendRequest(requestId);
      // Refresh the lists after accepting
      fetchFriendsAndRequests();
    } catch (err) {
      console.error('Failed to accept friend request:', err);
      // Check if the error is related to authentication
      if (err instanceof Error && err.message.includes('User ID not found')) {
        setError('You need to be logged in to accept friend requests. Please log in again.');
      } else {
        setError('Failed to accept friend request. Please try again.');
      }
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await friendsApi.declineFriendRequest(requestId);
      // Refresh the lists after rejecting
      fetchFriendsAndRequests();
    } catch (err) {
      console.error('Failed to reject friend request:', err);
      // Check if the error is related to authentication
      if (err instanceof Error && err.message.includes('User ID not found')) {
        setError('You need to be logged in to reject friend requests. Please log in again.');
      } else {
        setError('Failed to reject friend request. Please try again.');
      }
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      try {
        await friendsApi.removeFriend(friendId);
        // Refresh the lists after removing
        fetchFriendsAndRequests();
      } catch (err) {
        console.error('Failed to remove friend:', err);
        // Check if the error is related to authentication
        if (err instanceof Error && err.message.includes('User ID not found')) {
          setError('You need to be logged in to remove friends. Please log in again.');
        } else {
          setError('Failed to remove friend. Please try again.');
        }
      }
    }
  };

  const handleSendFriendRequest = async () => {
    if (!friendUserId.trim()) {
      setRequestStatus({
        message: 'Please enter a user ID',
        success: false,
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    setRequestStatus(null);

    try {
      // First check if the user exists
      const response = await friendsApi.checkUserExists(friendUserId);
      
      if (response.exists) {
        try {
          // Send friend request
          await friendsApi.sendFriendRequest(friendUserId);
          
          setRequestStatus({
            message: 'Friend request sent successfully!',
            success: true,
            type: 'success'
          });
          setFriendUserId(''); // Clear the input after successful request
          
          // Refresh the sent requests list if we implement that view in the future
          fetchFriendsAndRequests();
        } catch (err) {
          console.error('Failed to send friend request:', err);
          
          // Handle specific error cases
          if (err instanceof Error) {
            if (err.message.includes('User ID not found')) {
              setRequestStatus({
                message: 'You need to be logged in to send friend requests. Please log in again.',
                success: false,
                type: 'error'
              });
            } else if (err.message.includes('already friends')) {
              setRequestStatus({
                message: 'You are already friends with this user.',
                success: false,
                type: 'error'
              });
            } else if (err.message.includes('request already sent')) {
              setRequestStatus({
                message: 'Friend request already sent',
                success: false,
                type: 'already-sent'
              });
            } else if (err.message.includes('cannot send to yourself')) {
              setRequestStatus({
                message: 'You cannot send a friend request to yourself.',
                success: false,
                type: 'error'
              });
            } else {
              setRequestStatus({
                message: 'Failed to send friend request. Please try again later.',
                success: false,
                type: 'error'
              });
            }
          } else {
            setRequestStatus({
              message: 'An unexpected error occurred. Please try again.',
              success: false,
              type: 'error'
            });
          }
        }
      } else {
        setRequestStatus({
          message: 'User ID does not exist. Please check and try again.',
          success: false,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Failed to check if user exists:', err);
      
      // Handle network or server errors when checking user existence
      if (err instanceof Error && err.message.includes('Network Error')) {
        setRequestStatus({
          message: 'Network error. Please check your connection and try again.',
          success: false,
          type: 'error'
        });
      } else {
        setRequestStatus({
          message: 'Failed to check if user exists. Please try again later.',
          success: false,
          type: 'error'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSendFriendRequest();
    }
  };

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsClosing(true);
    // Wait for animation to complete before removing the drawer
    setTimeout(() => {
      setIsDrawerOpen(false);
      setSelectedFriend(null);
      setIsClosing(false);
    }, 300); // Match animation duration (0.3s)
  };

  const toggleCollapse = () => {
    onCollapseChange(!isCollapsed);
  };

  const renderFriendsList = () => {
    if (isLoading) {
      return <div className="loading-indicator">Loading friends...</div>;
    }

    if (error) {
      return (
        <div className="error-message">
          {error}
          <button className="retry-button" onClick={fetchFriendsAndRequests}>
            Try Again
          </button>
        </div>
      );
    }

    if (friends.length === 0) {
      return (
        <div className="empty-state">
          <FiUsers className="empty-state-icon" />
          <p>You have no friends yet</p>
        </div>
      );
    }

    return (
      <div className="friends-list">
        {friends.map(friend => {
          // Parse the timestamp string from the backend
          const timestamp = friend.createdAt 
            ? new Date(friend.createdAt.replace(' ', 'T')) // Handle ISO format
            : new Date();
            
          return (
            <div 
              key={friend.id} 
              className="friend-item"
              onClick={() => handleFriendClick(friend)}
            >
              <div className="friend-avatar">
                {friend.image_url ? (
                  <img src={friend.image_url} alt={friend.display_name} />
                ) : (
                  <div className="avatar-placeholder">
                    {friend.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="friend-info">
                <div className="friend-name">{friend.display_name}</div>
                <div className="friend-id">{friend.id}</div>
                <div className="friend-since">Friends since: {timestamp.toLocaleDateString()}</div>
              </div>
              <div className="friend-actions">
                <button 
                  className="remove-friend-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFriend(friend.id);
                  }}
                  title="Remove Friend"
                >
                  <FiX />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFriendRequestsList = () => {
    if (isLoading) {
      return <div className="loading-indicator">Loading friend requests...</div>;
    }

    if (error) {
      return (
        <div className="error-message">
          {error}
          <button className="retry-button" onClick={fetchFriendsAndRequests}>
            Try Again
          </button>
        </div>
      );
    }

    if (friendRequests.length === 0) {
      return (
        <div className="empty-state">
          <FiUserCheck className="empty-state-icon" />
          <p>You have no friend requests right now</p>
        </div>
      );
    }

    return (
      <div className="friend-requests-list">
        {friendRequests.map(request => {
          // Parse the timestamp string from the backend
          const timestamp = request.createdAt 
            ? new Date(request.createdAt.replace(' ', 'T')) // Handle ISO format
            : new Date();
            
          return (
            <div key={request.id} className="friend-request-item">
              <div className="friend-avatar">
                {request.image_url ? (
                  <img src={request.image_url} alt={request.display_name || 'User'} />
                ) : (
                  <div className="avatar-placeholder">
                    {(request.display_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="friend-info">
                <div className="friend-name">{request.display_name || 'Unknown User'}</div>
                <div className="friend-id">{request.senderId || request.id}</div>
                <div className="request-time">Requested: {timestamp.toLocaleString()}</div>
              </div>
              <div className="request-actions">
                <button 
                  className="accept-button"
                  onClick={() => handleAcceptFriendRequest(request.id)}
                  title="Accept"
                >
                  <FiCheck />
                </button>
                <button 
                  className="reject-button"
                  onClick={() => handleRejectFriendRequest(request.id)}
                  title="Reject"
                >
                  <FiX />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <div className="friends-tab-content">
            {renderFriendsList()}
          </div>
        );
      case 'requests':
        return (
          <div className="requests-tab-content">
            {renderFriendRequestsList()}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`friends-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={toggleCollapse}>
        {isCollapsed ? '>' : '<'}
      </div>
      
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h2>Friends</h2>
        </div>
        
        <div className="sidebar-body">
          <div className="friend-request-section">
            <h3>Add a Friend</h3>
            <p>Enter a user ID to send a friend request:</p>
            <div className="friend-input-container">
              <input
                type="text"
                value={friendUserId}
                onChange={(e) => setFriendUserId(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter user ID"
                className="friend-input"
                disabled={isSubmitting}
              />
              <button 
                className={`friend-request-button ${isSubmitting ? 'loading' : ''}`}
                onClick={handleSendFriendRequest}
                disabled={isSubmitting}
                aria-label="Send friend request"
              >
                {isSubmitting ? 'Sending...' : <><FiUserPlus /> Add</>}
              </button>
            </div>
            {requestStatus && (
              <div 
                className={`friend-request-status ${
                  requestStatus.type === 'success' 
                    ? 'success' 
                    : requestStatus.type === 'already-sent'
                    ? 'already-sent'
                    : 'error'
                }`}
                role="alert"
              >
                {requestStatus.type === 'success' ? (
                  <FiCheck className="status-icon" />
                ) : requestStatus.type === 'already-sent' ? (
                  <FiUserCheck className="status-icon" />
                ) : (
                  <FiX className="status-icon" />
                )}
                {requestStatus.message}
              </div>
            )}
          </div>
          
          <div className="friends-tabs">
            <div className="tabs-header">
              <button 
                className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                <FiUsers /> Friends
              </button>
              <button 
                className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <FiUserCheck /> Friend Requests
              </button>
            </div>
            <div className="tabs-content">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
      
      {isDrawerOpen && selectedFriend && (
        <div className={`friend-reviews-drawer ${isClosing ? 'closing' : ''}`}>
          <FriendReviewedTracks 
            friend={selectedFriend} 
            onClose={handleCloseDrawer} 
          />
        </div>
      )}
    </div>
  );
};

export default FriendsSidebar; 