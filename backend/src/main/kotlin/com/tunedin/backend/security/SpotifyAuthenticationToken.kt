package com.tunedin.backend.security

import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority

class SpotifyAuthenticationToken(private val accessToken: String) : AbstractAuthenticationToken(
    listOf(SimpleGrantedAuthority("ROLE_USER"))
) {
    init {
        isAuthenticated = true
    }

    override fun getCredentials(): Any = accessToken
    override fun getPrincipal(): Any = accessToken
} 