package com.tunedin.backend.service

import com.tunedin.backend.model.AlbumOpinion
import com.tunedin.backend.model.AlbumReview
import com.tunedin.backend.model.TrackReview
import com.tunedin.backend.repository.AlbumReviewRepository
import com.tunedin.backend.repository.TrackReviewRepository
import org.springframework.stereotype.Service
import java.util.UUID
import kotlin.math.ceil

@Service
class AlbumReviewService(
    private val albumReviewRepository: AlbumReviewRepository,
    private val trackReviewRepository: TrackReviewRepository
) {

    fun getAllAlbumReviews(): List<AlbumReview> {
        return albumReviewRepository.findAll()
    }

    fun getAlbumReviewById(id: UUID): AlbumReview? {
        return albumReviewRepository.findById(id).orElse(null)
    }

    fun getAlbumReviewsByUserId(userId: String): List<AlbumReview> {
        return albumReviewRepository.findByUserId(userId)
    }

    fun getAlbumReviewsBySpotifyAlbumId(spotifyAlbumId: String): List<AlbumReview> {
        return albumReviewRepository.findBySpotifyAlbumId(spotifyAlbumId)
    }

    fun getUserAlbumReview(userId: String, spotifyAlbumId: String): AlbumReview? {
        return albumReviewRepository.findByUserIdAndSpotifyAlbumId(userId, spotifyAlbumId)
    }

    fun createAlbumReview(albumReview: AlbumReview): AlbumReview {
        // Check if user already has a review for this album
        val existingReview = albumReviewRepository.findByUserIdAndSpotifyAlbumId(
            albumReview.userId,
            albumReview.spotifyAlbumId
        )
        
        if (existingReview != null) {
            throw IllegalStateException("User already has a review for this album")
        }
        
        // Calculate rating and set opinion based on track reviews
        calculateRatingAndSetOpinion(albumReview)
        
        return albumReviewRepository.save(albumReview)
    }

    fun updateAlbumReview(id: UUID, updatedReview: AlbumReview): AlbumReview {
        val existingReview = albumReviewRepository.findById(id)
            .orElseThrow { NoSuchElementException("Album review not found with id: $id") }
        
        // Update fields
        existingReview.description = updatedReview.description
        existingReview.ranking = updatedReview.ranking
        existingReview.genres = updatedReview.genres
        existingReview.spotifyTrackIds = updatedReview.spotifyTrackIds
        
        // Calculate rating and set opinion based on track reviews
        calculateRatingAndSetOpinion(existingReview)
        
        return albumReviewRepository.save(existingReview)
    }

    fun deleteAlbumReview(id: UUID) {
        if (!albumReviewRepository.existsById(id)) {
            throw NoSuchElementException("Album review not found with id: $id")
        }
        albumReviewRepository.deleteById(id)
    }
    
    /**
     * Calculates the average rating from track reviews and sets the opinion based on specified buckets.
     * If the number of reviews is less than half of the number of track IDs, sets opinion to UNDEFINED.
     */
    private fun calculateRatingAndSetOpinion(albumReview: AlbumReview) {
        val userId = albumReview.userId
        val spotifyTrackIds = albumReview.spotifyTrackIds
        
        if (spotifyTrackIds.isEmpty()) {
            albumReview.rating = 5.0
            albumReview.opinion = AlbumOpinion.UNDEFINED
            return
        }
        
        // Get all track reviews by this user
        val userTrackReviews = trackReviewRepository.findByUserId(userId)
        
        // Filter to only include reviews for tracks in this album
        val albumTrackReviews = userTrackReviews.filter { review -> 
            review.spotifyTrackId in spotifyTrackIds 
        }
        
        // Calculate average rating from available reviews
        if (albumTrackReviews.isNotEmpty()) {
            albumReview.rating = albumTrackReviews.map { it.rating }.average()
        } else {
            albumReview.rating = 5.0
        }

        //BROKEN TODO: FIX THIS
        
        // Check if we have enough reviews - must have reviews for at least half of the tracks
        // If not, always set opinion to UNDEFINED regardless of rating
        val minimumReviewsRequired = Math.ceil(spotifyTrackIds.size / 2.0).toInt()
        if (albumTrackReviews.size < minimumReviewsRequired) {
            albumReview.opinion = AlbumOpinion.UNDEFINED
            return
        }
        
        // Set opinion based on rating buckets (only if we have enough reviews)
        albumReview.opinion = when {
            albumReview.rating < 4.0 -> AlbumOpinion.DISLIKE
            albumReview.rating < 7.0 -> AlbumOpinion.NEUTRAL
            else -> AlbumOpinion.LIKED
        }
    }
} 