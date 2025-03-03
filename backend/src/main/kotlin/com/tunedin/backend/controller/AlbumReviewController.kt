package com.tunedin.backend.controller

import com.tunedin.backend.model.AlbumOpinion
import com.tunedin.backend.model.AlbumReview
import com.tunedin.backend.model.spotify.SpotifyErrorResponse
import com.tunedin.backend.service.AlbumReviewService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/album-reviews")
class AlbumReviewController(private val albumReviewService: AlbumReviewService) {

    @GetMapping
    fun getAllAlbumReviews(): ResponseEntity<List<AlbumReview>> {
        return ResponseEntity.ok(albumReviewService.getAllAlbumReviews())
    }

    @GetMapping("/{id}")
    fun getAlbumReviewById(@PathVariable id: UUID): ResponseEntity<AlbumReview> {
        val review = albumReviewService.getAlbumReviewById(id)
        return if (review != null) {
            ResponseEntity.ok(review)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @GetMapping("/user")
    fun getAlbumReviewsByUserId(request: HttpServletRequest): ResponseEntity<Any> {
        val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = request.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
        
        return ResponseEntity.ok(albumReviewService.getAlbumReviewsByUserId(userId))
    }

    @GetMapping("/album/{spotifyAlbumId}")
    fun getAlbumReviewsBySpotifyAlbumId(@PathVariable spotifyAlbumId: String): ResponseEntity<List<AlbumReview>> {
        return ResponseEntity.ok(albumReviewService.getAlbumReviewsBySpotifyAlbumId(spotifyAlbumId))
    }

    @GetMapping("/user/album/{spotifyAlbumId}")
    fun getUserAlbumReview(
        request: HttpServletRequest,
        @PathVariable spotifyAlbumId: String
    ): ResponseEntity<Any> {
        val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = request.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
        
        val review = albumReviewService.getUserAlbumReview(userId, spotifyAlbumId)
        return if (review != null) {
            ResponseEntity.ok(review)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @PostMapping("/save")
    fun saveAlbumReview(
        @RequestBody albumReviewRequest: AlbumReviewRequest,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        try {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val userId = request.cookies?.find { it.name == "userId" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
            
            // Check if the user already has a review for this album
            val existingReview = albumReviewService.getUserAlbumReview(
                userId,
                albumReviewRequest.spotifyAlbumId
            )
            
            val albumReview = if (existingReview != null) {
                // Update existing review
                existingReview.description = albumReviewRequest.description
                existingReview.ranking = albumReviewRequest.ranking
                existingReview.genres = albumReviewRequest.genres
                existingReview.spotifyTrackIds = albumReviewRequest.spotifyTrackIds
                
                albumReviewService.updateAlbumReview(existingReview.id, existingReview)
            } else {
                // Create new review
                val newReview = AlbumReview(
                    userId = userId,
                    spotifyAlbumId = albumReviewRequest.spotifyAlbumId,
                    description = albumReviewRequest.description,
                    ranking = albumReviewRequest.ranking,
                    genres = albumReviewRequest.genres,
                    spotifyTrackIds = albumReviewRequest.spotifyTrackIds
                )
                
                albumReviewService.createAlbumReview(newReview)
            }
            
            return ResponseEntity.ok(albumReview)
        } catch (e: Exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(SpotifyErrorResponse("Failed to save album review: ${e.message}"))
        }
    }

    @DeleteMapping("/{id}")
    fun deleteAlbumReview(
        @PathVariable id: UUID,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        try {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val userId = request.cookies?.find { it.name == "userId" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
            
            // Get the review to check if it belongs to the user
            val review = albumReviewService.getAlbumReviewById(id)
                ?: return ResponseEntity.notFound().build()
            
            // Check if the review belongs to the user
            if (review.userId != userId) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(SpotifyErrorResponse("You are not authorized to delete this review"))
            }
            
            albumReviewService.deleteAlbumReview(id)
            return ResponseEntity.noContent().build()
        } catch (e: NoSuchElementException) {
            return ResponseEntity.notFound().build()
        }
    }
}

data class AlbumReviewRequest(
    val spotifyAlbumId: String,
    val description: String,
    val ranking: Int = 0,
    val genres: List<String> = emptyList(),
    val spotifyTrackIds: List<String> = emptyList()
) 