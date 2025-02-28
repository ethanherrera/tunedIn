package com.tunedin.backend.model.spotify

import com.fasterxml.jackson.annotation.JsonProperty

data class SpotifyTokenResponse(
    @JsonProperty("access_token")
    val accessToken: String,
    
    @JsonProperty("token_type")
    val tokenType: String,
    
    @JsonProperty("scope")
    val scope: String,
    
    @JsonProperty("expires_in")
    val expiresIn: Int,
    
    @JsonProperty("refresh_token")
    val refreshToken: String
) 