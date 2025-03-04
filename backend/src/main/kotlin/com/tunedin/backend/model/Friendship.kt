package com.tunedin.backend.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "friendships")
data class Friendship(
    @Id
    val id: String = java.util.UUID.randomUUID().toString(),
    val userId1: String,  // First user in the friendship
    val userId2: String,  // Second user in the friendship
    val createdAt: Instant = Instant.now()
) 