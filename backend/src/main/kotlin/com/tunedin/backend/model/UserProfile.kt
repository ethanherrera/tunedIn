package com.tunedin.backend.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "user_profiles")
data class UserProfile(
    @Id
    val id: String,
    val country: String? = null,
    val display_name: String? = null,
    val email: String? = null,
    val explicit_content: ExplicitContent? = null,
    val external_urls: ExternalUrls? = null,
    val followers: Followers? = null,
    val href: String? = null,
    val images: List<ImageObject>? = null,
    val product: String? = null,
    val type: String? = null,
    val uri: String? = null,
    val accessToken: String? = null,
    val refreshToken: String? = null,
    val friendIds: List<String> = emptyList(),
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
)

data class ExplicitContent(
    val filter_enabled: Boolean = false,
    val filter_locked: Boolean = false
)

data class ExternalUrls(
    val spotify: String? = null
)

data class Followers(
    val href: String? = null,
    val total: Int = 0
)

data class ImageObject(
    val url: String,
    val height: Int? = null,
    val width: Int? = null
)

data class RecentActivity(
    val id: String = java.util.UUID.randomUUID().toString(),
    val trackReview: TrackReview,
    val timestamp: Instant = Instant.now()
) 