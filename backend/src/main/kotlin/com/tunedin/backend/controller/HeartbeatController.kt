package com.tunedin.backend.controller

import com.google.firebase.cloud.FirestoreClient
import com.tunedin.backend.model.HeartbeatResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class HeartbeatController {

    @GetMapping("/heartbeat")
    fun getHeartbeat(): Map<String, String> {
        return mapOf("status" to "running")
    }
    
    @GetMapping("/firestore/heartbeat")
    fun getFirestoreHeartbeat(): HeartbeatResponse {
        val firestoreConnection = try {
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