package com.tunedin.backend.repository.sql

import com.tunedin.backend.model.sql.RankingEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface RankingRepository : JpaRepository<RankingEntity, Long> {
    fun findByTrackId(trackId: String): List<RankingEntity>
} 