package com.tunedin.backend.repository

import com.tunedin.backend.model.FriendRequest
import com.tunedin.backend.model.FriendRequestStatus
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

@Repository
interface FriendRequestRepository : MongoRepository<FriendRequest, String> {
    fun findBySenderIdAndReceiverId(senderId: String, receiverId: String): FriendRequest?
    fun findByReceiverIdAndStatus(receiverId: String, status: FriendRequestStatus): List<FriendRequest>
    fun findBySenderIdAndStatus(senderId: String, status: FriendRequestStatus): List<FriendRequest>
} 