import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiUsers, FiUserCheck, FiCheck, FiX } from 'react-icons/fi';
import { friendsApi } from '../../api/apiClient';
import './FriendsModal.css';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose }) => {
  const [friendUserId, setFriendUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [requestStatus, setRequestStatus] = useState<{ message: string; success: boolean; type?: 'success' | 'error' | 'already-sent' } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch friends and friend requests when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFriendsAndRequests();
    }
  }, [isOpen]);

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

  const handleClose = () => {
    setFriendUserId('');
    setRequestStatus(null);
    onClose();
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
            <div key={friend.id} className="friend-item">
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
                  onClick={() => handleRemoveFriend(friend.id)}
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Friends</h2>
          <button className="modal-close-button" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">
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
    </div>
  );
};

export default FriendsModal; 