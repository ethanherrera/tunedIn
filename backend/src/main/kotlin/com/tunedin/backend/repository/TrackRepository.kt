package com.tunedin.backend.repository

import com.google.firebase.cloud.FirestoreClient
import com.tunedin.backend.model.Track
import org.springframework.stereotype.Repository

@Repository
class TrackRepository {
    private val collection = FirestoreClient.getFirestore().collection("tracks")

    fun findById(id: String): Track? = 
        collection.document(id).get().get().toObject(Track::class.java)

    fun save(track: Track): Track {
        collection.document(track.id).set(track)
        return track
    }

    fun findAll(): List<Track> =
        collection.get().get().documents.mapNotNull { 
            it.toObject(Track::class.java) 
        }
} 