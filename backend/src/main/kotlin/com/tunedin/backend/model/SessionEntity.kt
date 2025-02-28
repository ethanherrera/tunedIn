package com.tunedin.backend.model

import jakarta.persistence.*

@Entity
@Table(name = "sessions")
data class SessionEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,
    
    @Column(name = "user_id", nullable = false, unique = true)
    var userId: String = "",
    
    @Column(name = "access_token", nullable = false, length = 1000)
    var accessToken: String = ""
) {
    // No-args constructor required by JPA
    constructor() : this(0, "", "")
} 