package com.tunedin.backend.controller

import org.bson.Document
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class HeartbeatController(
    private val mongoTemplate: MongoTemplate
) {

    @GetMapping("/heartbeat")
    fun getHeartbeat(): Map<String, String> {
        return mapOf("status" to "running")
    }

    @GetMapping("/heartbeat/mongodb")
    fun getMongoStatus(): ResponseEntity<String> {
        return try {
            mongoTemplate.db.runCommand(Document("ping", 1))
            ResponseEntity.ok("MongoDB is up!")
        } catch (e: Exception) {
            ResponseEntity.status(503).body("MongoDB is down: ${e.message}")
        }
    }
} 