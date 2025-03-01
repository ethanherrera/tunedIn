package com.tunedin.backend.repository

import com.tunedin.backend.model.SpotifyUser
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

@Repository
interface SpotifyUserRepository : MongoRepository<SpotifyUser, String> 