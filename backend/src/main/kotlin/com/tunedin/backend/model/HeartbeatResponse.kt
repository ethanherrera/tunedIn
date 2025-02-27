package com.tunedin.backend.model

data class HeartbeatResponse(
    val status: String,
    val timestamp: Long = System.currentTimeMillis(),
    val firestoreConnection: Boolean
) 