package com.tunedin.backend.model.spotify

data class SpotifyCallbackResponse(
    val code: String,
    val state: String
) 