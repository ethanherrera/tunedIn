package com.tunedin.backend.repository

import com.tunedin.backend.model.SessionEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SessionRepository : JpaRepository<SessionEntity, Long> {
    fun findByUserId(userId: String): SessionEntity?
} 