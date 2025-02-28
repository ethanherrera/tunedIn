package com.tunedin.backend.model

import jakarta.persistence.*

@Entity
@Table(name = "rankings")
data class RankingEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(nullable = true)
    var opinion: String = "",
    
    @Column(nullable = false)
    var rank: Int = 0,
    
    @Column(nullable = true)
    var review: String = "",
    
    @Column(nullable = false)
    var score: Int = 0,
    
    @Column(name = "track_id", nullable = false)
    var trackId: String = ""
) 