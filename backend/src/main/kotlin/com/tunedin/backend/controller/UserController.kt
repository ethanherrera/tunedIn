package com.tunedin.backend.controller

import com.tunedin.backend.model.UserProfile
import com.tunedin.backend.model.RecentActivity
import com.tunedin.backend.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.slf4j.LoggerFactory
import jakarta.servlet.http.HttpServletRequest

@RestController
@RequestMapping("/api/users")
class UserController(private val userService: UserService) {
    
    private val logger = LoggerFactory.getLogger(UserController::class.java)
    
    // Helper function to extract userId from cookies
    private fun getUserIdFromCookies(request: HttpServletRequest): String? {
        return request.cookies?.find { it.name == "userId" }?.value
    }
    
    @GetMapping("/profile")
    fun getUserProfile(httpRequest: HttpServletRequest): ResponseEntity<UserProfile> {
        val userId = getUserIdFromCookies(httpRequest)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
            
        logger.info("Getting user profile for user ID: $userId")
        
        try {
            val userProfile = userService.getUserProfileById(userId)
                ?: return ResponseEntity.notFound().build()
                
            return ResponseEntity.ok(userProfile)
        } catch (e: Exception) {
            logger.error("Error getting user profile", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
    
    @GetMapping("/recent-activities")
    fun getRecentActivities(httpRequest: HttpServletRequest): ResponseEntity<List<RecentActivity>> {
        val userId = getUserIdFromCookies(httpRequest)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
            
        logger.info("Getting recent activities for user ID: $userId")
        
        try {
            val userProfile = userService.getUserProfileById(userId)
                ?: return ResponseEntity.notFound().build()
                
            return ResponseEntity.ok(userProfile.recentActivities)
        } catch (e: Exception) {
            logger.error("Error getting recent activities", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
    
    @GetMapping("/me")
    fun getCurrentUser(httpRequest: HttpServletRequest): ResponseEntity<UserProfile> {
        val userId = getUserIdFromCookies(httpRequest)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
            
        logger.info("Getting current user profile for user ID: $userId")
        
        try {
            // Try to get the user profile
            val userProfile = userService.getUserProfileById(userId)
            
            if (userProfile != null) {
                return ResponseEntity.ok(userProfile)
            }
            
            // If no profile exists, return 404
            return ResponseEntity.notFound().build()
        } catch (e: Exception) {
            logger.error("Error getting current user", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
} 