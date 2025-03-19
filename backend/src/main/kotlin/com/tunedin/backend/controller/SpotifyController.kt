package com.tunedin.backend.controller

import com.tunedin.backend.model.spotify.*
import com.tunedin.backend.service.SpotifyService
import com.tunedin.backend.service.UserService
import com.tunedin.backend.service.CookieService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory

@RestController
@RequestMapping("/api/spotify")
class SpotifyController(
    private val spotifyService: SpotifyService,
    private val userService: UserService,
    private val cookieService: CookieService,
    @Value("\${frontend.url}") private val frontendUrl: String
) {
    private val logger = LoggerFactory.getLogger(SpotifyController::class.java)
    
    @GetMapping("/login")
    fun login(): ResponseEntity<SpotifyAuthUrlResponse> {
        val authUrl = spotifyService.generateAuthUrl()
        return ResponseEntity.ok(SpotifyAuthUrlResponse(authUrl))
    }

    @GetMapping("/callback")
    fun callback(
        @RequestParam code: String?,
        @RequestParam state: String?,
        @RequestParam error: String?
    ): ResponseEntity<*> {
        if (error != null) {
            val redirectUrl = "$frontendUrl/auth-error?error=$error"
            return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .build<Void>()
        }

        if (code == null) {
            val redirectUrl = "$frontendUrl/auth-error?error=code_not_found"
            return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .build<Void>()
        }

        try {
            val tokenResponse = spotifyService.exchangeCode(code)
            val userProfile = userService.saveUser(tokenResponse)
            
            logger.info("User authenticated: ${userProfile.id}, display name: ${userProfile.display_name}")
            
            val cookies = cookieService.createAuthCookies(userProfile, tokenResponse)
            
            val responseBuilder = ResponseEntity.status(HttpStatus.FOUND)
            cookies.forEach { cookie ->
                responseBuilder.header(HttpHeaders.SET_COOKIE, cookie.toString())
            }
            
            return responseBuilder
                .header(HttpHeaders.LOCATION, frontendUrl)
                .build<Void>()
                
        } catch (e: Exception) {
            logger.error("Authentication error", e)
            val redirectUrl = "$frontendUrl/auth-error?error=${e.message}"
            return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .build<Void>()
        }
    }

    @GetMapping("/search")
    fun search(
        @RequestParam q: String,
        @RequestParam(required = false, defaultValue = "track,album,artist,playlist") type: String,
        @RequestParam(required = false, defaultValue = "20") limit: Int,
        @RequestParam(required = false, defaultValue = "0") offset: Int,
        @RequestParam(required = false) market: String?,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        return cookieService.getAccessToken(request).fold(
            onSuccess = { accessToken ->
                val searchResponse = spotifyService.search(q, type, limit, offset, market, accessToken)
                ResponseEntity.ok(searchResponse)
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get access token"))
            }
        )
    }
    
    @GetMapping("/me")
    fun getCurrentUser(
        request: HttpServletRequest,
        @RequestParam(required = false) accessTokenParam: String? = null,
        @RequestHeader(value = "Authorization", required = false) authHeader: String? = null
    ): ResponseEntity<*> {
        try {
            cookieService.logRequestDetails(request)
            return cookieService.getAccessToken(request, accessTokenParam, authHeader).fold(
                onSuccess = { accessToken ->
                    logger.info("Using access token")
                    val userProfile = spotifyService.getUserProfile(accessToken)
                    logger.info("Successfully retrieved user profile for ${userProfile.id}")
                    ResponseEntity.ok(userProfile)
                },
                onFailure = { e ->
                    ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(SpotifyErrorResponse(e.message ?: "Failed to get access token"))
                }
            )
        } catch (e: Exception) {
            logger.error("Error in /me endpoint", e)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("Failed to get user profile: ${e.message}"))
        }
    }
    
    @GetMapping("/tracks/{trackId}")
    fun getTrackById(@PathVariable trackId: String, request: HttpServletRequest): ResponseEntity<*> {
        return cookieService.getAccessToken(request).fold(
            onSuccess = { accessToken ->
                val track = spotifyService.getTrack(trackId, accessToken)
                ResponseEntity.ok(track)
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get access token"))
            }
        )
    }
    
    @GetMapping("/tracks")
    fun getTracksBatch(
        @RequestParam ids: String,
        @RequestParam(required = false) market: String?,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        val trackIds = ids.split(",").map { it.trim() }
        
        if (trackIds.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(SpotifyErrorResponse("No track IDs provided"))
        }
        
        if (trackIds.size > 50) {
            return ResponseEntity.badRequest()
                .body(SpotifyErrorResponse("Maximum of 50 track IDs allowed per request"))
        }
        
        return cookieService.getAccessToken(request).fold(
            onSuccess = { accessToken ->
                val tracks = spotifyService.getTracksBatch(trackIds, accessToken, market)
                ResponseEntity.ok(mapOf("tracks" to tracks))
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get access token"))
            }
        )
    }
    
    @GetMapping("/me/top/{type}")
    fun getUserTopItems(
        @PathVariable type: String,
        @RequestParam(required = false, defaultValue = "medium_term") timeRange: String,
        @RequestParam(required = false, defaultValue = "20") limit: Int,
        @RequestParam(required = false, defaultValue = "0") offset: Int,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        if (type !in listOf("artists", "tracks")) {
            return ResponseEntity.badRequest()
                .body(SpotifyErrorResponse("Invalid type parameter. Must be 'artists' or 'tracks'"))
        }
        
        return cookieService.getAccessToken(request).fold(
            onSuccess = { accessToken ->
                val topItems = spotifyService.getUserTopItems(type, timeRange, limit, offset, accessToken)
                ResponseEntity.ok(topItems)
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get access token"))
            }
        )
    }
    
    @GetMapping("/albums")
    fun getAlbumsBatch(
        @RequestParam ids: String,
        @RequestParam(required = false) market: String?,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        val albumIds = ids.split(",").map { it.trim() }
        
        if (albumIds.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(SpotifyErrorResponse("No album IDs provided"))
        }
        
        if (albumIds.size > 20) {
            return ResponseEntity.badRequest()
                .body(SpotifyErrorResponse("Maximum of 20 album IDs allowed per request"))
        }
        
        return cookieService.getAccessToken(request).fold(
            onSuccess = { accessToken ->
                val albums = spotifyService.getAlbumsBatch(albumIds, accessToken, market)
                ResponseEntity.ok(mapOf("albums" to albums))
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get access token"))
            }
        )
    }
    
    @GetMapping("/albums/{id}")
    fun getAlbum(
        @PathVariable id: String,
        @RequestParam(required = false) market: String?,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        return cookieService.getAccessToken(request).fold(
            onSuccess = { accessToken ->
                val album = spotifyService.getAlbum(id, accessToken, market)
                ResponseEntity.ok(album)
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get access token"))
            }
        )
    }
    
    @GetMapping("/artists/{id}")
    fun getArtistById(@PathVariable id: String, request: HttpServletRequest): ResponseEntity<*> {
        return cookieService.getAccessToken(request).fold(
            onSuccess = { accessToken ->
                val artist = spotifyService.getArtist(id, accessToken)
                ResponseEntity.ok(artist)
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get access token"))
            }
        )
    }

    @GetMapping("/me/player/recently-played")
    fun getRecentlyPlayedTracks(
        @RequestParam(required = false, defaultValue = "20") limit: Int,
        @RequestParam(required = false) after: Int?,
        @RequestParam(required = false) before: Int?,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        return cookieService.getAccessToken(request).fold(
            onSuccess = { accessToken ->
                val recentlyPlayed = spotifyService.getRecentlyPlayedTracks(limit, after, before, accessToken)
                ResponseEntity.ok(recentlyPlayed)
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse(e.message ?: "Failed to get access token"))
            }
        )
    }
} 