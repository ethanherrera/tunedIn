package com.tunedin.backend.service

import com.tunedin.backend.model.TrackReview
import com.tunedin.backend.model.Opinion
import com.tunedin.backend.repository.TrackReviewRepository
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class TrackReviewService(
    private val trackReviewRepository: TrackReviewRepository
) {
    fun createReview(userId: String, spotifyTrackId: String, opinion: Opinion, description: String, rating: Double, ranking: Int = 0): TrackReview {
        // Set the rating based on opinion
        val assignedRating = when (opinion) {
            Opinion.LIKED -> 10.0
            Opinion.NEUTRAL -> 7.0
            Opinion.DISLIKE -> 4.0
        }
        
        // Check if the user has already reviewed this track
        val existingReview = trackReviewRepository.findByUserIdAndSpotifyTrackId(userId, spotifyTrackId)
        
        if (existingReview != null) {
            // Update the existing review
            existingReview.opinion = opinion
            
            // If opinion changed, recalculate the ranking
            if (existingReview.opinion != opinion) {
                val nextRank = getNextRankForOpinion(userId, opinion)
                existingReview.ranking = nextRank
            }
            
            existingReview.description = description
            existingReview.rating = assignedRating // Use the opinion-based rating
            
            // Don't update the createdAt timestamp to preserve the original review date
            return trackReviewRepository.save(existingReview)
        }
        
        // Get the next available rank for this opinion type
        val nextRank = getNextRankForOpinion(userId, opinion)
        
        // Create a new review
        val review = TrackReview(
            userId = userId,
            spotifyTrackId = spotifyTrackId,
            opinion = opinion,
            description = description,
            rating = assignedRating, // Use the opinion-based rating
            ranking = nextRank // Use the next available rank for this opinion
        )
        return trackReviewRepository.save(review)
    }

    /**
     * Gets the next available rank for a specific opinion type for a user
     * Ranks start at 1 for each opinion bucket
     */
    private fun getNextRankForOpinion(userId: String, opinion: Opinion): Int {
        val userReviewsWithSameOpinion = trackReviewRepository.findByUserId(userId)
            .filter { it.opinion == opinion }
        
        // If no reviews with this opinion, start at 1
        if (userReviewsWithSameOpinion.isEmpty()) {
            return 1
        }
        
        // Find the highest current rank for this opinion
        val highestRank = userReviewsWithSameOpinion.maxOfOrNull { it.ranking } ?: 0
        
        // Return the next rank (highest + 1)
        return highestRank + 1
    }

    fun getReviewById(id: UUID): TrackReview? {
        return trackReviewRepository.findById(id).orElse(null)
    }

    fun getReviewsByTrackId(spotifyTrackId: String): List<TrackReview> {
        return trackReviewRepository.findBySpotifyTrackId(spotifyTrackId)
    }

    fun getReviewsByUserId(userId: String, opinions: List<Opinion>? = null): List<TrackReview> {
        val allUserReviews = trackReviewRepository.findByUserId(userId)
        return if (opinions.isNullOrEmpty()) {
            allUserReviews
        } else {
            allUserReviews.filter { review -> review.opinion in opinions }
        }
    }
    
    fun deleteReview(id: UUID): Boolean {
        if (trackReviewRepository.existsById(id)) {
            trackReviewRepository.deleteById(id)
            return true
        }
        return false
    }
    
    fun deleteReviewByUserIdAndTrackId(userId: String, spotifyTrackId: String): Boolean {
        val review = trackReviewRepository.findByUserIdAndSpotifyTrackId(userId, spotifyTrackId)
        if (review != null) {
            trackReviewRepository.delete(review)
            return true
        }
        return false
    }

    fun updateReview(id: UUID, userId: String, spotifyTrackId: String, opinion: Opinion, description: String, rating: Double, ranking: Int = 0): TrackReview? {
        // Get the existing review
        val existingReview = trackReviewRepository.findById(id).orElse(null) ?: return null
        
        // Set the rating based on opinion
        val assignedRating = when (opinion) {
            Opinion.LIKED -> 10.0
            Opinion.NEUTRAL -> 7.0
            Opinion.DISLIKE -> 4.0
        }
        
        // If opinion changed, recalculate the ranking
        val assignedRanking = if (existingReview.opinion != opinion) {
            getNextRankForOpinion(userId, opinion)
        } else {
            existingReview.ranking // Keep the existing ranking if opinion didn't change
        }
        
        // Update the review fields
        existingReview.spotifyTrackId = spotifyTrackId
        existingReview.opinion = opinion
        existingReview.description = description
        existingReview.rating = assignedRating // Use the opinion-based rating
        existingReview.ranking = assignedRanking
        // Don't update the createdAt timestamp to preserve the original review date
        
        return trackReviewRepository.save(existingReview)
    }
} 