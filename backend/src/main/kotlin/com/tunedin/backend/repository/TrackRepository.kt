package com.tunedin.backend.repository

import com.tunedin.backend.model.TrackEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface TrackRepository : JpaRepository<TrackEntity, Long> {
    fun findBySpotifyId(spotifyId: String): TrackEntity?
} 