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
    val description: String
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
            description = request.description
        )
        return ResponseEntity.ok(review)
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
    fun getReviewsByUserId(request: HttpServletRequest): ResponseEntity<*> {
        val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
        val userId = request.cookies?.find { it.name == "userId" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
        
        val reviews = trackReviewService.getReviewsByUserId(userId)
        return ResponseEntity.ok(reviews)
    }
}