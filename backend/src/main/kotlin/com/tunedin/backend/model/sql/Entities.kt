package com.tunedin.backend.model.sql

import jakarta.persistence.*

@Entity
@Table(name = "tracks")
data class TrackEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(nullable = false)
    var albumImageUrl: String = "",
    
    @Column(nullable = false)
    var albumName: String = "",
    
    @Column(nullable = false)
    var artistName: String = "",
    
    @Column(nullable = false, unique = true)
    var spotifyId: String = "",
    
    @Column(nullable = false)
    var trackName: String = ""
)

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

@Entity
@Table(name = "user_ranking_lists")
data class UserRankingListEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @ElementCollection
    @CollectionTable(
        name = "user_ranking_list_rankings",
        joinColumns = [JoinColumn(name = "user_ranking_list_id")]
    )
    @Column(name = "ranking_id")
    var rankings: List<String> = listOf()
) 