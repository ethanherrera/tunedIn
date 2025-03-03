package com.tunedin.backend.repository

import com.tunedin.backend.model.AlbumReview
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface AlbumReviewRepository : MongoRepository<AlbumReview, UUID> {
    fun findBySpotifyAlbumId(spotifyAlbumId: String): List<AlbumReview>
    fun findByUserId(userId: String): List<AlbumReview>
    fun findByUserIdAndSpotifyAlbumId(userId: String, spotifyAlbumId: String): AlbumReview?
} 