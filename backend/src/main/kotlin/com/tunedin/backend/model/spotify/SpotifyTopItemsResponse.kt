package com.tunedin.backend.model.spotify

data class SpotifyTopItemsResponse<T>(
    val items: List<T>,
    val href: String,
    val limit: Int,
    val next: String?,
    val offset: Int,
    val previous: String?,
    val total: Int
) 