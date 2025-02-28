package com.tunedin.backend.model

import com.google.cloud.firestore.annotation.DocumentId
import com.google.cloud.firestore.annotation.PropertyName

data class UserRankingList(
    @DocumentId
    val id: String = "",
    
    @get:PropertyName("rankings")
    @set:PropertyName("rankings")
    var rankings: List<String> = listOf()
) 