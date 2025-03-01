package com.tunedin.backend.service

import com.tunedin.backend.model.SpotifyUser
import com.tunedin.backend.model.spotify.SpotifyTokenResponse
import com.tunedin.backend.model.spotify.SpotifyUserProfile
import com.tunedin.backend.repository.SpotifyUserRepository
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class UserService(
    private val spotifyService: SpotifyService,
    private val spotifyUserRepository: SpotifyUserRepository
) {
    fun createOrUpdateUser(tokenResponse: SpotifyTokenResponse): SpotifyUser {
        // Get user profile from Spotify
        val userProfile = spotifyService.getUserProfile(tokenResponse.accessToken)
        
        // Calculate token expiration
        val expiresAt = Instant.now().plusSeconds(tokenResponse.expiresIn.toLong())
        
        // Create or update user
        val user = spotifyUserRepository.findById(userProfile.id).orElse(
            SpotifyUser(
                id = userProfile.id,
                email = userProfile.email,
                displayName = userProfile.display_name ?: "Spotify User",
                profileImageUrl = userProfile.images?.firstOrNull()?.url,
                accessToken = tokenResponse.accessToken,
                refreshToken = tokenResponse.refreshToken,
                tokenExpiresAt = expiresAt,
                createdAt = Instant.now()
            )
        ).copy(
            email = userProfile.email,
            displayName = userProfile.display_name ?: "Spotify User",
            profileImageUrl = userProfile.images?.firstOrNull()?.url,
            accessToken = tokenResponse.accessToken,
            refreshToken = tokenResponse.refreshToken,
            tokenExpiresAt = expiresAt,
            updatedAt = Instant.now()
        )
        
        return spotifyUserRepository.save(user)
    }
    
    fun getValidAccessToken(userId: String): String {
        val user = spotifyUserRepository.findById(userId)
            .orElseThrow { RuntimeException("User not found") }
        
        // Check if token is expired
        if (Instant.now().isAfter(user.tokenExpiresAt)) {
            // Refresh token
            val tokenResponse = spotifyService.refreshAccessToken(user.refreshToken)
            val updatedUser = createOrUpdateUser(tokenResponse)
            return updatedUser.accessToken
        }
        
        return user.accessToken
    }
} 