package com.tunedin.backend.service

import com.tunedin.backend.model.UserProfile
import com.tunedin.backend.model.spotify.SpotifyTokenResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseCookie
import org.springframework.stereotype.Service
import java.time.Duration
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory

@Service
class CookieService(
    @Value("\${cookie.domain}") private val cookieDomain: String
) {
    private val logger = LoggerFactory.getLogger(CookieService::class.java)

    fun createAuthCookies(userProfile: UserProfile, tokenResponse: SpotifyTokenResponse): List<ResponseCookie> {
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
            
        return listOf(userIdCookie, displayNameCookie, accessTokenCookie)
    }

    fun getAccessToken(
        request: HttpServletRequest,
        accessTokenParam: String? = null,
        authHeader: String? = null
    ): Result<String> {
        val cookiesInfo = getCookiesInfo(request)
        
        request.cookies?.find { it.name == "accessToken" }?.value?.let {
            return Result.success(it)
        }

        if (authHeader != null && authHeader.startsWith("Bearer ", ignoreCase = true)) {
            logger.info("Using access token from Authorization header")
            return Result.success(authHeader.substring(7)) // Remove "Bearer " prefix
        }

        if (accessTokenParam != null) {
            logger.info("Using access token from query parameter")
            return Result.success(accessTokenParam)
        }

        return Result.failure(Exception("Access token not found in cookies. Available cookies: [$cookiesInfo]"))
    }

    fun getUserId(request: HttpServletRequest): Result<String> {
        val cookiesInfo = getCookiesInfo(request)
        return request.cookies?.find { it.name == "userId" }?.value?.let {
            Result.success(it)
        } ?: Result.failure(Exception("User ID not found in cookies. Available cookies: [$cookiesInfo]"))
    }

    fun getCookiesInfo(request: HttpServletRequest): String {
        return request.cookies?.joinToString(", ") { "${it.name}: ${it.value}" } ?: "No cookies found"
    }

    fun logRequestDetails(request: HttpServletRequest) {
        logger.info("Request headers: ${request.headerNames.toList().associateWith { request.getHeader(it) }}")
        logger.info("Cookies in request: ${getCookiesInfo(request)}")
    }
} 