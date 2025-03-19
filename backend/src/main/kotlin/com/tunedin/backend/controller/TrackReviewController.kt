package com.tunedin.backend.controller

import com.tunedin.backend.model.TrackReview
import com.tunedin.backend.model.Opinion
import com.tunedin.backend.service.TrackReviewService
import com.tunedin.backend.service.CookieService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID
import jakarta.servlet.http.HttpServletRequest
import com.tunedin.backend.model.spotify.SpotifyErrorResponse
import org.springframework.http.HttpStatus
import org.slf4j.LoggerFactory

@RestController
@RequestMapping("/api/reviews")
class TrackReviewController(
    private val trackReviewService: TrackReviewService,
    private val cookieService: CookieService
) {
    private val logger = LoggerFactory.getLogger(TrackReviewController::class.java)

    @PostMapping
    fun saveTrackReview(@RequestBody review: TrackReview, httpRequest: HttpServletRequest): ResponseEntity<Any> {
        logger.info("Received save review request: $review")
        
        return cookieService.getUserId(httpRequest).fold(
            onSuccess = { userId ->
                try {
                    // Ensure the review belongs to the authenticated user
                    if (review.userId != userId) {
                        logger.error("User $userId is not authorized to create/update review for user ${review.userId}")
                        return ResponseEntity.status(403).body(mapOf("error" to "Not authorized to create/update this review"))
                    }
                    
                    logger.info("Processing review - userId: $userId, trackId: ${review.trackId}, opinion: ${review.opinion}")
                    
                    val savedReview = trackReviewService.saveTrackReview(review)
                    
                    logger.info("Successfully saved review with id: ${savedReview.id}")
                    ResponseEntity.ok(savedReview)
                } catch (e: Exception) {
                    logger.error("Error saving review: ${e.message}", e)
                    ResponseEntity.badRequest().body(mapOf("error" to (e.message ?: "Unknown error")))
                }
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get user ID"))
            }
        )
    }

    @GetMapping("/{id}")
    fun getTrackReviewById(@PathVariable id: UUID): ResponseEntity<TrackReview> {
        val review = trackReviewService.getTrackReviewById(id)
        return if (review != null) {
            ResponseEntity.ok(review)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @GetMapping("/user")
    fun getAllReviewsByUserId(
        request: HttpServletRequest,
        @RequestParam(required = false) opinions: List<Opinion>?
    ): ResponseEntity<Any> {
        return cookieService.getUserId(request).fold(
            onSuccess = { userId ->
                val reviews = trackReviewService.getAllTrackReviewsByUserId(userId, opinions)
                ResponseEntity.ok(reviews)
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get user ID"))
            }
        )
    }
    
    @DeleteMapping("/{id}")
    fun deleteTrackReview(@PathVariable id: UUID, request: HttpServletRequest): ResponseEntity<Any> {
        return cookieService.getUserId(request).fold(
            onSuccess = { userId ->
                // Get the review to check if it belongs to the user
                val review = trackReviewService.getTrackReviewById(id)
                if (review == null) {
                    return ResponseEntity.notFound().build()
                }
                
                // Check if the review belongs to the user
                if (review.userId != userId) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(SpotifyErrorResponse("You are not authorized to delete this review"))
                }
                
                val deleted = trackReviewService.deleteTrackReview(id)
                if (deleted) {
                    ResponseEntity.ok(mapOf("success" to true, "message" to "Review deleted successfully"))
                } else {
                    ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(SpotifyErrorResponse("Review not found"))
                }
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get user ID"))
            }
        )
    }
    
    @DeleteMapping("/track/{trackId}")
    fun deleteTrackReviewByTrackId(@PathVariable trackId: String, request: HttpServletRequest): ResponseEntity<Any> {
        return cookieService.getUserId(request).fold(
            onSuccess = { userId ->
                val deleted = trackReviewService.deleteTrackReviewByUserIdAndTrackId(userId, trackId)
                if (deleted) {
                    ResponseEntity.ok(mapOf("success" to true, "message" to "Review deleted successfully"))
                } else {
                    ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(SpotifyErrorResponse("Review not found"))
                }
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get user ID"))
            }
        )
    }

    @PostMapping("/batch/tracks")
    fun getTrackReviewsByTrackIds(@RequestBody trackIds: List<String>): ResponseEntity<Map<String, List<TrackReview>>> {
        val reviewsByTrackId = trackReviewService.getTrackReviewsByTrackIds(trackIds)
        return ResponseEntity.ok(reviewsByTrackId)
    }
}