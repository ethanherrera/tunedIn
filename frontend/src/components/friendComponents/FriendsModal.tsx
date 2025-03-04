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
}

interface FriendRequest {
  id: string;
  display_name: string;
  image_url?: string;
  timestamp: string;
}

const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose }) => {
  const [friendUserId, setFriendUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [requestStatus, setRequestStatus] = useState<{ message: string; success: boolean } | null>(null);
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

  const handleClose = () => {
    setFriendUserId('');
    setRequestStatus(null);
    onClose();
  };

  const handleSendFriendRequest = async () => {
    if (!friendUserId.trim()) {
      setRequestStatus({
        message: 'Please enter a user ID',
        success: false
      });
      return;
    }

    setIsSubmitting(true);
    setRequestStatus(null);

    try {
      const response = await friendsApi.checkUserExists(friendUserId);
      
      if (response.exists) {
        // Send friend request
        try {
          await friendsApi.sendFriendRequest(friendUserId);
          
          setRequestStatus({
            message: 'Friend request sent!',
            success: true
          });
          setFriendUserId(''); // Clear the input after successful request
        } catch (err) {
          console.error('Failed to send friend request:', err);
          // Check if the error is related to authentication
          if (err instanceof Error && err.message.includes('User ID not found')) {
            setRequestStatus({
              message: 'You need to be logged in to send friend requests. Please log in again.',
              success: false
            });
          } else {
            setRequestStatus({
              message: 'Failed to send friend request. Please try again.',
              success: false
            });
          }
        }
      } else {
        setRequestStatus({
          message: 'User ID does not exist',
          success: false
        });
      }
    } catch (err) {
      console.error('Failed to check user:', err);
      setRequestStatus({
        message: 'Failed to check if user exists. Please try again.',
        success: false
      });
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
        {friends.map(friend => (
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
            </div>
          </div>
        ))}
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
        {friendRequests.map(request => (
          <div key={request.id} className="friend-request-item">
            <div className="friend-avatar">
              {request.image_url ? (
                <img src={request.image_url} alt={request.display_name} />
              ) : (
                <div className="avatar-placeholder">
                  {request.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="friend-info">
              <div className="friend-name">{request.display_name}</div>
              <div className="friend-id">{request.id}</div>
              <div className="request-time">Requested: {new Date(request.timestamp).toLocaleString()}</div>
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
        ))}
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
                className="friend-request-button"
                onClick={handleSendFriendRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : <><FiUserPlus /> Add</>}
              </button>
            </div>
            {requestStatus && (
              <div className={`friend-request-status ${requestStatus.success ? 'success' : 'error'}`}>
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