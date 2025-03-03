package com.tunedin.backend.model

import java.util.UUID

data class AlbumReview(
    var id: UUID = UUID.randomUUID(),
    var userId: String,
    var spotifyAlbumId: String,
    var opinion: AlbumOpinion = AlbumOpinion.UNDEFINED,
    var description: String,
    var rating: Double = 5.0,
    var ranking: Int = 0,
    var createdAt: Long = System.currentTimeMillis(),
    var genres: List<String> = emptyList(),
    var spotifyTrackIds: List<String> = emptyList()
) {
    init {
        require(description.split("\\s+".toRegex()).size <= 200) {
            "Description must not exceed 200 words"
        }
        require(rating in 0.0..10.0) {
            "Rating must be between 0.0 and 10.0"
        }
        require(ranking >= 0) {
            "Ranking must be a non-negative integer"
        }
    }
} 