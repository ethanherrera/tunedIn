package com.tunedin.backend.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.slf4j.LoggerFactory

@Configuration
@EnableWebSecurity
class SecurityConfig {
    
    private val logger = LoggerFactory.getLogger(SecurityConfig::class.java)
    
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        logger.info("Configuring security filter chain")
        http
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .authorizeHttpRequests { it.anyRequest().permitAll() }
            .headers { it.frameOptions { it.disable() } }
        return http.build()
    }
    
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        logger.info("Setting up CORS configuration source")
        val configuration = CorsConfiguration().apply {
            allowedOrigins = listOf(
                "https://tunedin.app",
                "https://www.tunedin.app",
                "http://tunedin.app",
                "http://www.tunedin.app",
                "https://tunedin-frontend-prod-jibc6pxvva-uc.a.run.app",
                "http://localhost:5173"
            )
            allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
            allowedHeaders = listOf("*")
            exposedHeaders = listOf("Set-Cookie", "Authorization", "Content-Type")
            allowCredentials = true
            maxAge = 3600L
        }
        
        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", configuration)
        }
    }
} 