package com.tunedin.backend.controller

import com.tunedin.backend.model.spotify.*
import com.tunedin.backend.service.SpotifyService
import com.tunedin.backend.service.UserService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.Duration
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory

@RestController
@RequestMapping("/api/spotify")
class SpotifyController(
    private val spotifyService: SpotifyService,
    private val userService: UserService,
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
            // Redirect to frontend with error
            val redirectUrl = "$frontendUrl/auth-error?error=$error"
            return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .build<Void>()
        }

        if (code == null) {
            // Redirect to frontend with error
            val redirectUrl = "$frontendUrl/auth-error?error=code_not_found"
            return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .build<Void>()
        }

        try {
            val tokenResponse = spotifyService.exchangeCode(code)
            val userProfile = userService.createOrUpdateUser(tokenResponse)
            
            logger.info("User authenticated: ${userProfile.id}, display name: ${userProfile.display_name}")
            
            // Create secure HTTP-only cookies
            val userIdCookie = ResponseCookie.from("userId", userProfile.id)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build()
                
            val displayNameCookie = ResponseCookie.from("displayName", userProfile.display_name ?: "Spotify User")
                .httpOnly(false) // Allow JavaScript to read display name for UI
                .secure(true)
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build()
                
            val accessTokenCookie = ResponseCookie.from("accessToken", tokenResponse.accessToken)
                .httpOnly(true) // HTTP-only for security
                .secure(true)
                .path("/")
                .maxAge(Duration.ofSeconds(tokenResponse.expiresIn.toLong()))
                .build()
                
            // Redirect to frontend with cookies
            return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.SET_COOKIE, userIdCookie.toString())
                .header(HttpHeaders.SET_COOKIE, displayNameCookie.toString())
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.LOCATION, frontendUrl)
                .build<Void>()
                
        } catch (e: Exception) {
            logger.error("Authentication error", e)
            // Redirect to frontend with error
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
        try {
            // Get access token from cookie
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val accessToken = request.cookies?.find { it.name == "accessToken" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("Access token not found in cookies. Available cookies: [$cookiesInfo]"))
            
            val searchResponse = spotifyService.search(q, type, limit, offset, market, accessToken)
            return ResponseEntity.ok(searchResponse)
        } catch (e: Exception) {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("Failed to search: ${e.message}. Available cookies: [$cookiesInfo]"))
        }
    }
    
    @GetMapping("/me")
    fun getCurrentUser(request: HttpServletRequest): ResponseEntity<*> {
        try {
            // Get userId and accessToken from cookies
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val userId = request.cookies?.find { it.name == "userId" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
            
            val accessToken = request.cookies?.find { it.name == "accessToken" }?.value
                ?: run {
                    // If access token cookie is missing, try to get a valid token from the user service
                    try {
                        userService.getValidAccessToken(userId)
                    } catch (e: Exception) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(SpotifyErrorResponse("Access token not found and could not be refreshed. Available cookies: [$cookiesInfo]"))
                    }
                }
            
            val userProfile = spotifyService.getUserProfile(accessToken)
            return ResponseEntity.ok(userProfile)
        } catch (e: Exception) {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("Failed to get user profile: ${e.message}. Available cookies: [$cookiesInfo]"))
        }
    }
    
    @GetMapping("/tracks/{trackId}")
    fun getTrackById(@PathVariable trackId: String, request: HttpServletRequest): ResponseEntity<*> {
        try {
            // Get access token from cookie
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val accessToken = request.cookies?.find { it.name == "accessToken" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("Access token not found in cookies. Available cookies: [$cookiesInfo]"))
            
            val track = spotifyService.getTrack(trackId, accessToken)
            return ResponseEntity.ok(track)
        } catch (e: Exception) {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("Failed to get track: ${e.message}. Available cookies: [$cookiesInfo]"))
        }
    }
    
    @GetMapping("/tracks")
    fun getTracksBatch(
        @RequestParam ids: String,
        @RequestParam(required = false) market: String?,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        try {
            // Get access token from cookie
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val accessToken = request.cookies?.find { it.name == "accessToken" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("Access token not found in cookies. Available cookies: [$cookiesInfo]"))
            
            // Split the comma-separated IDs into a list
            val trackIds = ids.split(",").map { it.trim() }
            
            if (trackIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(SpotifyErrorResponse("No track IDs provided"))
            }
            
            if (trackIds.size > 50) {
                return ResponseEntity.badRequest()
                    .body(SpotifyErrorResponse("Maximum of 50 track IDs allowed per request"))
            }
            
            val tracks = spotifyService.getTracksBatch(trackIds, accessToken, market)
            return ResponseEntity.ok(mapOf("tracks" to tracks))
        } catch (e: Exception) {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("Failed to get tracks: ${e.message}. Available cookies: [$cookiesInfo]"))
        }
    }
    
    @GetMapping("/me/top/{type}")
    fun getUserTopItems(
        @PathVariable type: String,
        @RequestParam(required = false, defaultValue = "medium_term") timeRange: String,
        @RequestParam(required = false, defaultValue = "20") limit: Int,
        @RequestParam(required = false, defaultValue = "0") offset: Int,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        try {
            // Validate type parameter
            if (type !in listOf("artists", "tracks")) {
                return ResponseEntity.badRequest()
                    .body(SpotifyErrorResponse("Invalid type parameter. Must be 'artists' or 'tracks'"))
            }
            
            // Get access token from cookie
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val accessToken = request.cookies?.find { it.name == "accessToken" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("Access token not found in cookies. Available cookies: [$cookiesInfo]"))
            
            val topItems = spotifyService.getUserTopItems(type, timeRange, limit, offset, accessToken)
            return ResponseEntity.ok(topItems)
        } catch (e: Exception) {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("Failed to get user's top $type: ${e.message}. Available cookies: [$cookiesInfo]"))
        }
    }
    
    @GetMapping("/albums")
    fun getAlbumsBatch(
        @RequestParam ids: String,
        @RequestParam(required = false) market: String?,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        try {
            // Get access token from cookie
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val accessToken = request.cookies?.find { it.name == "accessToken" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("Access token not found in cookies. Available cookies: [$cookiesInfo]"))
            
            // Split the comma-separated IDs into a list
            val albumIds = ids.split(",").map { it.trim() }
            
            if (albumIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(SpotifyErrorResponse("No album IDs provided"))
            }
            
            if (albumIds.size > 20) {
                return ResponseEntity.badRequest()
                    .body(SpotifyErrorResponse("Maximum of 20 album IDs allowed per request"))
            }
            
            val albums = spotifyService.getAlbumsBatch(albumIds, accessToken, market)
            return ResponseEntity.ok(mapOf("albums" to albums))
        } catch (e: Exception) {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("Failed to get albums: ${e.message}. Available cookies: [$cookiesInfo]"))
        }
    }
    
    @GetMapping("/albums/{id}")
    fun getAlbum(
        @PathVariable id: String,
        @RequestParam(required = false) market: String?,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        try {
            // Get access token from cookie
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val accessToken = request.cookies?.find { it.name == "accessToken" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("Access token not found in cookies. Available cookies: [$cookiesInfo]"))
            
            val album = spotifyService.getAlbum(id, accessToken, market)
            return ResponseEntity.ok(album)
        } catch (e: Exception) {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("Failed to get album: ${e.message}. Available cookies: [$cookiesInfo]"))
        }
    }
    
    @GetMapping("/artists/{id}")
    fun getArtistById(@PathVariable id: String, request: HttpServletRequest): ResponseEntity<*> {
        try {
            // Get access token from cookie
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val accessToken = request.cookies?.find { it.name == "accessToken" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("Access token not found in cookies. Available cookies: [$cookiesInfo]"))
            
            val artist = spotifyService.getArtist(id, accessToken)
            return ResponseEntity.ok(artist)
        } catch (e: Exception) {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("Failed to get artist: ${e.message}. Available cookies: [$cookiesInfo]"))
        }
    }
} 