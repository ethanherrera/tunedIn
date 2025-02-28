package com.tunedin.backend.repository

import com.google.firebase.cloud.FirestoreClient
import com.tunedin.backend.model.Session
import org.springframework.stereotype.Repository

@Repository
class SpotifySessionRepository {
    private val collection = FirestoreClient.getFirestore().collection("sessions")

    fun saveSession(userId: String, session: Session) {
        collection.document(userId).set(session)
    }

    fun getSession(userId: String): Session? {
        return collection.document(userId).get().get().toObject(Session::class.java)
    }
} 