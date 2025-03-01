package com.tunedin.backend.controller

import com.tunedin.backend.model.TrackReview
import com.tunedin.backend.model.Opinion
import com.tunedin.backend.service.TrackReviewService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

data class CreateReviewRequest(
    val userId: String,
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
    fun createReview(@RequestBody request: CreateReviewRequest): ResponseEntity<TrackReview> {
        val review = trackReviewService.createReview(
            userId = request.userId,
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

    @GetMapping("/user/{userId}")
    fun getReviewsByUserId(@PathVariable userId: String): ResponseEntity<List<TrackReview>> {
        val reviews = trackReviewService.getReviewsByUserId(userId)
        return ResponseEntity.ok(reviews)
    }
} 