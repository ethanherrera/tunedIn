package com.tunedin.backend.service

import com.tunedin.backend.model.*
import com.tunedin.backend.repository.FriendRequestRepository
import com.tunedin.backend.repository.FriendshipRepository
import com.tunedin.backend.repository.UserProfileRepository
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class FriendService(
    private val friendRequestRepository: FriendRequestRepository,
    private val friendshipRepository: FriendshipRepository,
    private val userProfileRepository: UserProfileRepository
) {

    // Send a friend request
    fun sendFriendRequest(senderId: String, receiverId: String): FriendRequest {
        // Check if users exist
        val sender = userProfileRepository.findById(senderId).orElseThrow { 
            IllegalArgumentException("Sender user not found") 
        }
        val receiver = userProfileRepository.findById(receiverId).orElseThrow { 
            IllegalArgumentException("Receiver user not found") 
        }
        
        // Check if they are already friends
        val existingFriendship = friendshipRepository.findFriendshipBetweenUsers(senderId, receiverId)
        if (existingFriendship != null) {
            throw IllegalStateException("Users are already friends")
        }
        
        // Check if there's already a pending request
        val existingRequest = friendRequestRepository.findBySenderIdAndReceiverId(senderId, receiverId)
        if (existingRequest != null && existingRequest.status == FriendRequestStatus.PENDING) {
            throw IllegalStateException("Friend request already sent")
        }
        
        // Check if there's a reverse request (receiver already sent a request to sender)
        val reverseRequest = friendRequestRepository.findBySenderIdAndReceiverId(receiverId, senderId)
        if (reverseRequest != null && reverseRequest.status == FriendRequestStatus.PENDING) {
            // Auto-accept the reverse request
            return acceptFriendRequest(receiverId, reverseRequest.id)
        }
        
        // Create and save the friend request
        val friendRequest = FriendRequest(
            senderId = senderId,
            receiverId = receiverId
        )
        
        return friendRequestRepository.save(friendRequest)
    }
    
    // Accept a friend request
    fun acceptFriendRequest(receiverId: String, requestId: String): FriendRequest {
        val request = friendRequestRepository.findById(requestId).orElseThrow {
            IllegalArgumentException("Friend request not found")
        }
        
        // Verify the receiver is the one accepting the request
        if (request.receiverId != receiverId) {
            throw IllegalArgumentException("Only the request recipient can accept it")
        }
        
        // Update request status
        val updatedRequest = request.copy(
            status = FriendRequestStatus.ACCEPTED,
            updatedAt = Instant.now()
        )
        friendRequestRepository.save(updatedRequest)
        
        // Create friendship
        val friendship = Friendship(
            userId1 = request.senderId,
            userId2 = request.receiverId
        )
        friendshipRepository.save(friendship)
        
        // Update both users' friend lists
        updateUserFriendsList(request.senderId, request.receiverId)
        
        return updatedRequest
    }
    
    // Decline a friend request
    fun declineFriendRequest(receiverId: String, requestId: String): FriendRequest {
        val request = friendRequestRepository.findById(requestId).orElseThrow {
            IllegalArgumentException("Friend request not found")
        }
        
        // Verify the receiver is the one declining the request
        if (request.receiverId != receiverId) {
            throw IllegalArgumentException("Only the request recipient can decline it")
        }
        
        // Update request status
        val updatedRequest = request.copy(
            status = FriendRequestStatus.DECLINED,
            updatedAt = Instant.now()
        )
        
        return friendRequestRepository.save(updatedRequest)
    }
    
    // Get pending friend requests for a user
    fun getPendingRequestsForUser(userId: String): List<FriendRequest> {
        return friendRequestRepository.findByReceiverIdAndStatus(userId, FriendRequestStatus.PENDING)
    }
    
    // Get sent friend requests by a user
    fun getSentRequestsByUser(userId: String): List<FriendRequest> {
        return friendRequestRepository.findBySenderIdAndStatus(userId, FriendRequestStatus.PENDING)
    }
    
    // Get all friends for a user
    fun getUserFriends(userId: String): List<UserProfile> {
        val user = userProfileRepository.findById(userId).orElseThrow {
            IllegalArgumentException("User not found")
        }
        
        return userProfileRepository.findAllById(user.friendIds)
    }
    
    // Remove friendship between users
    fun removeFriendship(userId1: String, userId2: String) {
        val friendship = friendshipRepository.findFriendshipBetweenUsers(userId1, userId2)
            ?: throw IllegalArgumentException("Friendship not found")
        
        friendshipRepository.delete(friendship)
        
        // Update both users' friend lists
        removeUserFromFriendsList(userId1, userId2)
    }
    
    // Helper method to update users' friend lists
    private fun updateUserFriendsList(userId1: String, userId2: String) {
        // Update first user
        val user1 = userProfileRepository.findById(userId1).orElseThrow {
            IllegalArgumentException("User not found: $userId1")
        }
        if (!user1.friendIds.contains(userId2)) {
            val updatedUser1 = user1.copy(
                friendIds = user1.friendIds + userId2,
                updatedAt = Instant.now()
            )
            userProfileRepository.save(updatedUser1)
        }
        
        // Update second user
        val user2 = userProfileRepository.findById(userId2).orElseThrow {
            IllegalArgumentException("User not found: $userId2")
        }
        if (!user2.friendIds.contains(userId1)) {
            val updatedUser2 = user2.copy(
                friendIds = user2.friendIds + userId1,
                updatedAt = Instant.now()
            )
            userProfileRepository.save(updatedUser2)
        }
    }
    
    // Helper method to remove users from each other's friend lists
    private fun removeUserFromFriendsList(userId1: String, userId2: String) {
        // Update first user
        val user1 = userProfileRepository.findById(userId1).orElseThrow {
            IllegalArgumentException("User not found: $userId1")
        }
        val updatedUser1 = user1.copy(
            friendIds = user1.friendIds.filter { it != userId2 },
            updatedAt = Instant.now()
        )
        userProfileRepository.save(updatedUser1)
        
        // Update second user
        val user2 = userProfileRepository.findById(userId2).orElseThrow {
            IllegalArgumentException("User not found: $userId2")
        }
        val updatedUser2 = user2.copy(
            friendIds = user2.friendIds.filter { it != userId1 },
            updatedAt = Instant.now()
        )
        userProfileRepository.save(updatedUser2)
    }
} 