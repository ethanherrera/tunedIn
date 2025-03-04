package com.tunedin.backend.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "friend_requests")
data class FriendRequest(
    @Id
    val id: String = java.util.UUID.randomUUID().toString(),
    val senderId: String,  // User who sent the request
    val receiverId: String,  // User who received the request
    val status: FriendRequestStatus = FriendRequestStatus.PENDING,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
)

enum class FriendRequestStatus {
    PENDING,
    ACCEPTED,
    DECLINED
}