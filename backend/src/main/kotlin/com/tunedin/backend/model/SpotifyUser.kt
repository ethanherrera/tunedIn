package com.tunedin.backend.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "spotify_users")
data class SpotifyUser(
    @Id
    val id: String,  // Spotify user ID
    val email: String?,
    val displayName: String,
    val profileImageUrl: String?,
    val accessToken: String,
    val refreshToken: String,
    val tokenExpiresAt: Instant,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
) 