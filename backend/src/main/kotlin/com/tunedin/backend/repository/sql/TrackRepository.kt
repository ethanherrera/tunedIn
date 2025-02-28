package com.tunedin.backend.repository.sql

import com.tunedin.backend.model.sql.TrackEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface TrackRepository : JpaRepository<TrackEntity, Long> {
    fun findBySpotifyId(spotifyId: String): TrackEntity?
} 