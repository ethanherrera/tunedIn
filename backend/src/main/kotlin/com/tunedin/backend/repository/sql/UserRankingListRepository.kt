package com.tunedin.backend.repository.sql

import com.tunedin.backend.model.sql.UserRankingListEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRankingListRepository : JpaRepository<UserRankingListEntity, Long> 