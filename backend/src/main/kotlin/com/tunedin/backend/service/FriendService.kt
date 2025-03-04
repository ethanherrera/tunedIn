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
        
        // Check if there's a reverse request (receiver already sent a request to sender)
        val reverseRequest = friendRequestRepository.findBySenderIdAndReceiverId(receiverId, senderId)
        if (reverseRequest != null && reverseRequest.status == FriendRequestStatus.PENDING) {
            // Auto-accept the reverse request
            return acceptFriendRequest(senderId, reverseRequest.id)
        }
        
        // Clean up any old non-pending requests between these users
        cleanupFriendRequestsBetweenUsers(senderId, receiverId, preservePending = true)
        
        // Check if there's already a pending request
        val existingRequest = friendRequestRepository.findBySenderIdAndReceiverId(senderId, receiverId)
        if (existingRequest != null && existingRequest.status == FriendRequestStatus.PENDING) {
            throw IllegalStateException("Friend request already sent")
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
        
        // Clean up all friend requests between these users
        // We'll do this after saving the updated request so we have a record of the acceptance
        // but before returning, to prevent duplicates in the future
        cleanupFriendRequestsBetweenUsers(request.senderId, request.receiverId, preservePending = false)
        
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
        
        // Save the updated request
        friendRequestRepository.save(updatedRequest)
        
        // Clean up all friend requests between these users
        // We'll do this after saving the updated request so we have a record of the decline
        // but before returning, to prevent duplicates in the future
        cleanupFriendRequestsBetweenUsers(request.senderId, request.receiverId, preservePending = false)
        
        return updatedRequest
    }
    
    // Get pending friend requests for a user
    fun getPendingRequestsForUser(userId: String): List<Map<String, Any>> {
        val requests = friendRequestRepository.findByReceiverIdAndStatus(userId, FriendRequestStatus.PENDING)
        
        // Enrich requests with sender information
        return requests.map { request ->
            val sender = userProfileRepository.findById(request.senderId).orElse(null)
            
            mapOf(
                "id" to request.id,
                "senderId" to request.senderId,
                "receiverId" to request.receiverId,
                "status" to request.status.toString(),
                "createdAt" to request.createdAt.toString(),
                "updatedAt" to request.updatedAt.toString(),
                "display_name" to (sender?.display_name ?: "Unknown User"),
                "image_url" to (sender?.images?.firstOrNull()?.url ?: "")
            )
        }
    }
    
    // Get sent friend requests by a user
    fun getSentRequestsByUser(userId: String): List<Map<String, Any>> {
        val requests = friendRequestRepository.findBySenderIdAndStatus(userId, FriendRequestStatus.PENDING)
        
        // Enrich requests with receiver information
        return requests.map { request ->
            val receiver = userProfileRepository.findById(request.receiverId).orElse(null)
            
            mapOf(
                "id" to request.id,
                "senderId" to request.senderId,
                "receiverId" to request.receiverId,
                "status" to request.status.toString(),
                "createdAt" to request.createdAt.toString(),
                "updatedAt" to request.updatedAt.toString(),
                "display_name" to (receiver?.display_name ?: "Unknown User"),
                "image_url" to (receiver?.images?.firstOrNull()?.url ?: "")
            )
        }
    }
    
    // Get all friends for a user
    fun getUserFriends(userId: String): List<Map<String, Any>> {
        val user = userProfileRepository.findById(userId).orElseThrow {
            IllegalArgumentException("User not found")
        }
        
        val friendProfiles = userProfileRepository.findAllById(user.friendIds)
        
        return friendProfiles.map { friend ->
            mapOf(
                "id" to friend.id,
                "display_name" to (friend.display_name ?: "Unknown User"),
                "image_url" to (friend.images?.firstOrNull()?.url ?: ""),
                "createdAt" to friend.createdAt.toString(),
                "updatedAt" to friend.updatedAt.toString()
            )
        }
    }
    
    // Remove friendship between users
    fun removeFriendship(userId1: String, userId2: String) {
        val friendship = friendshipRepository.findFriendshipBetweenUsers(userId1, userId2)
            ?: throw IllegalArgumentException("Friendship not found")
        
        friendshipRepository.delete(friendship)
        
        // Update both users' friend lists
        removeUserFromFriendsList(userId1, userId2)
        
        // Clean up any friend requests between these users
        cleanupFriendRequestsBetweenUsers(userId1, userId2, preservePending = false)
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
    
    // Helper method to clean up all friend requests between two users
    private fun cleanupFriendRequestsBetweenUsers(userId1: String, userId2: String, preservePending: Boolean = false) {
        // Find all requests between these users
        val requests = friendRequestRepository.findRequestsBetweenUsers(userId1, userId2)
        
        // Filter requests based on preservePending flag
        val requestsToDelete = if (preservePending) {
            requests.filter { it.status != FriendRequestStatus.PENDING }
        } else {
            requests
        }
        
        // Delete filtered requests
        if (requestsToDelete.isNotEmpty()) {
            friendRequestRepository.deleteAll(requestsToDelete)
        }
    }
} 