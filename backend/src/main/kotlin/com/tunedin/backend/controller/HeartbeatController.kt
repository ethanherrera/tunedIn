package com.tunedin.backend.controller

import com.google.firebase.cloud.FirestoreClient
import com.tunedin.backend.model.HeartbeatResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class HeartbeatController {
    
    @GetMapping("/firestore/heartbeat")
    fun getHeartbeat(): HeartbeatResponse {
        val firestoreConnection = try {
            // Try to get an instance of Firestore to verify connection
            FirestoreClient.getFirestore()
            true
        } catch (e: Exception) {
            false
        }

        return HeartbeatResponse(
            status = "running",
            firestoreConnection = firestoreConnection
        )
    }
} 