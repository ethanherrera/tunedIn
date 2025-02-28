package com.tunedin.backend.controller

import com.tunedin.backend.model.Ranking
import com.tunedin.backend.repository.RankingRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/rankings")
class RankingController(private val rankingRepository: RankingRepository) {
    
    @GetMapping("/{id}")
    fun getRankingById(@PathVariable id: String): ResponseEntity<Ranking> {
        return rankingRepository.findById(id)?.let {
            ResponseEntity.ok(it)
        } ?: ResponseEntity.notFound().build()
    }
} 