package com.tunedin.backend.service

import com.tunedin.backend.model.SessionEntity
import com.tunedin.backend.repository.SessionRepository
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