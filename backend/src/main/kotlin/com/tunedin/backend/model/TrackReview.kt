package com.tunedin.backend.model

import java.util.UUID

enum class Opinion {
    DISLIKE,
    NEUTRAL,
    LIKED
}

data class TrackReview(
    val id: UUID = UUID.randomUUID(),
    val userId: String,
    val spotifyTrackId: String,
    val opinion: Opinion,
    val description: String,
    val createdAt: Long = System.currentTimeMillis()
) {
    init {
        require(description.split("\\s+".toRegex()).size <= 200) {
            "Description must not exceed 200 words"
        }
    }
}