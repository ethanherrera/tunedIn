package com.tunedin.backend.service

import com.tunedin.backend.model.spotify.*
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.*
import org.springframework.stereotype.Service
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.client.RestTemplate
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import org.springframework.web.util.UriComponentsBuilder
import java.net.URLEncoder
import java.util.*

@Service
class SpotifyService(
    @Value("\${spotify.client.id}") private val clientId: String,
    @Value("\${spotify.client.secret}") private val clientSecret: String,
    @Value("\${spotify.redirect.uri}") private val redirectUri: String,
) {
    companion object {
        private const val SPOTIFY_ACCESS_TOKEN = "spotify_access_token"
        private const val SPOTIFY_REFRESH_TOKEN = "spotify_refresh_token"
    }

    private val scopes = listOf(
        "user-read-private",
        "user-read-email",
        "playlist-read-private",
        "playlist-modify-public",
        "playlist-modify-private",
        "user-top-read"
    )

    fun generateAuthUrl(): String {
        val state = UUID.randomUUID().toString()
        val scope = scopes.joinToString(" ")
        
        return "https://accounts.spotify.com/authorize?" + 
            "response_type=code" +
            "&client_id=$clientId" +
            "&scope=${URLEncoder.encode(scope, "UTF-8")}" +
            "&redirect_uri=${URLEncoder.encode(redirectUri, "UTF-8")}" +
            "&state=$state"
    }

    fun exchangeCode(code: String): SpotifyTokenResponse {
        val restTemplate = RestTemplate()
        
        // Create headers with Basic auth using client credentials
        val headers = HttpHeaders()
        val credentials = "$clientId:$clientSecret"
        val encodedCredentials = Base64.getEncoder().encodeToString(credentials.toByteArray())
        headers.set("Authorization", "Basic $encodedCredentials")
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        // Create request body
        val body = LinkedMultiValueMap<String, String>()
        body.add("grant_type", "authorization_code")
        body.add("code", code)
        body.add("redirect_uri", redirectUri)

        // Make the request
        val request = HttpEntity(body, headers)
        val response = restTemplate.exchange(
            "https://accounts.spotify.com/api/token",
            HttpMethod.POST,
            request,
            SpotifyTokenResponse::class.java
        )

        val tokenResponse = response.body ?: throw RuntimeException("Failed to get token response")
        
        return tokenResponse
    }

    fun search(
        query: String,
        type: String,
        limit: Int,
        offset: Int,
        market: String?,
        accessToken: String
    ): SpotifySearchResponse {
        
        val restTemplate = RestTemplate()
        val url = UriComponentsBuilder
            .fromUriString("https://api.spotify.com/v1/search")
            .queryParam("q", query)
            .queryParam("type", type)
            .queryParam("limit", limit)
            .queryParam("offset", offset)
            .apply { 
                if (market != null) {
                    queryParam("market", market)
                }
            }
            .build()
            .toUriString()

        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
        }

        val response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            HttpEntity<Any>(headers),
            SpotifySearchResponse::class.java
        )

        return response.body ?: throw RuntimeException("No response body from Spotify search API")
    }

    fun getUserProfile(accessToken: String): SpotifyUserProfile {
        val restTemplate = RestTemplate()
        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
        }
        
        val response = restTemplate.exchange(
            "https://api.spotify.com/v1/me",
            HttpMethod.GET,
            HttpEntity<Any>(headers),
            SpotifyUserProfile::class.java
        )
        
        return response.body ?: throw RuntimeException("Failed to get user profile")
    }

    fun getTrack(trackId: String, accessToken: String): Track {
        val restTemplate = RestTemplate()
        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
        }
        
        val response = restTemplate.exchange(
            "https://api.spotify.com/v1/tracks/$trackId",
            HttpMethod.GET,
            HttpEntity<Any>(headers),
            Track::class.java
        )
        
        return response.body ?: throw RuntimeException("Failed to get track details")
    }

    /**
     * Get multiple tracks in a single request using Spotify's batch API
     * @param trackIds List of Spotify track IDs (maximum 50)
     * @param accessToken Spotify access token
     * @param market Optional market code (ISO 3166-1 alpha-2 country code)
     * @return List of Track objects
     */
    fun getTracksBatch(trackIds: List<String>, accessToken: String, market: String? = null): List<Track> {
        if (trackIds.isEmpty()) {
            return emptyList()
        }
        
        if (trackIds.size > 50) {
            throw IllegalArgumentException("Maximum of 50 track IDs allowed per request")
        }
        
        val restTemplate = RestTemplate()
        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
        }
        
        val url = UriComponentsBuilder
            .fromUriString("https://api.spotify.com/v1/tracks")
            .queryParam("ids", trackIds.joinToString(","))
            .apply { 
                if (market != null) {
                    queryParam("market", market)
                }
            }
            .build()
            .toUriString()
        
        val response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            HttpEntity<Any>(headers),
            object : ParameterizedTypeReference<Map<String, List<Track>>>() {}
        )
        
        val responseBody = response.body ?: throw RuntimeException("Failed to get tracks details")
        return responseBody["tracks"] ?: throw RuntimeException("No tracks found in response")
    }

    fun refreshAccessToken(refreshToken: String): SpotifyTokenResponse {
        val restTemplate = RestTemplate()
        
        val headers = HttpHeaders()
        val credentials = "$clientId:$clientSecret"
        val encodedCredentials = Base64.getEncoder().encodeToString(credentials.toByteArray())
        headers.set("Authorization", "Basic $encodedCredentials")
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        
        val body = LinkedMultiValueMap<String, String>()
        body.add("grant_type", "refresh_token")
        body.add("refresh_token", refreshToken)
        
        val request = HttpEntity(body, headers)
        val response = restTemplate.exchange(
            "https://accounts.spotify.com/api/token",
            HttpMethod.POST,
            request,
            SpotifyTokenResponse::class.java
        )
        
        return response.body ?: throw RuntimeException("Failed to refresh token")
    }

    fun getUserTopItems(
        type: String,
        timeRange: String = "medium_term",
        limit: Int = 20,
        offset: Int = 0,
        accessToken: String
    ): Any {
        val restTemplate = RestTemplate()
        val url = UriComponentsBuilder
            .fromUriString("https://api.spotify.com/v1/me/top/$type")
            .queryParam("time_range", timeRange)
            .queryParam("limit", limit)
            .queryParam("offset", offset)
            .build()
            .toUriString()

        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
        }

        return when (type) {
            "artists" -> {
                val response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    HttpEntity<Any>(headers),
                    object : ParameterizedTypeReference<SpotifyTopItemsResponse<Artist>>() {}
                )
                response.body ?: throw RuntimeException("No response body from Spotify top artists API")
            }
            "tracks" -> {
                val response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    HttpEntity<Any>(headers),
                    object : ParameterizedTypeReference<SpotifyTopItemsResponse<Track>>() {}
                )
                response.body ?: throw RuntimeException("No response body from Spotify top tracks API")
            }
            else -> throw IllegalArgumentException("Invalid type parameter. Must be 'artists' or 'tracks'")
        }
    }
    
    /**
     * Get multiple albums in a single request using Spotify's batch API
     * @param albumIds List of Spotify album IDs (maximum 20)
     * @param accessToken Spotify access token
     * @param market Optional market code (ISO 3166-1 alpha-2 country code)
     * @return List of Album objects
     */
    fun getAlbumsBatch(albumIds: List<String>, accessToken: String, market: String? = null): List<Album> {
        if (albumIds.isEmpty()) {
            return emptyList()
        }
        
        if (albumIds.size > 20) {
            throw IllegalArgumentException("Maximum of 20 album IDs allowed per request")
        }
        
        val restTemplate = RestTemplate()
        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
        }
        
        val url = UriComponentsBuilder
            .fromUriString("https://api.spotify.com/v1/albums")
            .queryParam("ids", albumIds.joinToString(","))
            .apply { 
                if (market != null) {
                    queryParam("market", market)
                }
            }
            .build()
            .toUriString()
        
        val response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            HttpEntity<Any>(headers),
            object : ParameterizedTypeReference<Map<String, List<Album>>>() {}
        )
        
        val responseBody = response.body ?: throw RuntimeException("Failed to get albums details")
        return responseBody["albums"] ?: throw RuntimeException("No albums found in response")
    }
    
    /**
     * Get a single album with its tracks
     * @param albumId Spotify album ID
     * @param accessToken Spotify access token
     * @param market Optional market code (ISO 3166-1 alpha-2 country code)
     * @return Album object with tracks
     */
    fun getAlbum(albumId: String, accessToken: String, market: String? = null): Album {
        val restTemplate = RestTemplate()
        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
        }
        
        val urlBuilder = UriComponentsBuilder
            .fromUriString("https://api.spotify.com/v1/albums/$albumId")
        
        if (market != null) {
            urlBuilder.queryParam("market", market)
        }
        
        val url = urlBuilder.build().toUriString()
        
        val response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            HttpEntity<Any>(headers),
            Album::class.java
        )
        
        return response.body ?: throw RuntimeException("Failed to get album details")
    }
} 