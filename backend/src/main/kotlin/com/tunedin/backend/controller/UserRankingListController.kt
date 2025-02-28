package com.tunedin.backend.controller

import com.tunedin.backend.model.UserRankingList
import com.tunedin.backend.repository.UserRankingListRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/user-ranking-lists")
class UserRankingListController(private val userRankingListRepository: UserRankingListRepository) {
    
    @GetMapping("/{id}")
    fun getUserRankingListById(@PathVariable id: String): ResponseEntity<UserRankingList> {
        return userRankingListRepository.findById(id)?.let {
            ResponseEntity.ok(it)
        } ?: ResponseEntity.notFound().build()
    }
} 