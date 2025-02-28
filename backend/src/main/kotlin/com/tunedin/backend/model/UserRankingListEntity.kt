package com.tunedin.backend.model

import jakarta.persistence.*

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