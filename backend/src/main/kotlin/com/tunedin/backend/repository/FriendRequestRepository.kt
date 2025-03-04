package com.tunedin.backend.repository

import com.tunedin.backend.model.FriendRequest
import com.tunedin.backend.model.FriendRequestStatus
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.data.mongodb.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface FriendRequestRepository : MongoRepository<FriendRequest, String> {
    fun findBySenderIdAndReceiverId(senderId: String, receiverId: String): FriendRequest?
    fun findByReceiverIdAndStatus(receiverId: String, status: FriendRequestStatus): List<FriendRequest>
    fun findBySenderIdAndStatus(senderId: String, status: FriendRequestStatus): List<FriendRequest>
    
    // Find all requests between two users (in either direction)
    @Query("{ '\$or': [ { 'senderId': ?0, 'receiverId': ?1 }, { 'senderId': ?1, 'receiverId': ?0 } ] }")
    fun findRequestsBetweenUsers(userId1: String, userId2: String): List<FriendRequest>
    
    // Delete all requests between two users (in either direction)
    @Query("{ '\$or': [ { 'senderId': ?0, 'receiverId': ?1 }, { 'senderId': ?1, 'receiverId': ?0 } ] }")
    fun deleteRequestsBetweenUsers(userId1: String, userId2: String)
} 