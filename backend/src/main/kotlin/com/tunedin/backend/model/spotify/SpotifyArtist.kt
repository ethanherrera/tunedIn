package com.tunedin.backend.model.spotify

data class SpotifyArtist(
    val external_urls: ExternalUrls,
    val href: String,
    val id: String,
    val name: String,
    val type: String,
    val uri: String
)