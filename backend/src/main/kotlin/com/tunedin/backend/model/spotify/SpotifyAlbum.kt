package com.tunedin.backend.model.spotify

data class SpotifyAlbum(
    val album_type: String,
    val artists: List<SpotifyArtist>,
    val available_markets: List<String>,
    val external_urls: ExternalUrls,
    val href: String,
    val id: String,
    val images: List<SpotifyImage>,
    val name: String,
    val release_date: String,
    val release_date_precision: String,
    val total_tracks: Int,
    val type: String,
    val uri: String
)