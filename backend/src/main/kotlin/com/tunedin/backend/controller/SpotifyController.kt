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
    @Value("\${frontend.url}") private val frontendUrl: String,
    @Value("\${cookie.domain}") private val cookieDomain: String
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
            logger.info("Setting cookies with domain: $cookieDomain")
            
            // Create secure HTTP-only cookies
            val userIdCookie = ResponseCookie.from("userId", userProfile.id)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .domain(cookieDomain)
                .sameSite("None")
                .maxAge(Duration.ofDays(7))
                .build()
                
            val displayNameCookie = ResponseCookie.from("displayName", userProfile.display_name ?: "Spotify User")
                .httpOnly(false) // Allow JavaScript to read display name for UI
                .secure(true)
                .path("/")
                .domain(cookieDomain)
                .sameSite("None")
                .maxAge(Duration.ofDays(7))
                .build()
                
            val accessTokenCookie = ResponseCookie.from("accessToken", tokenResponse.accessToken)
                .httpOnly(true) // HTTP-only for security
                .secure(true)
                .path("/")
                .domain(cookieDomain)
                .sameSite("None")
                .maxAge(Duration.ofSeconds(tokenResponse.expiresIn.toLong()))
                .build()
                
            // Redirect to frontend with cookies
            logger.info("Setting cookies for redirect:")
            logger.info("userId cookie: domain=${cookieDomain}, path=/, secure=true, httpOnly=true, sameSite=None")
            logger.info("displayName cookie: domain=${cookieDomain}, path=/, secure=true, httpOnly=false, sameSite=None")
            logger.info("accessToken cookie: domain=${cookieDomain}, path=/, secure=true, httpOnly=true, sameSite=None")
            
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
    fun getCurrentUser(
        request: HttpServletRequest,
        @RequestParam(required = false) accessTokenParam: String? = null,
        @RequestHeader(value = "Authorization", required = false) authHeader: String? = null
    ): ResponseEntity<*> {
        try {
            // Log request details
            logger.info("GET /me request received")
            logger.info("Request headers: ${request.headerNames.toList().associateWith { request.getHeader(it) }}")
            
            // Get userId and accessToken from cookies
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            logger.info("Cookies in request: $cookiesInfo")
            
            // Try to get access token from different sources in order of preference:
            // 1. Cookie
            // 2. Authorization header (Bearer token)
            // 3. Query parameter
            var accessToken: String? = request.cookies?.find { it.name == "accessToken" }?.value
            var userId: String? = request.cookies?.find { it.name == "userId" }?.value
            
            if (accessToken == null && authHeader != null && authHeader.startsWith("Bearer ", ignoreCase = true)) {
                logger.info("Using access token from Authorization header")
                accessToken = authHeader.substring(7) // Remove "Bearer " prefix
            }
            
            if (accessToken == null && accessTokenParam != null) {
                logger.info("Using access token from query parameter")
                accessToken = accessTokenParam
            }
            
            if (accessToken == null && userId != null) {
                // If we have userId but no access token, try to refresh
                logger.warn("Access token not found in cookies, header, or query param, attempting to refresh")
                try {
                    accessToken = userService.getValidAccessToken(userId)
                    logger.info("Successfully refreshed access token")
                } catch (e: Exception) {
                    logger.error("Failed to refresh access token", e)
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(SpotifyErrorResponse("Access token not found and could not be refreshed. Available cookies: [$cookiesInfo]"))
                }
            }
            
            if (accessToken == null) {
                logger.warn("No access token found in cookies, header, query param, and no userId for refresh")
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("No access token found. Please authenticate first."))
            }
            
            logger.info("Using access token (first 10 chars): ${accessToken.take(10)}...")
            val userProfile = spotifyService.getUserProfile(accessToken)
            logger.info("Successfully retrieved user profile for ${userProfile.id}")
            return ResponseEntity.ok(userProfile)
        } catch (e: Exception) {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            logger.error("Error in /me endpoint", e)
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

    @GetMapping("/me/player/recently-played")
    fun getRecentlyPlayedTracks(
        @RequestParam(required = false, defaultValue = "20") limit: Int,
        @RequestParam(required = false) after: Int?,
        @RequestParam(required = false) before: Int?,
        request: HttpServletRequest
    ): ResponseEntity<*> {
        try {
            // Get access token from cookie
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            val accessToken = request.cookies?.find { it.name == "accessToken" }?.value
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(SpotifyErrorResponse("Access token not found in cookies. Available cookies: [$cookiesInfo]"))
            
            val recentlyPlayed = spotifyService.getRecentlyPlayedTracks(limit, after, before, accessToken)
            return ResponseEntity.ok(recentlyPlayed)
        } catch (e: Exception) {
            val cookiesInfo = request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(SpotifyErrorResponse("Failed to get recently played tracks: ${e.message}. Available cookies: [$cookiesInfo]"))
        }
    }
    

    @GetMapping("/debug/cookies")
    fun debugCookies(request: HttpServletRequest): ResponseEntity<Map<String, Any>> {
        val cookiesMap = mutableMapOf<String, Any>()
        
        // Get all cookies
        val cookies = request.cookies ?: emptyArray()
        cookiesMap["cookiesCount"] = cookies.size
        cookiesMap["cookies"] = cookies.map { cookie ->
            mapOf(
                "name" to cookie.name,
                "value" to cookie.value.take(10) + "...", // Only show first 10 chars for security
                "domain" to cookie.domain,
                "path" to cookie.path,
                "maxAge" to cookie.maxAge,
                "secure" to cookie.secure,
                "httpOnly" to cookie.isHttpOnly
            )
        }
        
        // Get all headers
        val headers = mutableMapOf<String, String>()
        request.headerNames.asIterator().forEach { headerName ->
            headers[headerName] = request.getHeader(headerName)
        }
        cookiesMap["headers"] = headers
        
        // Add request info
        cookiesMap["requestInfo"] = mapOf(
            "remoteAddr" to request.remoteAddr,
            "requestURL" to request.requestURL.toString(),
            "method" to request.method,
            "serverName" to request.serverName,
            "serverPort" to request.serverPort
        )
        
        return ResponseEntity.ok(cookiesMap)
    }
} 