package com.tunedin.backend.service

import com.tunedin.backend.model.Session
import com.tunedin.backend.repository.SpotifySessionRepository
import org.springframework.stereotype.Service

@Service
class SessionService(private val sessionRepository: SpotifySessionRepository) {
    fun saveSession(userId: String, session: Session) {
        sessionRepository.saveSession(userId, session)
    }

    fun getSession(userId: String): Session? {
        return sessionRepository.getSession(userId)
    }
} 