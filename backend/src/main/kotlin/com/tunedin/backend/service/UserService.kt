package com.tunedin.backend.service

import com.tunedin.backend.model.*
import com.tunedin.backend.model.spotify.SpotifyTokenResponse
import com.tunedin.backend.repository.UserProfileRepository
import org.springframework.stereotype.Service
import java.time.Instant
import org.slf4j.LoggerFactory

@Service
class UserService(
    private val spotifyService: SpotifyService,
    private val userProfileRepository: UserProfileRepository
) {
    private val logger = LoggerFactory.getLogger(UserService::class.java)
    
    fun saveUser(tokenResponse: SpotifyTokenResponse): UserProfile {
        val spotifyUserProfile = spotifyService.getUserProfile(tokenResponse.accessToken)

        val existingProfile = getUserProfileById(spotifyUserProfile.id)
        
        val images = spotifyUserProfile.images?.map { image ->
            ImageObject(
                url = image.url,
                height = image.height,
                width = image.width
            )
        }
        
        val externalUrls = ExternalUrls(
            spotify = spotifyUserProfile.external_urls["spotify"]
        )
        
        val userProfile = existingProfile?.copy(
            display_name = spotifyUserProfile.display_name,
            email = spotifyUserProfile.email,
            external_urls = externalUrls,
            href = spotifyUserProfile.href,
            images = images,
            uri = spotifyUserProfile.uri,
            accessToken = tokenResponse.accessToken,
            refreshToken = tokenResponse.refreshToken ?: existingProfile.refreshToken,
            updatedAt = Instant.now()
        )
            ?: UserProfile(
                id = spotifyUserProfile.id,
                display_name = spotifyUserProfile.display_name,
                email = spotifyUserProfile.email,
                external_urls = externalUrls,
                href = spotifyUserProfile.href,
                images = images,
                uri = spotifyUserProfile.uri,
                accessToken = tokenResponse.accessToken,
                refreshToken = tokenResponse.refreshToken,
            )
        
        logger.info("Saving user profile for user ID: ${spotifyUserProfile.id}")
        return userProfileRepository.save(userProfile)
    }
    
    fun getUserProfileById(userId: String): UserProfile? {
        return userProfileRepository.findById(userId).orElse(null)
    }
} 