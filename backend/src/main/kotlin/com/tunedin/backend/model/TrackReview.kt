package com.tunedin.backend.model

import java.util.UUID

enum class Opinion {
    DISLIKE,
    NEUTRAL,
    LIKED
}

data class TrackReview(
    var id: UUID = UUID.randomUUID(),
    var userId: String,
    var spotifyTrackId: String,
    var opinion: Opinion,
    var description: String,
    var rating: Double = 5.0,
    var createdAt: Long = System.currentTimeMillis()
) {
    init {
        require(description.split("\\s+".toRegex()).size <= 200) {
            "Description must not exceed 200 words"
        }
        require(rating in 0.0..10.0) {
            "Rating must be between 0.0 and 10.0"
        }
    }
}