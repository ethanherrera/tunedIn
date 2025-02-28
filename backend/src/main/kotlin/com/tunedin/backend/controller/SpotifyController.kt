package com.tunedin.backend.controller

import com.tunedin.backend.model.spotify.*
import com.tunedin.backend.service.SpotifyService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/spotify")
class SpotifyController(
    private val spotifyService: SpotifyService
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
            return ResponseEntity.badRequest().body(SpotifyErrorResponse(error))
        }

        if (code == null) {
            return ResponseEntity.badRequest().body(SpotifyErrorResponse("Code not found"))
        }

        val tokenResponse: SpotifyTokenResponse = spotifyService.exchangeCode(code)
        return ResponseEntity.ok(tokenResponse)
    }
} 