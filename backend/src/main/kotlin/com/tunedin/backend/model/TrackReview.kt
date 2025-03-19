package com.tunedin.backend.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant
import java.util.UUID

@Document(collection = "track_reviews")
data class TrackReview(
    @Id
    var id: UUID = UUID.randomUUID(),
    var userId: String,
    var trackId: String,
    var opinion: Opinion,
    var description: String,
    var rating: Double = 5.0,
    var ranking: Double = 5.0,
    var createdAt: Instant = Instant.now(),
    var updatedAt: Instant = Instant.now()
) {
    fun updateTimestamp() {
        updatedAt = Instant.now()
    }
}