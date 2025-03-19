package com.tunedin.backend.controller

import com.tunedin.backend.model.UserProfile
import com.tunedin.backend.model.RecentActivity
import com.tunedin.backend.service.UserService
import com.tunedin.backend.service.CookieService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.slf4j.LoggerFactory
import jakarta.servlet.http.HttpServletRequest

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService,
    private val cookieService: CookieService
) {
    private val logger = LoggerFactory.getLogger(UserController::class.java)
    
    @GetMapping("/profile")
    fun getUserProfileById(httpRequest: HttpServletRequest): ResponseEntity<UserProfile> {
        return cookieService.getUserId(httpRequest).fold(
            onSuccess = { userId ->
                logger.info("Getting user profile for user ID: $userId")
                try {
                    val userProfile = userService.getUserProfileById(userId)
                        ?: return ResponseEntity.notFound().build()
                    ResponseEntity.ok(userProfile)
                } catch (e: Exception) {
                    logger.error("Error getting user profile", e)
                    ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
                }
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
            }
        )
    }
    
    @GetMapping("/me")
    fun getCurrentUser(httpRequest: HttpServletRequest): ResponseEntity<UserProfile> {
        return cookieService.getUserId(httpRequest).fold(
            onSuccess = { userId ->
                logger.info("Getting current user profile for user ID: $userId")
                try {
                    val userProfile = userService.getUserProfileById(userId)
                    if (userProfile != null) {
                        ResponseEntity.ok(userProfile)
                    } else {
                        ResponseEntity.notFound().build()
                    }
                } catch (e: Exception) {
                    logger.error("Error getting current user", e)
                    ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
                }
            },
            onFailure = { e ->
                ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
            }
        )
    }

    @GetMapping("/profile/{userId}")
    fun getUserProfileById(@PathVariable userId: String, httpRequest: HttpServletRequest): ResponseEntity<UserProfile> {
        try {
            val userProfile = userService.getUserProfileById(userId)
                ?: return ResponseEntity.notFound().build()
            return ResponseEntity.ok(userProfile)
        } catch (e: Exception) {
            logger.error("Error getting user profile", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
} 