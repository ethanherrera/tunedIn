package com.tunedin.backend.service.sql

import com.tunedin.backend.model.sql.SessionEntity
import com.tunedin.backend.repository.sql.SessionRepository
import org.springframework.stereotype.Service

@Service
class SessionService(private val sessionRepository: SessionRepository) {
    fun saveSession(session: SessionEntity) {
        sessionRepository.save(session)
    }

    fun getSession(userId: String): SessionEntity? {
        return sessionRepository.findByUserId(userId)
    }
} 