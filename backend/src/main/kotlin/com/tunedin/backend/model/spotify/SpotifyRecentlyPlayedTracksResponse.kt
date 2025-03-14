package com.tunedin.backend.model.spotify

data class SpotifyRecentlyPlayedTracksResponse(
    val href: String,
    val limit: Int,
    val next: String?,
    val cursors: Cursors,
    val total: Int,
    val items: List<PlayHistoryItem>
)

data class Cursors(
    val after: String,
    val before: String
)

data class PlayHistoryItem(
    val track: SpotifyTrack,
    val played_at: String,
    val context: PlayContext?
)

data class PlayContext(
    val type: String,
    val href: String,
    val external_urls: ExternalUrls,
    val uri: String
)
