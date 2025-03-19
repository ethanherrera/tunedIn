package com.tunedin.backend.service

import com.tunedin.backend.model.TrackReview
import com.tunedin.backend.model.Opinion
import com.tunedin.backend.repository.TrackReviewRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class TrackReviewService(
    private val trackReviewRepository: TrackReviewRepository,
) {
    private val logger = LoggerFactory.getLogger(TrackReviewService::class.java)

    fun saveTrackReview(review: TrackReview): TrackReview {
        // Check for duplicate entries and clean them up
        try {
            // First, get all reviews for this user and track ID
            val allUserTrackReviews = trackReviewRepository.findByUserId(review.userId)
                .filter { it.trackId == review.trackId }

            // If we have more than one review for the same user and track, clean up the duplicates
            if (allUserTrackReviews.size > 1) {
                logger.warn("Found ${allUserTrackReviews.size} duplicate reviews for user ${review.userId} and track ${review.trackId}. Cleaning up...")

                // Keep the first one and delete the rest
                val reviewToKeep = allUserTrackReviews.first()
                allUserTrackReviews.drop(1).forEach { duplicate ->
                    logger.info("Deleting duplicate review with ID ${duplicate.id}")
                    trackReviewRepository.delete(duplicate)
                }
            }
        } catch (e: Exception) {
            logger.error("Error while cleaning up duplicate reviews: ${e.message}", e)
        }

        val existingReview = trackReviewRepository.findByUserIdAndTrackId(review.userId, review.trackId)
        if (existingReview != null) {
            existingReview.opinion = review.opinion
            existingReview.description = review.description
            existingReview.updateTimestamp()

            return trackReviewRepository.save(existingReview)
        }

        return trackReviewRepository.save(review)
    }
    

    fun getTrackReviewById(id: UUID): TrackReview? {
        return trackReviewRepository.findById(id).orElse(null)
    }

    fun getAllTrackReviewsByUserId(userId: String, opinions: List<Opinion>? = null): List<TrackReview> {
        val allUserReviews = trackReviewRepository.findByUserId(userId)
        return if (opinions.isNullOrEmpty()) {
            allUserReviews
        } else {
            allUserReviews.filter { review -> review.opinion in opinions }
        }
    }
    
    fun getTrackReviewsByTrackIds(trackIds: List<String>): Map<String, List<TrackReview>> {
        return trackIds.associateWith { trackId ->
            trackReviewRepository.findByTrackId(trackId)
        }
    }
    
    fun deleteTrackReview(id: UUID): Boolean {
        if (trackReviewRepository.existsById(id)) {
            trackReviewRepository.deleteById(id)
            return true
        }
        return false
    }
    
    fun deleteTrackReviewByUserIdAndTrackId(userId: String, trackId: String): Boolean {
        val review = trackReviewRepository.findByUserIdAndTrackId(userId, trackId)
        if (review != null) {
            trackReviewRepository.delete(review)
            return true
        }
        return false
    }
}