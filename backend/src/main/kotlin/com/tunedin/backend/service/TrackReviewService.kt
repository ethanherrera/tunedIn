package com.tunedin.backend.service

import com.tunedin.backend.model.TrackReview
import com.tunedin.backend.model.Opinion
import com.tunedin.backend.repository.TrackReviewRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.UUID
import kotlin.math.max

@Service
class TrackReviewService(
    private val trackReviewRepository: TrackReviewRepository,
    private val spotifyService: SpotifyService,
) {
    private val logger = LoggerFactory.getLogger(TrackReviewService::class.java)
    
    fun saveReview(userId: String, spotifyTrackId: String, opinion: Opinion, description: String, rating: Double, ranking: Int = 0, accessToken: String): TrackReview {
        // Get the track to fetch artist information
        val track = spotifyService.getTrack(spotifyTrackId, accessToken)
        
        // Fetch genres for all artists
        val allGenres = track.artists.flatMap { artist ->
            val artistDetails = spotifyService.getArtist(artist.id, accessToken)
            artistDetails.genres ?: emptyList()
        }.distinct()

        // Check for duplicate entries and clean them up
        try {
            // First, get all reviews for this user and track ID
            val allUserTrackReviews = trackReviewRepository.findByUserId(userId)
                .filter { it.spotifyTrackId == spotifyTrackId }
            
            // If we have more than one review for the same user and track, clean up the duplicates
            if (allUserTrackReviews.size > 1) {
                logger.warn("Found ${allUserTrackReviews.size} duplicate reviews for user $userId and track $spotifyTrackId. Cleaning up...")
                
                // Keep the first one and delete the rest
                val reviewToKeep = allUserTrackReviews.first()
                allUserTrackReviews.drop(1).forEach { duplicate ->
                    logger.info("Deleting duplicate review with ID ${duplicate.id}")
                    trackReviewRepository.delete(duplicate)
                }
            }
        } catch (e: Exception) {
            logger.error("Error while cleaning up duplicate reviews: ${e.message}", e)
            // Continue with the operation even if cleanup fails
        }

        // Now try to find the existing review (should be only one or none after cleanup)
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
            existingReview.genres = allGenres
            
            // Don't update the createdAt timestamp to preserve the original review date
            val savedReview = trackReviewRepository.save(existingReview)
            

            return savedReview
        }
        
        // Use the provided ranking if it's greater than 0, otherwise calculate the next rank
        val nextRank = if (ranking > 0) {
            // If a specific ranking is provided (from binary search), use it
            // and shift other reviews to make room
            ranking
        } else {
            // Otherwise get the next available rank for this opinion group
            getNextRankForOpinionGroup(userId, opinion)
        }
        
        // Create a new review
        val review = TrackReview(
            userId = userId,
            spotifyTrackId = spotifyTrackId,
            opinion = opinion,
            description = description,
            rating = 5.0, // Default rating, will be updated by rescoreReviews
            ranking = nextRank, // Use the appropriate rank for this opinion group
            genres = allGenres
        )
        val savedReview = trackReviewRepository.save(review)
        
        return savedReview
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
    
    /**
     * Get multiple reviews by their IDs
     * @param reviewIds List of review IDs to retrieve
     * @return List of found reviews (may be fewer than requested if some IDs don't exist)
     */
    fun getReviewsByIds(reviewIds: List<UUID>): List<TrackReview> {
        return trackReviewRepository.findAllById(reviewIds).toList()
    }
    
    /**
     * Get reviews for multiple track IDs
     * @param spotifyTrackIds List of Spotify track IDs to retrieve reviews for
     * @return Map of track ID to list of reviews for that track
     */
    fun getReviewsByTrackIds(spotifyTrackIds: List<String>): Map<String, List<TrackReview>> {
        return spotifyTrackIds.associateWith { trackId ->
            trackReviewRepository.findBySpotifyTrackId(trackId)
        }
    }
    
    fun deleteReview(id: UUID): Boolean {
        if (trackReviewRepository.existsById(id)) {
            val review = trackReviewRepository.findById(id).get()
            val userId = review.userId
            val spotifyTrackId = review.spotifyTrackId
            trackReviewRepository.deleteById(id)
            
            // Reorder remaining reviews to maintain consistent ranking
            reorderReviewsAfterDeletion(userId)
            
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
        val logger = LoggerFactory.getLogger(TrackReviewService::class.java)
        logger.info("Updating review with id: $id, userId: $userId, spotifyTrackId: $spotifyTrackId, opinion: $opinion, ranking: $ranking")
        
        try {
            // Get the existing review
            val existingReview = trackReviewRepository.findById(id).orElse(null) ?: return null
            logger.info("Found existing review with id: $id, current rating: ${existingReview.rating}, current opinion: ${existingReview.opinion}")
            
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
            
            logger.info("Updated review fields - opinion: $opinion, rating: $assignedRating")
            
            // If opinion changed, recalculate the ranking
            if (oldOpinion != opinion) {
                logger.info("Opinion changed from $oldOpinion to $opinion, recalculating ranking")
                // If a specific ranking is provided (from binary search), use it
                existingReview.ranking = if (ranking > 0) {
                    logger.info("Using provided ranking: $ranking")
                    ranking
                } else {
                    logger.info("Calculating next rank for opinion group")
                    // Otherwise calculate the next rank for this opinion group
                    getNextRankForOpinionGroup(userId, opinion)
                }
                
                // Save the review first
                logger.info("Saving review with new ranking: ${existingReview.ranking}")
                val savedReview = trackReviewRepository.save(existingReview)
                
                // Then reorder other reviews if necessary
                logger.info("Reordering reviews after opinion change")
                reorderReviewsAfterOpinionChange(userId, oldOpinion, opinion)
                
                // Rescore all reviews for this user
                logger.info("Rescoring reviews for user")

                return savedReview
            } else if (ranking > 0 && ranking != existingReview.ranking) {
                // Opinion didn't change but ranking did - update the ranking
                logger.info("Opinion didn't change but ranking did - old ranking: ${existingReview.ranking}, new ranking: $ranking")
                // Remove the review from its current position
                val oldRanking = existingReview.ranking
                
                // Update the ranking
                existingReview.ranking = ranking
                
                // Save the review
                logger.info("Saving review with new ranking: $ranking")
                val savedReview = trackReviewRepository.save(existingReview)
                
                // Reorder other reviews to maintain consistent ranking
                logger.info("Reordering reviews after ranking change")
                reorderReviewsAfterRankingChange(userId, opinion, oldRanking, ranking)
                

                return savedReview
            } else {
                // Don't update the createdAt timestamp to preserve the original review date
                logger.info("No change in opinion or ranking, just updating description")
                val savedReview = trackReviewRepository.save(existingReview)
                
                // Rescore all reviews for this user
                logger.info("Rescoring reviews for user")

                return savedReview
            }
        } catch (e: Exception) {
            logger.error("Error updating review: ${e.message}", e)
            throw e
        }
    }
    
    /**
     * Reorders reviews after a ranking change within the same opinion group
     */
    private fun reorderReviewsAfterRankingChange(userId: String, opinion: Opinion, oldRanking: Int, newRanking: Int) {
        val userReviews = trackReviewRepository.findByUserId(userId)
        
        // Get reviews with the same opinion
        val sameOpinionReviews = userReviews.filter { it.opinion == opinion }
        
        if (oldRanking < newRanking) {
            // Moving down in the list (higher ranking number)
            // Shift reviews between old and new position up by 1
            sameOpinionReviews.filter { 
                it.ranking > oldRanking && it.ranking <= newRanking 
            }.forEach { 
                it.ranking -= 1
                trackReviewRepository.save(it)
            }
        } else if (oldRanking > newRanking) {
            // Moving up in the list (lower ranking number)
            // Shift reviews between new and old position down by 1
            sameOpinionReviews.filter { 
                it.ranking >= newRanking && it.ranking < oldRanking 
            }.forEach { 
                it.ranking += 1
                trackReviewRepository.save(it)
            }
        }
    }
}