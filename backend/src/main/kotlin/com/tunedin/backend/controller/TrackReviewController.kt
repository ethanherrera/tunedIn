package com.tunedin.backend.controller

import com.tunedin.backend.model.TrackReview
import com.tunedin.backend.model.Opinion
import com.tunedin.backend.service.TrackReviewService
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
    private val trackReviewService: TrackReviewService
) {
    private val logger = LoggerFactory.getLogger(TrackReviewController::class.java)

    /**
     * Save a track review (create new or update existing)
     */
    @PostMapping
    fun saveReview(@RequestBody request: Map<String, Any>, httpRequest: HttpServletRequest): ResponseEntity<Any> {
        logger.info("Received save review request: ${request}")
        
        try {
            val cookiesInfo = httpRequest.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val userId = httpRequest.cookies?.find { it.name == "userId" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
            
            val accessToken = httpRequest.cookies?.find { it.name == "accessToken" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("Access token not found in cookies. Available cookies: [$cookiesInfo]"))
            
            val spotifyTrackId = request["spotifyTrackId"] as? String
                ?: return ResponseEntity.badRequest().body(mapOf("error" to "spotifyTrackId is required"))
            val opinionStr = request["opinion"] as? String
                ?: return ResponseEntity.badRequest().body(mapOf("error" to "opinion is required"))
            val opinion = try {
                Opinion.valueOf(opinionStr)
            } catch (e: IllegalArgumentException) {
                return ResponseEntity.badRequest().body(mapOf("error" to "Invalid opinion value: $opinionStr"))
            }
            val description = request["description"] as? String ?: ""
            val ranking = (request["ranking"] as? Number)?.toInt() ?: 0
            
            // Check if this is an update (ID is provided)
            val reviewId = request["id"] as? String
            if (reviewId != null) {
                // This is an update to an existing review
                val id = try {
                    UUID.fromString(reviewId)
                } catch (e: IllegalArgumentException) {
                    return ResponseEntity.badRequest().body(mapOf("error" to "Invalid review ID format"))
                }
                
                // Verify the review exists and belongs to the user
                val existingReview = trackReviewService.getReviewById(id)
                if (existingReview == null) {
                    logger.error("Review not found with id: $id")
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
                }
                
                if (existingReview.userId != userId) {
                    logger.error("User $userId is not authorized to update review $id owned by ${existingReview.userId}")
                    return ResponseEntity.status(403).body(mapOf("error" to "Not authorized to update this review"))
                }
                
                logger.info("Updating existing review with id: $id")
            }
            
            logger.info("Processing review - userId: $userId, trackId: $spotifyTrackId, opinion: $opinion, ranking: $ranking")
            
            val review = trackReviewService.saveReview(
                userId = userId,
                spotifyTrackId = spotifyTrackId,
                opinion = opinion,
                description = description,
                rating = request["rating"] as? Double ?: 5.0, // Default rating, will be updated by rescoreReviews
                ranking = ranking,
                accessToken = accessToken
            )
            
            val action = if (reviewId != null) "updated" else "created"
            logger.info("Successfully $action review with id: ${review.id}")
            return ResponseEntity.ok(review)
        } catch (e: Exception) {
            logger.error("Error saving review: ${e.message}", e)
            return ResponseEntity.badRequest().body(mapOf("error" to (e.message ?: "Unknown error")))
        }
    }

    @GetMapping("/{id}")
    fun getReviewById(@PathVariable id: UUID): ResponseEntity<TrackReview> {
        val review = trackReviewService.getReviewById(id)
        return if (review != null) {
            ResponseEntity.ok(review)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @GetMapping("/track/{spotifyTrackId}")
    fun getReviewsByTrackId(@PathVariable spotifyTrackId: String): ResponseEntity<List<TrackReview>> {
        val reviews = trackReviewService.getReviewsByTrackId(spotifyTrackId)
        return ResponseEntity.ok(reviews)
    }

    @GetMapping("/user")
    fun getReviewsByUserIdCookie(
        request: HttpServletRequest,
        @RequestParam(required = false) opinions: List<Opinion>?
    ): ResponseEntity<Any> {
        val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = request.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
        
        val reviews = trackReviewService.getReviewsByUserId(userId, opinions)
        return ResponseEntity.ok(reviews)
    }
    
    @GetMapping("/user/{userId}")
    fun getReviewsByUserId(
        @PathVariable userId: String,
        @RequestParam(required = false) opinions: List<Opinion>?
    ): ResponseEntity<Any> {
        try {
            val reviews = trackReviewService.getReviewsByUserId(userId, opinions)
            return ResponseEntity.ok(reviews)
        } catch (e: Exception) {
            logger.error("Error getting reviews for user $userId: ${e.message}", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to (e.message ?: "Unknown error")))
        }
    }
    
    @DeleteMapping("/{id}")
    fun deleteReview(@PathVariable id: UUID, request: HttpServletRequest): ResponseEntity<Any> {
        val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = request.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
        
        // Get the review to check if it belongs to the user
        val review = trackReviewService.getReviewById(id)
        if (review == null) {
            return ResponseEntity.notFound().build()
        }
        
        // Check if the review belongs to the user
        if (review.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(SpotifyErrorResponse("You are not authorized to delete this review"))
        }
        
        val deleted = trackReviewService.deleteReview(id)
        return if (deleted) {
            ResponseEntity.ok(mapOf("success" to true, "message" to "Review deleted successfully"))
        } else {
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(SpotifyErrorResponse("Review not found"))
        }
    }
    
    @DeleteMapping("/track/{spotifyTrackId}")
    fun deleteReviewByTrackId(@PathVariable spotifyTrackId: String, request: HttpServletRequest): ResponseEntity<Any> {
        val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = request.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
        
        val deleted = trackReviewService.deleteReviewByUserIdAndTrackId(userId, spotifyTrackId)
        return if (deleted) {
            ResponseEntity.ok(mapOf("success" to true, "message" to "Review deleted successfully"))
        } else {
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(SpotifyErrorResponse("Review not found"))
        }
    }

    /**
     * Batch endpoint to get multiple reviews by their IDs
     */
    @PostMapping("/batch")
    fun getReviewsByIds(@RequestBody reviewIds: List<UUID>): ResponseEntity<List<TrackReview>> {
        val reviews = trackReviewService.getReviewsByIds(reviewIds)
        return ResponseEntity.ok(reviews)
    }

    /**
     * Batch endpoint to get reviews for multiple tracks
     */
    @PostMapping("/batch/tracks")
    fun getReviewsByTrackIds(@RequestBody spotifyTrackIds: List<String>): ResponseEntity<Map<String, List<TrackReview>>> {
        val reviewsByTrackId = trackReviewService.getReviewsByTrackIds(spotifyTrackIds)
        return ResponseEntity.ok(reviewsByTrackId)
    }
}