package com.tunedin.backend.repository

import com.tunedin.backend.model.RankingEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface RankingRepository : JpaRepository<RankingEntity, Long> {
    fun findByTrackId(trackId: String): List<RankingEntity>
} 