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
    @PostMapping
    fun createReview(@RequestBody request: CreateReviewRequest, httpRequest: HttpServletRequest): ResponseEntity<*> {
        val cookiesInfo = httpRequest.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = httpRequest.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
        
        val review = trackReviewService.createReview(
            userId = userId,
            spotifyTrackId = request.spotifyTrackId,
            opinion = request.opinion,
            description = request.description,
            rating = request.rating,
            ranking = request.ranking
        )
        return ResponseEntity.ok(review)
    }

    @PutMapping("/{id}")
    fun updateReview(
        @PathVariable id: UUID,
        @RequestBody request: CreateReviewRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<Any> {
        val cookiesInfo = httpRequest.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = httpRequest.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))

        // Get the review to check if it exists and belongs to the user
        val existingReview = trackReviewService.getReviewById(id)
            ?: return ResponseEntity.notFound().build()

        // Check if the review belongs to the user
        if (existingReview.userId != userId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(SpotifyErrorResponse("You are not authorized to update this review"))
        }

        val updatedReview = trackReviewService.updateReview(
            id = id,
            userId = userId,
            spotifyTrackId = request.spotifyTrackId,
            opinion = request.opinion,
            description = request.description,
            rating = request.rating,
            ranking = request.ranking
        )
        return ResponseEntity.ok(updatedReview)
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
     * Batch endpoint to get the current user's reviews for multiple tracks
     */
    @PostMapping("/batch/tracks")
    fun getReviewsByTrackIds(@RequestBody spotifyTrackIds: List<String>, request: HttpServletRequest): ResponseEntity<*> {
        val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = request.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
        
        val reviewsByTrackId = trackReviewService.getUserReviewsByTrackIds(userId, spotifyTrackIds)
        return ResponseEntity.ok(reviewsByTrackId)
    }
}