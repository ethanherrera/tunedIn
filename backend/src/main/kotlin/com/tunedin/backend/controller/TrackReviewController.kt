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

data class CreateReviewRequest(
    val spotifyTrackId: String,
    val opinion: Opinion,
    val description: String,
    val rating: Double,
    val ranking: Int = 0
)

@RestController
@RequestMapping("/api/reviews")
class TrackReviewController(
    private val trackReviewService: TrackReviewService
) {
    private val logger = LoggerFactory.getLogger(TrackReviewController::class.java)

    /**
     * Create a new track review
     */
    @PostMapping
    fun createReview(@RequestBody request: Map<String, Any>, httpRequest: HttpServletRequest): ResponseEntity<*> {
        logger.info("Received create review request: ${request}")
        
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
            
            logger.info("Parsed create review request - userId: $userId, trackId: $spotifyTrackId, opinion: $opinion, ranking: $ranking")
            
            val review = trackReviewService.createReview(
                userId = userId,
                spotifyTrackId = spotifyTrackId,
                opinion = opinion,
                description = description,
                rating = 5.0, // Default rating, will be updated by rescoreReviews
                ranking = ranking,
                accessToken = accessToken
            )
            
            logger.info("Successfully created review with id: ${review.id}")
            return ResponseEntity.ok(review)
        } catch (e: Exception) {
            logger.error("Error creating review: ${e.message}", e)
            return ResponseEntity.badRequest().body(mapOf("error" to (e.message ?: "Unknown error")))
        }
    }

    /**
     * Update an existing track review
     */
    @PutMapping("/{id}")
    fun updateReview(@PathVariable id: UUID, @RequestBody request: Map<String, Any>, httpRequest: HttpServletRequest): ResponseEntity<Any> {
        logger.info("Received update review request for id $id: ${request}")
        
        try {
            val cookiesInfo = httpRequest.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val userId = httpRequest.cookies?.find { it.name == "userId" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
            
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
            
            logger.info("Parsed update review request - userId: $userId, trackId: $spotifyTrackId, opinion: $opinion, ranking: $ranking")
            
            val existingReview = trackReviewService.getReviewById(id)
            if (existingReview == null) {
                logger.error("Review not found with id: $id")
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
            }
            
            if (existingReview.userId != userId) {
                logger.error("User $userId is not authorized to update review $id owned by ${existingReview.userId}")
                return ResponseEntity.status(403).body(mapOf("error" to "Not authorized to update this review"))
            }
            
            val updatedReview = trackReviewService.updateReview(
                id = id,
                userId = userId,
                spotifyTrackId = spotifyTrackId,
                opinion = opinion,
                description = description,
                rating = 5.0, // Default rating, will be updated by rescoreReviews
                ranking = ranking
            )
            
            logger.info("Successfully updated review with id: $id")
            return ResponseEntity.ok(updatedReview)
        } catch (e: Exception) {
            logger.error("Error updating review: ${e.message}", e)
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
    fun getReviewsByUserId(
        request: HttpServletRequest,
        @RequestParam(required = false) opinions: List<Opinion>?
    ): ResponseEntity<*> {
        val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = request.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
        
        val reviews = trackReviewService.getReviewsByUserId(userId, opinions)
        return ResponseEntity.ok(reviews)
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
    fun deleteReviewByTrackId(@PathVariable spotifyTrackId: String, request: HttpServletRequest): ResponseEntity<*> {
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
     * Endpoint to manually trigger the rescoring of all reviews for the current user.
     * This will redistribute ratings according to the opinion categories:
     * - Liked reviews: 7.0-10.0
     * - Neutral reviews: 4.0-6.9
     * - Disliked reviews: 0.0-3.9
     */
    @PostMapping("/rescore")
    fun rescoreReviews(request: HttpServletRequest): ResponseEntity<*> {
        val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = request.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
        
        trackReviewService.rescoreReviews(userId)
        
        // Return the updated reviews
        val updatedReviews = trackReviewService.getReviewsByUserId(userId)
        return ResponseEntity.ok(mapOf(
            "success" to true, 
            "message" to "Reviews rescored successfully",
            "reviews" to updatedReviews
        ))
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