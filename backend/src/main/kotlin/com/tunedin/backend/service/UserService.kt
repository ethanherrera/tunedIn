package com.tunedin.backend.service

import com.tunedin.backend.model.*
import com.tunedin.backend.model.spotify.SpotifyTokenResponse
import com.tunedin.backend.model.spotify.SpotifyUserProfile
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
    
    fun createOrUpdateUser(tokenResponse: SpotifyTokenResponse): UserProfile {
        // Get user profile from Spotify
        val spotifyUserProfile = spotifyService.getUserProfile(tokenResponse.accessToken)
        
        // Calculate token expiration
        val expiresAt = Instant.now().plusSeconds(tokenResponse.expiresIn.toLong())
        
        // Check if profile already exists
        val existingProfile = getUserProfileById(spotifyUserProfile.id)
        
        // Convert Spotify profile images to our ImageObject format
        val images = spotifyUserProfile.images?.map { image ->
            ImageObject(
                url = image.url,
                height = image.height,
                width = image.width
            )
        }
        
        // Create external URLs object
        val externalUrls = ExternalUrls(
            spotify = spotifyUserProfile.external_urls["spotify"]
        )
        
        // For fields that might not be in the SpotifyUserProfile, we'll use null values
        // These will be populated if/when the Spotify API provides them
        
        val userProfile = if (existingProfile != null) {
            // Update existing profile with new data from Spotify
            existingProfile.copy(
                display_name = spotifyUserProfile.display_name,
                email = spotifyUserProfile.email,
                external_urls = externalUrls,
                href = spotifyUserProfile.href,
                images = images,
                uri = spotifyUserProfile.uri,
                accessToken = tokenResponse.accessToken,
                refreshToken = tokenResponse.refreshToken ?: existingProfile.refreshToken,
                tokenExpiresAt = expiresAt,
                updatedAt = Instant.now()
            )
        } else {
            // Create new profile with data from Spotify
            UserProfile(
                id = spotifyUserProfile.id,
                display_name = spotifyUserProfile.display_name,
                email = spotifyUserProfile.email,
                external_urls = externalUrls,
                href = spotifyUserProfile.href,
                images = images,
                uri = spotifyUserProfile.uri,
                accessToken = tokenResponse.accessToken,
                refreshToken = tokenResponse.refreshToken,
                tokenExpiresAt = expiresAt
            )
        }
        
        logger.info("Saving user profile for user ID: ${spotifyUserProfile.id}")
        return userProfileRepository.save(userProfile)
    }
    
    fun getValidAccessToken(userId: String): String {
        val userProfile = getUserProfileById(userId)
            ?.takeIf { it.accessToken != null && it.refreshToken != null && it.tokenExpiresAt != null }
            ?: throw RuntimeException("User profile not found or missing authentication data")
        
        // Check if token is expired
        if (userProfile.tokenExpiresAt != null && Instant.now().isAfter(userProfile.tokenExpiresAt)) {
            // Refresh token
            val tokenResponse = spotifyService.refreshAccessToken(userProfile.refreshToken!!)
            val updatedProfile = createOrUpdateUser(tokenResponse)
            return updatedProfile.accessToken ?: throw RuntimeException("Failed to refresh access token")
        }
        
        return userProfile.accessToken ?: throw RuntimeException("Access token not found")
    }
    
    // UserProfile methods
    
    fun saveUserProfile(userProfile: UserProfile): UserProfile {
        return userProfileRepository.save(userProfile)
    }
    
    fun getUserProfileById(userId: String): UserProfile? {
        return userProfileRepository.findById(userId).orElse(null)
    }
    
    fun addRecentActivity(userId: String, trackReview: TrackReview): UserProfile {
        val userProfile = getUserProfileById(userId)
            ?: throw RuntimeException("User profile not found for user ID: $userId")
        
        val recentActivity = RecentActivity(
            trackReview = trackReview,
            timestamp = Instant.now()
        )
        
        // Create a new list with the new activity at the beginning
        val updatedActivities = mutableListOf(recentActivity)
        
        // Add existing activities, limiting to the most recent 20
        updatedActivities.addAll(userProfile.recentActivities.take(19))
        
        val updatedProfile = userProfile.copy(
            recentActivities = updatedActivities,
            updatedAt = Instant.now()
        )
        
        return userProfileRepository.save(updatedProfile)
    }
} 