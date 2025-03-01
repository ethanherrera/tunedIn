package com.tunedin.backend.model.spotify

data class SpotifyUserProfile(
    val id: String,
    val display_name: String?,
    val email: String?,
    val external_urls: Map<String, String>,
    val href: String,
    val images: List<Image>?,
    val uri: String
) 