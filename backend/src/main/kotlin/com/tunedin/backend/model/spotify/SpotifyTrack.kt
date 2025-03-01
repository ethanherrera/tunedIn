package com.tunedin.backend.models

data class SpotifyTrack(
    val album: SpotifyAlbum,
    val artists: List<SpotifyArtist>,
    val available_markets: List<String>,
    val disc_number: Int,
    val duration_ms: Long,
    val explicit: Boolean,
    val external_ids: ExternalIds,
    val external_urls: ExternalUrls,
    val href: String,
    val id: String,
    val is_local: Boolean,
    val name: String,
    val popularity: Int,
    val preview_url: String?,
    val track_number: Int,
    val type: String,
    val uri: String
)

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

data class SpotifyArtist(
    val external_urls: ExternalUrls,
    val href: String,
    val id: String,
    val name: String,
    val type: String,
    val uri: String
)

data class SpotifyImage(
    val url: String,
    val width: Int,
    val height: Int
)

data class ExternalUrls(
    val spotify: String
)

data class ExternalIds(
    val isrc: String
) 