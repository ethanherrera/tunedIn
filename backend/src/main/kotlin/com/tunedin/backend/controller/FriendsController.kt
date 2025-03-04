package com.tunedin.backend.controller

import com.tunedin.backend.model.FriendRequest
import com.tunedin.backend.model.UserProfile
import com.tunedin.backend.model.spotify.SpotifyErrorResponse
import com.tunedin.backend.service.FriendService
import com.tunedin.backend.service.UserService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.slf4j.LoggerFactory

@RestController
@RequestMapping("/api/friends")
class FriendsController(
    private val userService: UserService,
    private val friendService: FriendService
) {
    
    private val logger = LoggerFactory.getLogger(FriendsController::class.java)
    
    // Helper function to extract userId from cookies
    private fun getUserIdFromCookies(request: HttpServletRequest): String? {
        return request.cookies?.find { it.name == "userId" }?.value
    }
    
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
    
    @PostMapping("/request/{receiverId}")
    fun sendFriendRequest(
        @PathVariable receiverId: String,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        val senderId = getUserIdFromCookies(request)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("error" to "User ID not found in cookies"))
                
        logger.info("Sending friend request from $senderId to $receiverId")
        
        return try {
            val friendRequest = friendService.sendFriendRequest(senderId, receiverId)
            ResponseEntity.ok(friendRequest)
        } catch (e: IllegalArgumentException) {
            logger.error("Invalid request: ${e.message}")
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        } catch (e: IllegalStateException) {
            logger.error("Invalid state: ${e.message}")
            ResponseEntity.status(HttpStatus.CONFLICT).body(mapOf("error" to e.message))
        } catch (e: Exception) {
            logger.error("Error sending friend request", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Failed to send friend request"))
        }
    }
    
    @PutMapping("/request/{requestId}/accept")
    fun acceptFriendRequest(
        @PathVariable requestId: String,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        val userId = getUserIdFromCookies(request)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("error" to "User ID not found in cookies"))
                
        logger.info("User $userId accepting friend request $requestId")
        
        return try {
            val friendRequest = friendService.acceptFriendRequest(userId, requestId)
            ResponseEntity.ok(friendRequest)
        } catch (e: IllegalArgumentException) {
            logger.error("Invalid request: ${e.message}")
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        } catch (e: Exception) {
            logger.error("Error accepting friend request", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Failed to accept friend request"))
        }
    }
    
    @PutMapping("/request/{requestId}/decline")
    fun declineFriendRequest(
        @PathVariable requestId: String,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        val userId = getUserIdFromCookies(request)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("error" to "User ID not found in cookies"))
                
        logger.info("User $userId declining friend request $requestId")
        
        return try {
            val friendRequest = friendService.declineFriendRequest(userId, requestId)
            ResponseEntity.ok(friendRequest)
        } catch (e: IllegalArgumentException) {
            logger.error("Invalid request: ${e.message}")
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        } catch (e: Exception) {
            logger.error("Error declining friend request", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Failed to decline friend request"))
        }
    }
    
    @GetMapping("/requests/pending")
    fun getPendingRequests(request: HttpServletRequest): ResponseEntity<Any> {
        val userId = getUserIdFromCookies(request)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("error" to "User ID not found in cookies"))
                
        logger.info("Getting pending friend requests for user $userId")
        
        return try {
            val requests = friendService.getPendingRequestsForUser(userId)
            ResponseEntity.ok(requests)
        } catch (e: Exception) {
            logger.error("Error getting pending requests", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Failed to get pending requests"))
        }
    }
    
    @GetMapping("/requests/sent")
    fun getSentRequests(request: HttpServletRequest): ResponseEntity<Any> {
        val userId = getUserIdFromCookies(request)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("error" to "User ID not found in cookies"))
                
        logger.info("Getting sent friend requests for user $userId")
        
        return try {
            val requests = friendService.getSentRequestsByUser(userId)
            ResponseEntity.ok(requests)
        } catch (e: Exception) {
            logger.error("Error getting sent requests", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Failed to get sent requests"))
        }
    }
    
    @GetMapping("/list")
    fun getUserFriends(request: HttpServletRequest): ResponseEntity<Any> {
        val userId = getUserIdFromCookies(request)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("error" to "User ID not found in cookies"))
                
        logger.info("Getting friends for user $userId")
        
        return try {
            val friends = friendService.getUserFriends(userId)
            ResponseEntity.ok(friends)
        } catch (e: IllegalArgumentException) {
            logger.error("Invalid request: ${e.message}")
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        } catch (e: Exception) {
            logger.error("Error getting user friends", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Failed to get user friends"))
        }
    }
    
    @DeleteMapping("/{friendId}")
    fun removeFriend(
        @PathVariable friendId: String,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        val userId = getUserIdFromCookies(request)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("error" to "User ID not found in cookies"))
                
        logger.info("Removing friendship between $userId and $friendId")
        
        return try {
            friendService.removeFriendship(userId, friendId)
            ResponseEntity.noContent().build()
        } catch (e: IllegalArgumentException) {
            logger.error("Invalid request: ${e.message}")
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        } catch (e: Exception) {
            logger.error("Error removing friendship", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Failed to remove friendship"))
        }
    }
}