package com.tunedin.backend.repository

import com.tunedin.backend.model.UserRankingListEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRankingListRepository : JpaRepository<UserRankingListEntity, Long> 