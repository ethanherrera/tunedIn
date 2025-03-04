package com.tunedin.backend.repository

import com.tunedin.backend.model.Friendship
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.data.mongodb.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface FriendshipRepository : MongoRepository<Friendship, String> {
    // Find friendship between two users (in either direction)
    @Query("{ '\$or': [ { 'userId1': ?0, 'userId2': ?1 }, { 'userId1': ?1, 'userId2': ?0 } ] }")
    fun findFriendshipBetweenUsers(userId1: String, userId2: String): Friendship?
    
    // Find all friendships for a user
    @Query("{ '\$or': [ { 'userId1': ?0 }, { 'userId2': ?0 } ] }")
    fun findAllFriendshipsForUser(userId: String): List<Friendship>
} 