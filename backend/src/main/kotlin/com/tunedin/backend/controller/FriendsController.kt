package com.tunedin.backend.controller

import com.tunedin.backend.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.slf4j.LoggerFactory

@RestController
@RequestMapping("/api/friends")
class FriendsController(private val userService: UserService) {
    
    private val logger = LoggerFactory.getLogger(FriendsController::class.java)
    
    @GetMapping("/check-user/{userId}")
    fun checkUserExists(@PathVariable userId: String): ResponseEntity<Map<String, Boolean>> {
        logger.info("Checking if user exists with ID: $userId")
        
        try {
            val exists = userService.getUserProfileById(userId) != null
            return ResponseEntity.ok(mapOf("exists" to exists))
        } catch (e: Exception) {
            logger.error("Error checking if user exists", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
} 