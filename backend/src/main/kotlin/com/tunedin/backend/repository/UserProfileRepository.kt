package com.tunedin.backend.repository

import com.tunedin.backend.model.UserProfile
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

@Repository
interface UserProfileRepository : MongoRepository<UserProfile, String> {
    // No need for custom finder methods since the ID is already the primary key
} 