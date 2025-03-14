package com.tunedin.backend.model.spotify

data class SpotifySearchResponse(
    val tracks: PagingObject<Track>?,
    val artists: PagingObject<Artist>?,
    val albums: PagingObject<Album>?,
    val playlists: PagingObject<Playlist>?
)

data class Track(
    val id: String,
    val name: String,
    val uri: String,
    val href: String,
    val popularity: Int,
    val preview_url: String?,
    val explicit: Boolean,
    val artists: List<Artist>,
    val album: Album
)

data class Artist(
    val id: String,
    val name: String,
    val uri: String,
    val href: String,
    val popularity: Int?,
    val genres: List<String>?,
    val images: List<Image>?
)

data class Album(
    val id: String,
    val name: String,
    val uri: String,
    val href: String,
    val album_type: String,
    val release_date: String,
    val release_date_precision: String,
    val total_tracks: Int,
    val available_markets: List<String>,
    val images: List<Image>,
    val artists: List<Artist>,
    val external_urls: Map<String, String>,
    val type: String,
    val copyrights: List<Copyright>? = null,
    val external_ids: Map<String, String>? = null,
    val genres: List<String>? = null,
    val label: String? = null,
    val popularity: Int? = null,
    val restrictions: Restrictions? = null,
    val tracks: PagingObject<SimplifiedTrack>? = null
)

data class Playlist(
    val id: String,
    val name: String,
    val uri: String,
    val href: String,
    val description: String?,
    val owner: User,
    val images: List<Image>
)

data class Image(
    val url: String,
    val height: Int?,
    val width: Int?
)

data class User(
    val id: String,
    val display_name: String?,
    val href: String,
    val uri: String
)

data class Copyright(
    val text: String,
    val type: String
)

data class Restrictions(
    val reason: String
)

data class SimplifiedTrack(
    val id: String,
    val name: String,
    val uri: String,
    val href: String,
    val preview_url: String?,
    val explicit: Boolean,
    val duration_ms: Int,
    val track_number: Int,
    val disc_number: Int,
    val artists: List<Artist>,
    val available_markets: List<String>,
    val external_urls: Map<String, String>,
    val type: String,
    val is_playable: Boolean? = null,
    val linked_from: LinkedTrack? = null,
    val restrictions: Restrictions? = null,
    val is_local: Boolean
)

data class LinkedTrack(
    val id: String,
    val uri: String,
    val href: String,
    val type: String,
    val external_urls: Map<String, String>
) 