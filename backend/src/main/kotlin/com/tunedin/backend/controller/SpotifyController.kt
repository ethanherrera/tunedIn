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

@RestController
@RequestMapping("/api/spotify")
class SpotifyController(
    private val spotifyService: SpotifyService,
    private val userService: UserService,
    @Value("\${frontend.url}") private val frontendUrl: String
) {
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
            val user = userService.createOrUpdateUser(tokenResponse)
            
            // Create secure HTTP-only cookies
            val userIdCookie = ResponseCookie.from("userId", user.id)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build()
                
            val displayNameCookie = ResponseCookie.from("displayName", user.displayName)
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
} 