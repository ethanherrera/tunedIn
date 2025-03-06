package com.tunedin.backend.config

import jakarta.servlet.Filter
import jakarta.servlet.FilterChain
import jakarta.servlet.ServletRequest
import jakarta.servlet.ServletResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class CorsFilter : Filter {
    
    private val logger = LoggerFactory.getLogger(CorsFilter::class.java)
    
    @Value("\${frontend.url}")
    private lateinit var frontendUrl: String
    
    override fun doFilter(req: ServletRequest, res: ServletResponse, chain: FilterChain) {
        val request = req as HttpServletRequest
        val response = res as HttpServletResponse
        
        val origin = request.getHeader("Origin")
        logger.debug("Request from origin: $origin")
        
        // Allow the specific origin, or if it's not present, allow the configured frontend URL
        val allowedOrigin = when {
            isAllowedOrigin(origin) -> origin
            else -> frontendUrl
        }
        
        response.setHeader("Access-Control-Allow-Origin", allowedOrigin)
        response.setHeader("Access-Control-Allow-Credentials", "true")
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        response.setHeader("Access-Control-Max-Age", "3600")
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With, remember-me, Authorization")
        response.setHeader("Access-Control-Expose-Headers", "Set-Cookie, Authorization, Content-Type")
        
        // For preflight requests
        if ("OPTIONS".equals(request.method, ignoreCase = true)) {
            logger.debug("Handling OPTIONS preflight request")
            response.status = HttpServletResponse.SC_OK
            return
        }
        
        chain.doFilter(req, res)
    }
    
    private fun isAllowedOrigin(origin: String?): Boolean {
        if (origin == null) return false
        
        val allowedOrigins = listOf(
            frontendUrl,
            "https://tunedin.app",
            "https://www.tunedin.app",
            "http://tunedin.app",
            "http://www.tunedin.app",
            "https://tunedin-frontend-prod-jibc6pxvva-uc.a.run.app",
            "http://localhost:5137"
        )
        
        return allowedOrigins.contains(origin)
    }
} 