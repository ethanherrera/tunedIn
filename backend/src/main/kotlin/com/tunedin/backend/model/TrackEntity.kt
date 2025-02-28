package com.tunedin.backend.model

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