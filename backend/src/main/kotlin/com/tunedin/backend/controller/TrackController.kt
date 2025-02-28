package com.tunedin.backend.controller

import com.tunedin.backend.model.Track
import com.tunedin.backend.repository.TrackRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/tracks")
class TrackController(private val trackRepository: TrackRepository) {
    
    @GetMapping("/{id}")
    fun getTrackById(@PathVariable id: String): ResponseEntity<Track> {
        return trackRepository.findById(id)?.let {
            ResponseEntity.ok(it)
        } ?: ResponseEntity.notFound().build()
    }
} 