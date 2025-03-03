package com.tunedin.backend.service

import com.tunedin.backend.model.TrackReview
import com.tunedin.backend.model.Opinion
import com.tunedin.backend.repository.TrackReviewRepository
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class TrackReviewService(
    private val trackReviewRepository: TrackReviewRepository,
    private val spotifyService: SpotifyService,
    private val albumReviewService: AlbumReviewService
) {
    fun createReview(userId: String, spotifyTrackId: String, opinion: Opinion, description: String, rating: Double, ranking: Int = 0, accessToken: String): TrackReview {
        // Get the track to fetch artist information
        val track = spotifyService.getTrack(spotifyTrackId, accessToken)
        
        // Fetch genres for all artists
        val allGenres = track.artists.flatMap { artist ->
            val artistDetails = spotifyService.getArtist(artist.id, accessToken)
            artistDetails.genres ?: emptyList()
        }.distinct()

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
            existingReview.genres = allGenres
            
            // Don't update the createdAt timestamp to preserve the original review date
            val savedReview = trackReviewRepository.save(existingReview)
            
            // Rescore all reviews for this user
            rescoreReviews(userId)
            
            // Update the album review for this track
            updateAlbumReviewForTrack(userId, track.album.id, spotifyTrackId, accessToken)
            
            return savedReview
        }
        
        // Use the provided ranking if it's greater than 0, otherwise calculate the next rank
        val nextRank = if (ranking > 0) {
            // If a specific ranking is provided (from binary search), use it
            // and shift other reviews to make room
            shiftReviewsForInsertion(userId, opinion, ranking)
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
        
        // Rescore all reviews for this user
        rescoreReviews(userId)
        
        // Update the album review for this track
        updateAlbumReviewForTrack(userId, track.album.id, spotifyTrackId, accessToken)
        
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
            
            // Rescore all reviews for this user
            rescoreReviews(userId)
            
            // Try to update album reviews
            try {
                updateAlbumReviewsByTrackId(userId, spotifyTrackId)
            } catch (e: Exception) {
                // Log the error but don't fail the review deletion
                println("Failed to update album review: ${e.message}")
            }
            
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
            
            // Rescore all reviews for this user
            rescoreReviews(userId)
            
            // Try to update album reviews
            try {
                updateAlbumReviewsByTrackId(userId, spotifyTrackId)
            } catch (e: Exception) {
                // Log the error but don't fail the review deletion
                println("Failed to update album review: ${e.message}")
            }
            
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
            // If a specific ranking is provided (from binary search), use it
            existingReview.ranking = if (ranking > 0) {
                // Shift other reviews to make room for this ranking
                shiftReviewsForInsertion(userId, opinion, ranking)
                ranking
            } else {
                // Otherwise calculate the next rank for this opinion group
                getNextRankForOpinionGroup(userId, opinion)
            }
            
            // Save the review first
            val savedReview = trackReviewRepository.save(existingReview)
            
            // Then reorder other reviews if necessary
            reorderReviewsAfterOpinionChange(userId, oldOpinion, opinion)
            
            // Rescore all reviews for this user
            rescoreReviews(userId)
            
            // Get the track to get the album ID
            try {
                // We need to get the track to get the album ID
                // This requires an access token, which we don't have in this method
                // So we'll try to find the album review by track ID
                updateAlbumReviewsByTrackId(userId, spotifyTrackId)
            } catch (e: Exception) {
                // Log the error but don't fail the review update
                println("Failed to update album review: ${e.message}")
            }
            
            return savedReview
        } else if (ranking > 0 && ranking != existingReview.ranking) {
            // Opinion didn't change but ranking did - update the ranking
            // Remove the review from its current position
            val oldRanking = existingReview.ranking
            
            // Update the ranking
            existingReview.ranking = ranking
            
            // Save the review
            val savedReview = trackReviewRepository.save(existingReview)
            
            // Reorder other reviews to maintain consistent ranking
            reorderReviewsAfterRankingChange(userId, opinion, oldRanking, ranking)
            
            // Rescore all reviews for this user
            rescoreReviews(userId)
            
            // Try to update album reviews
            try {
                updateAlbumReviewsByTrackId(userId, spotifyTrackId)
            } catch (e: Exception) {
                // Log the error but don't fail the review update
                println("Failed to update album review: ${e.message}")
            }
            
            return savedReview
        } else {
            // Don't update the createdAt timestamp to preserve the original review date
            val savedReview = trackReviewRepository.save(existingReview)
            
            // Rescore all reviews for this user
            rescoreReviews(userId)
            
            // Try to update album reviews
            try {
                updateAlbumReviewsByTrackId(userId, spotifyTrackId)
            } catch (e: Exception) {
                // Log the error but don't fail the review update
                println("Failed to update album review: ${e.message}")
            }
            
            return savedReview
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
    
    /**
     * Rescores all reviews for a user according to their opinion category and ranking.
     * - Liked reviews are distributed in the range 7.0-10.0
     * - Neutral reviews are distributed in the range 4.0-6.9
     * - Disliked reviews are distributed in the range 0.0-3.9
     * 
     * Within each category, reviews are evenly distributed with the highest-ranked item
     * getting the top score for that category.
     */
    fun rescoreReviews(userId: String) {
        val userReviews = trackReviewRepository.findByUserId(userId)
        
        // Group reviews by opinion and sort by ranking (lower ranking = higher position)
        val likedReviews = userReviews.filter { it.opinion == Opinion.LIKED }.sortedBy { it.ranking }
        val neutralReviews = userReviews.filter { it.opinion == Opinion.NEUTRAL }.sortedBy { it.ranking }
        val dislikedReviews = userReviews.filter { it.opinion == Opinion.DISLIKE }.sortedBy { it.ranking }
        
        // Rescore liked reviews (7.0-10.0)
        if (likedReviews.isNotEmpty()) {
            val likedRange = 10.0 - 7.0
            val likedStep = if (likedReviews.size > 1) likedRange / (likedReviews.size - 1) else 0.0
            
            likedReviews.forEachIndexed { index, review ->
                // Lower index (lower ranking) gets higher score
                // For example, with 3 reviews: index 0 gets 10.0, index 1 gets 8.5, index 2 gets 7.0
                review.rating = 10.0 - (index * likedStep)
                trackReviewRepository.save(review)
            }
        }
        
        // Rescore neutral reviews (4.0-6.9)
        if (neutralReviews.isNotEmpty()) {
            val neutralRange = 6.9 - 4.0
            val neutralStep = if (neutralReviews.size > 1) neutralRange / (neutralReviews.size - 1) else 0.0
            
            neutralReviews.forEachIndexed { index, review ->
                // Lower index (lower ranking) gets higher score
                review.rating = 6.9 - (index * neutralStep)
                trackReviewRepository.save(review)
            }
        }
        
        // Rescore disliked reviews (0.0-3.9)
        if (dislikedReviews.isNotEmpty()) {
            val dislikedRange = 3.9 - 0.0
            val dislikedStep = if (dislikedReviews.size > 1) dislikedRange / (dislikedReviews.size - 1) else 0.0
            
            dislikedReviews.forEachIndexed { index, review ->
                // Lower index (lower ranking) gets higher score
                review.rating = 3.9 - (index * dislikedStep)
                trackReviewRepository.save(review)
            }
        }
    }

    /**
     * Shifts existing reviews to make room for a new review at the specified ranking
     * Returns the provided ranking for insertion
     */
    private fun shiftReviewsForInsertion(userId: String, opinion: Opinion, ranking: Int): Int {
        val userReviews = trackReviewRepository.findByUserId(userId)
        
        // Get reviews with the same opinion that need to be shifted
        val reviewsToShift = userReviews.filter { 
            it.opinion == opinion && it.ranking >= ranking 
        }.sortedBy { it.ranking }
        
        // Shift rankings of affected reviews
        for (review in reviewsToShift) {
            review.ranking += 1
            trackReviewRepository.save(review)
        }
        
        return ranking
    }

    /**
     * Updates the album review for a track
     * @param userId The user ID
     * @param spotifyAlbumId The Spotify album ID
     * @param spotifyTrackId The Spotify track ID
     * @param accessToken The Spotify access token
     */
    private fun updateAlbumReviewForTrack(userId: String, spotifyAlbumId: String, spotifyTrackId: String, accessToken: String) {
        try {
            // Get the album to get all track IDs
            val album = spotifyService.getAlbum(spotifyAlbumId, accessToken)
            
            // Get all track IDs from the album
            val trackIds = album.tracks?.items?.map { it.id } ?: emptyList()
            
            // Check if the user already has a review for this album
            var albumReview = albumReviewService.getUserAlbumReview(userId, spotifyAlbumId)
            
            if (albumReview == null) {
                // Create a new album review with minimal information
                // The calculateRatingAndSetOpinion method will set the rating and opinion
                albumReview = com.tunedin.backend.model.AlbumReview(
                    userId = userId,
                    spotifyAlbumId = spotifyAlbumId,
                    description = "Auto-generated from track reviews",
                    spotifyTrackIds = trackIds
                )
                
                // Save the new album review
                albumReviewService.createAlbumReview(albumReview)
            } else {
                // Update the existing album review
                // Make sure the track IDs are up to date
                albumReview.spotifyTrackIds = trackIds
                
                // Update the album review
                albumReviewService.updateAlbumReview(albumReview.id, albumReview)
            }
        } catch (e: Exception) {
            // Log the error but don't fail the track review operation
            println("Failed to update album review: ${e.message}")
        }
    }
    
    /**
     * Updates all album reviews that contain the given track ID
     * This is used when we don't have an access token to fetch the album
     * @param userId The user ID
     * @param spotifyTrackId The Spotify track ID
     */
    private fun updateAlbumReviewsByTrackId(userId: String, spotifyTrackId: String) {
        // Get all album reviews for this user
        val albumReviews = albumReviewService.getAlbumReviewsByUserId(userId)
        
        // Find album reviews that contain this track
        val relevantAlbumReviews = albumReviews.filter { review ->
            spotifyTrackId in review.spotifyTrackIds
        }
        
        // Update each relevant album review
        for (albumReview in relevantAlbumReviews) {
            albumReviewService.updateAlbumReview(albumReview.id, albumReview)
        }
    }
} 