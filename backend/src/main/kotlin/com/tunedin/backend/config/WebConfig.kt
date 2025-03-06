package com.tunedin.backend.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.slf4j.LoggerFactory

@Configuration
class WebConfig : WebMvcConfigurer {
    
    private val logger = LoggerFactory.getLogger(WebConfig::class.java)
    
    @Value("\${frontend.url}")
    private lateinit var frontendUrl: String
    
    override fun addCorsMappings(registry: CorsRegistry) {
        logger.info("Configuring CORS with frontend URL: $frontendUrl")
        
        registry.addMapping("/**") // Changed from "/api/**" to "/**" to cover all paths
            .allowedOrigins(
                frontendUrl,
                "https://tunedin.app",
                "https://www.tunedin.app",
                "http://tunedin.app",
                "http://www.tunedin.app",
                "https://tunedin-frontend-prod-jibc6pxvva-uc.a.run.app"
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .exposedHeaders("Set-Cookie", "Authorization", "Content-Type")
            .allowCredentials(true)
            .maxAge(3600) // 1 hour max age
        
        logger.info("CORS configuration completed")
    }
} 