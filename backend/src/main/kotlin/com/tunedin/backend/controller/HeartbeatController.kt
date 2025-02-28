package com.tunedin.backend.controller

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
} 