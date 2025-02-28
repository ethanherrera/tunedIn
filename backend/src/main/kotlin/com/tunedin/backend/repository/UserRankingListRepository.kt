package com.tunedin.backend.repository

import com.google.firebase.cloud.FirestoreClient
import com.tunedin.backend.model.UserRankingList
import org.springframework.stereotype.Repository

@Repository
class UserRankingListRepository {
    private val collection = FirestoreClient.getFirestore().collection("userRankingLists")

    fun findById(id: String): UserRankingList? = 
        collection.document(id).get().get().toObject(UserRankingList::class.java)

    fun save(userRankingList: UserRankingList): UserRankingList {
        collection.document(userRankingList.id).set(userRankingList)
        return userRankingList
    }

    fun findAll(): List<UserRankingList> =
        collection.get().get().documents.mapNotNull { 
            it.toObject(UserRankingList::class.java) 
        }
} 