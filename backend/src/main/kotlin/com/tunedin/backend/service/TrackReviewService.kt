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
            val oldOpinion = existingReview.opinion
            existingReview.opinion = opinion
            
            // If opinion changed, recalculate the ranking
            if (oldOpinion != opinion) {
                // Get the appropriate ranking for the new opinion
                existingReview.ranking = getNextRankForOpinionGroup(userId, opinion)
                
                // Reorder other reviews if necessary
                reorderReviewsAfterOpinionChange(userId, oldOpinion, opinion)
            }
            
            existingReview.description = description
            existingReview.rating = assignedRating // Use the opinion-based rating
            
            // Don't update the createdAt timestamp to preserve the original review date
            return trackReviewRepository.save(existingReview)
        }
        
        // Get the next available rank for this opinion group
        val nextRank = getNextRankForOpinionGroup(userId, opinion)
        
        // Create a new review
        val review = TrackReview(
            userId = userId,
            spotifyTrackId = spotifyTrackId,
            opinion = opinion,
            description = description,
            rating = assignedRating, // Use the opinion-based rating
            ranking = nextRank // Use the appropriate rank for this opinion group
        )
        return trackReviewRepository.save(review)
    }

    /**
     * Gets the appropriate rank for a new review based on its opinion group
     * Likes are at the top, neutrals in the middle, dislikes at the bottom
     */
    private fun getNextRankForOpinionGroup(userId: String, opinion: Opinion): Int {
        val userReviews = trackReviewRepository.findByUserId(userId)
        
        // If no reviews yet, start at 1
        if (userReviews.isEmpty()) {
            return 1
        }
        
        // Sort reviews by opinion priority (LIKED > NEUTRAL > DISLIKE) and then by ranking
        val sortedReviews = userReviews.sortedWith(compareBy(
            { when(it.opinion) {
                Opinion.LIKED -> 0
                Opinion.NEUTRAL -> 1
                Opinion.DISLIKE -> 2
            }},
            { it.ranking }
        ))
        
        return when (opinion) {
            Opinion.LIKED -> {
                // For LIKED: Find the highest rank among LIKED reviews (to place at bottom of likes)
                val likedReviews = userReviews.filter { it.opinion == Opinion.LIKED }
                if (likedReviews.isEmpty()) {
                    // If no liked reviews, place at rank 1 (top)
                    1
                } else {
                    // Find the position after the last liked review
                    val lastLikedReviewIndex = sortedReviews.indexOfLast { it.opinion == Opinion.LIKED }
                    lastLikedReviewIndex + 2 // +1 for 0-indexing, +1 to place after
                }
            }
            Opinion.NEUTRAL -> {
                // For NEUTRAL: Place at the bottom of neutral reviews
                val neutralReviews = userReviews.filter { it.opinion == Opinion.NEUTRAL }
                
                if (neutralReviews.isEmpty()) {
                    // If no neutral reviews yet, find position after all liked reviews
                    val likedReviews = userReviews.filter { it.opinion == Opinion.LIKED }
                    if (likedReviews.isEmpty()) {
                        // If no liked reviews either, place at rank 1
                        1
                    } else {
                        // Find the position after the last liked review
                        val lastLikedReviewIndex = sortedReviews.indexOfLast { it.opinion == Opinion.LIKED }
                        lastLikedReviewIndex + 2 // +1 for 0-indexing, +1 to place after
                    }
                } else {
                    // Find the position after the last neutral review
                    val lastNeutralReviewIndex = sortedReviews.indexOfLast { it.opinion == Opinion.NEUTRAL }
                    lastNeutralReviewIndex + 2 // +1 for 0-indexing, +1 to place after
                }
            }
            Opinion.DISLIKE -> {
                // For DISLIKE: Place at the bottom of dislike reviews
                val dislikeReviews = userReviews.filter { it.opinion == Opinion.DISLIKE }
                
                if (dislikeReviews.isEmpty()) {
                    // If no dislike reviews yet, find position after all liked and neutral reviews
                    val nonDislikeReviews = userReviews.filter { it.opinion != Opinion.DISLIKE }
                    if (nonDislikeReviews.isEmpty()) {
                        // If no other reviews, place at rank 1
                        1
                    } else {
                        // Find the position after the last non-dislike review
                        val lastNonDislikeIndex = sortedReviews.indexOfLast { it.opinion != Opinion.DISLIKE }
                        lastNonDislikeIndex + 2 // +1 for 0-indexing, +1 to place after
                    }
                } else {
                    // Find the position after the last dislike review (which should be the end of the list)
                    sortedReviews.size + 1
                }
            }
        }
    }
    
    /**
     * Reorders reviews after an opinion change to maintain the correct ordering
     * (Likes at top, neutrals in middle, dislikes at bottom)
     */
    private fun reorderReviewsAfterOpinionChange(userId: String, oldOpinion: Opinion, newOpinion: Opinion) {
        // Only reorder if necessary (if moving between opinion groups)
        if (oldOpinion == newOpinion) return
        
        val userReviews = trackReviewRepository.findByUserId(userId)
        
        // Sort reviews by opinion priority (LIKED > NEUTRAL > DISLIKE) and then by ranking
        val sortedReviews = userReviews.sortedWith(compareBy(
            { when(it.opinion) {
                Opinion.LIKED -> 0
                Opinion.NEUTRAL -> 1
                Opinion.DISLIKE -> 2
            }},
            { it.ranking }
        ))
        
        // Reassign rankings to maintain the correct order
        sortedReviews.forEachIndexed { index, review ->
            review.ranking = index + 1
            trackReviewRepository.save(review)
        }
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
            val review = trackReviewRepository.findById(id).get()
            trackReviewRepository.deleteById(id)
            
            // Reorder remaining reviews to maintain consistent ranking
            reorderReviewsAfterDeletion(review.userId)
            
            return true
        }
        return false
    }
    
    fun deleteReviewByUserIdAndTrackId(userId: String, spotifyTrackId: String): Boolean {
        val review = trackReviewRepository.findByUserIdAndSpotifyTrackId(userId, spotifyTrackId)
        if (review != null) {
            trackReviewRepository.delete(review)
            
            // Reorder remaining reviews to maintain consistent ranking
            reorderReviewsAfterDeletion(userId)
            
            return true
        }
        return false
    }
    
    /**
     * Reorders reviews after a deletion to maintain consistent ranking
     */
    private fun reorderReviewsAfterDeletion(userId: String) {
        val userReviews = trackReviewRepository.findByUserId(userId)
        
        // Sort reviews by opinion priority (LIKED > NEUTRAL > DISLIKE) and then by ranking
        val sortedReviews = userReviews.sortedWith(compareBy(
            { when(it.opinion) {
                Opinion.LIKED -> 0
                Opinion.NEUTRAL -> 1
                Opinion.DISLIKE -> 2
            }},
            { it.ranking }
        ))
        
        // Reassign rankings to maintain the correct order
        sortedReviews.forEachIndexed { index, review ->
            review.ranking = index + 1
            trackReviewRepository.save(review)
        }
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
        
        // Store the old opinion to check if it changed
        val oldOpinion = existingReview.opinion
        
        // Update the review fields
        existingReview.spotifyTrackId = spotifyTrackId
        existingReview.opinion = opinion
        existingReview.description = description
        existingReview.rating = assignedRating // Use the opinion-based rating
        
        // If opinion changed, recalculate the ranking
        if (oldOpinion != opinion) {
            existingReview.ranking = getNextRankForOpinionGroup(userId, opinion)
            
            // Save the review first
            val savedReview = trackReviewRepository.save(existingReview)
            
            // Then reorder other reviews if necessary
            reorderReviewsAfterOpinionChange(userId, oldOpinion, opinion)
            
            return savedReview
        } else {
            // Don't update the createdAt timestamp to preserve the original review date
            return trackReviewRepository.save(existingReview)
        }
    }
} 