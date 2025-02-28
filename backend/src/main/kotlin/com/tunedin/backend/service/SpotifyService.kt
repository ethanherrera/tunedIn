package com.tunedin.backend.service

import com.tunedin.backend.model.spotify.*
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.*
import org.springframework.stereotype.Service
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.client.RestTemplate
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.net.URLEncoder
import java.util.*
import com.tunedin.backend.model.Session
import org.springframework.web.util.UriComponentsBuilder

@Service
class SpotifyService(
    @Value("\${spotify.client.id}") private val clientId: String,
    @Value("\${spotify.client.secret}") private val clientSecret: String,
    @Value("\${spotify.redirect.uri}") private val redirectUri: String,
    private val sessionService: SessionService
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
        "playlist-modify-private"
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
        
        // Store tokens in session
        val session = (RequestContextHolder.currentRequestAttributes() as ServletRequestAttributes)
            .request.session
            
        session.setAttribute(SPOTIFY_ACCESS_TOKEN, tokenResponse.accessToken)
        session.setAttribute(SPOTIFY_REFRESH_TOKEN, tokenResponse.refreshToken)
        
        // Store session in Firestore
        val userId = "yez80r5JEkTOuCilR1Ur"  // TODO: Get real user ID
        val firestoreSession = Session(
            id = userId,
            accessToken = tokenResponse.accessToken,
        )
        sessionService.saveSession(userId, firestoreSession)
        
        return tokenResponse
    }

    fun search(
        query: String,
        type: String,
        limit: Int,
        offset: Int,
        market: String?,
        userId: String
    ): SpotifySearchResponse {
        // Get access token from session service
        val session = sessionService.getSession(userId) 
            ?: throw RuntimeException("No session found for user $userId")
        val accessToken = session.accessToken
        
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
} 