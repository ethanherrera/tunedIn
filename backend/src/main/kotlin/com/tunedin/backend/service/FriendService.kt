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

    fun sendFriendRequest(senderId: String, receiverId: String): FriendRequest {
        val sender = userProfileRepository.findById(senderId).orElseThrow {
            IllegalArgumentException("Sender user not found") 
        }
        val receiver = userProfileRepository.findById(receiverId).orElseThrow { 
            IllegalArgumentException("Receiver user not found") 
        }
        
        val existingFriendship = friendshipRepository.findFriendshipBetweenUsers(senderId, receiverId)
        if (existingFriendship != null) {
            throw IllegalStateException("Users are already friends")
        }
        
        val reverseRequest = friendRequestRepository.findBySenderIdAndReceiverId(receiverId, senderId)
        if (reverseRequest != null && reverseRequest.status == FriendRequestStatus.PENDING) {
            return acceptFriendRequest(senderId, reverseRequest.id)
        }
        
        cleanupFriendRequestsBetweenUsers(senderId, receiverId, preservePending = true)
        
        val existingRequest = friendRequestRepository.findBySenderIdAndReceiverId(senderId, receiverId)
        if (existingRequest != null && existingRequest.status == FriendRequestStatus.PENDING) {
            throw IllegalStateException("Friend request already sent")
        }
        
        val friendRequest = FriendRequest(
            senderId = senderId,
            receiverId = receiverId
        )
        
        return friendRequestRepository.save(friendRequest)
    }
    
    fun acceptFriendRequest(receiverId: String, requestId: String): FriendRequest {
        val request = friendRequestRepository.findById(requestId).orElseThrow {
            IllegalArgumentException("Friend request not found")
        }
        
        if (request.receiverId != receiverId) {
            throw IllegalArgumentException("Only the request recipient can accept it")
        }
        
        val updatedRequest = request.copy(
            status = FriendRequestStatus.ACCEPTED,
            updatedAt = Instant.now()
        )
        friendRequestRepository.save(updatedRequest)
        
        val friendship = Friendship(
            userId1 = request.senderId,
            userId2 = request.receiverId
        )
        friendshipRepository.save(friendship)
        
        updateUserProfileFriendsList(request.senderId, request.receiverId)

        cleanupFriendRequestsBetweenUsers(request.senderId, request.receiverId, preservePending = false)
        
        return updatedRequest
    }
    
    fun declineFriendRequest(receiverId: String, requestId: String): FriendRequest {
        val request = friendRequestRepository.findById(requestId).orElseThrow {
            IllegalArgumentException("Friend request not found")
        }
        
        if (request.receiverId != receiverId) {
            throw IllegalArgumentException("Only the request recipient can decline it")
        }
        
        val updatedRequest = request.copy(
            status = FriendRequestStatus.DECLINED,
            updatedAt = Instant.now()
        )
        
        friendRequestRepository.save(updatedRequest)

        cleanupFriendRequestsBetweenUsers(request.senderId, request.receiverId, preservePending = false)
        
        return updatedRequest
    }
    
    fun getPendingRequestsForUser(userId: String): List<Map<String, Any>> {
        val requests = friendRequestRepository.findByReceiverIdAndStatus(userId, FriendRequestStatus.PENDING)
        
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
    
    fun removeFriendship(userId1: String, userId2: String) {
        val friendship = friendshipRepository.findFriendshipBetweenUsers(userId1, userId2)
            ?: throw IllegalArgumentException("Friendship not found")
        
        friendshipRepository.delete(friendship)
        
        removeUserFromFriendsList(userId1, userId2)
        
        cleanupFriendRequestsBetweenUsers(userId1, userId2, preservePending = false)
    }
    
    private fun updateUserProfileFriendsList(userId1: String, userId2: String) {
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
    
    private fun removeUserFromFriendsList(userId1: String, userId2: String) {
        val user1 = userProfileRepository.findById(userId1).orElseThrow {
            IllegalArgumentException("User not found: $userId1")
        }
        val updatedUser1 = user1.copy(
            friendIds = user1.friendIds.filter { it != userId2 },
            updatedAt = Instant.now()
        )
        userProfileRepository.save(updatedUser1)
        
        val user2 = userProfileRepository.findById(userId2).orElseThrow {
            IllegalArgumentException("User not found: $userId2")
        }
        val updatedUser2 = user2.copy(
            friendIds = user2.friendIds.filter { it != userId1 },
            updatedAt = Instant.now()
        )
        userProfileRepository.save(updatedUser2)
    }
    
    private fun cleanupFriendRequestsBetweenUsers(userId1: String, userId2: String, preservePending: Boolean = false) {
        val requests = friendRequestRepository.findRequestsBetweenUsers(userId1, userId2)
        
        val requestsToDelete = if (preservePending) {
            requests.filter { it.status != FriendRequestStatus.PENDING }
        } else {
            requests
        }
        
        if (requestsToDelete.isNotEmpty()) {
            friendRequestRepository.deleteAll(requestsToDelete)
        }
    }
} 