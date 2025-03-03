package com.tunedin.backend.controller

import com.tunedin.backend.model.AlbumOpinion
import com.tunedin.backend.model.AlbumReview
import com.tunedin.backend.service.AlbumReviewService
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

    @GetMapping("/user/{userId}")
    fun getAlbumReviewsByUserId(@PathVariable userId: String): ResponseEntity<List<AlbumReview>> {
        return ResponseEntity.ok(albumReviewService.getAlbumReviewsByUserId(userId))
    }

    @GetMapping("/album/{spotifyAlbumId}")
    fun getAlbumReviewsBySpotifyAlbumId(@PathVariable spotifyAlbumId: String): ResponseEntity<List<AlbumReview>> {
        return ResponseEntity.ok(albumReviewService.getAlbumReviewsBySpotifyAlbumId(spotifyAlbumId))
    }

    @GetMapping("/user/{userId}/album/{spotifyAlbumId}")
    fun getUserAlbumReview(
        @PathVariable userId: String,
        @PathVariable spotifyAlbumId: String
    ): ResponseEntity<AlbumReview> {
        val review = albumReviewService.getUserAlbumReview(userId, spotifyAlbumId)
        return if (review != null) {
            ResponseEntity.ok(review)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @PostMapping("/save")
    fun saveAlbumReview(@RequestBody albumReviewRequest: AlbumReviewRequest): ResponseEntity<AlbumReview> {
        try {
            // Check if the user already has a review for this album
            val existingReview = albumReviewService.getUserAlbumReview(
                albumReviewRequest.userId,
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
                    userId = albumReviewRequest.userId,
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        }
    }

    @DeleteMapping("/{id}")
    fun deleteAlbumReview(@PathVariable id: UUID): ResponseEntity<Void> {
        return try {
            albumReviewService.deleteAlbumReview(id)
            ResponseEntity.noContent().build()
        } catch (e: NoSuchElementException) {
            ResponseEntity.notFound().build()
        }
    }
}

data class AlbumReviewRequest(
    val userId: String,
    val spotifyAlbumId: String,
    val description: String,
    val ranking: Int = 0,
    val genres: List<String> = emptyList(),
    val spotifyTrackIds: List<String> = emptyList()
) 