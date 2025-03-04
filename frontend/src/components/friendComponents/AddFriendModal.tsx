import React, { useState, useEffect } from 'react';
import { friendsApi } from '../../api/apiClient';
import './AddFriendModal.css';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ isOpen, onClose }) => {
  const [friendUserId, setFriendUserId] = useState<string>('');
  const [friendRequestStatus, setFriendRequestStatus] = useState<{ message: string; success: boolean } | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState<boolean>(false);

  // Effect to auto-close modal after successful friend request
  useEffect(() => {
    let timeoutId: number;
    
    if (friendRequestStatus?.success) {
      timeoutId = setTimeout(() => {
        handleClose();
      }, 1000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [friendRequestStatus]);

  const handleAddFriend = async () => {
    if (!friendUserId.trim()) {
      setFriendRequestStatus({
        message: 'Please enter a user ID',
        success: false
      });
      return;
    }

    setIsCheckingUser(true);
    setFriendRequestStatus(null);

    try {
      const response = await friendsApi.checkUserExists(friendUserId);
      
      if (response.exists) {
        setFriendRequestStatus({
          message: 'Friend request sent!',
          success: true
        });
      } else {
        setFriendRequestStatus({
          message: 'User ID does not exist',
          success: false
        });
      }
    } catch (err) {
      console.error('Failed to check user:', err);
      setFriendRequestStatus({
        message: 'Failed to check user. Please try again.',
        success: false
      });
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isCheckingUser) {
      handleAddFriend();
    }
  };

  const handleClose = () => {
    setFriendUserId('');
    setFriendRequestStatus(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add a Friend</h2>
          <button className="modal-close-button" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">
          <p>Add a new friend by entering their user ID here:</p>
          <div className="friend-input-container">
            <input
              type="text"
              value={friendUserId}
              onChange={(e) => setFriendUserId(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter user ID"
              className="friend-input"
            />
            <button 
              className="add-friend-button"
              onClick={handleAddFriend}
              disabled={isCheckingUser}
            >
              {isCheckingUser ? 'Checking...' : 'Add Friend'}
            </button>
          </div>
          {friendRequestStatus && (
            <div className={`friend-request-status ${friendRequestStatus.success ? 'success' : 'error'}`}>
              {friendRequestStatus.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal; 