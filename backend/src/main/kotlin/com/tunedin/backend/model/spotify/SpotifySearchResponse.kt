package com.tunedin.backend.model.spotify

data class SpotifySearchResponse(
    val tracks: PagingObject<Track>?,
    val artists: PagingObject<Artist>?,
    val albums: PagingObject<Album>?,
    val playlists: PagingObject<Playlist>?
)

data class PagingObject<T>(
    val href: String,
    val items: List<T>,
    val limit: Int,
    val next: String?,
    val offset: Int,
    val previous: String?,
    val total: Int
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
    val images: List<Image>,
    val artists: List<Artist>
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