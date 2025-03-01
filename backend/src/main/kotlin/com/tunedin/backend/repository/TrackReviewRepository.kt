package com.tunedin.backend.repository

import com.tunedin.backend.model.TrackReview
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface TrackReviewRepository : MongoRepository<TrackReview, UUID> {
    fun findBySpotifyTrackId(spotifyTrackId: String): List<TrackReview>
    fun findByUserId(userId: String): List<TrackReview>
} 