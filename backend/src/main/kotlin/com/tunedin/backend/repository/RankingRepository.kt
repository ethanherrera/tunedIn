package com.tunedin.backend.repository

import com.google.firebase.cloud.FirestoreClient
import com.tunedin.backend.model.Ranking
import org.springframework.stereotype.Repository

@Repository
class RankingRepository {
    private val collection = FirestoreClient.getFirestore().collection("rankings")

    fun findById(id: String): Ranking? = 
        collection.document(id).get().get().toObject(Ranking::class.java)

    fun save(ranking: Ranking): Ranking {
        collection.document(ranking.id).set(ranking)
        return ranking
    }

    fun findAll(): List<Ranking> =
        collection.get().get().documents.mapNotNull { 
            it.toObject(Ranking::class.java) 
        }
} 