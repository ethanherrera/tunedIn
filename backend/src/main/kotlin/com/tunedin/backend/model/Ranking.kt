package com.tunedin.backend.model

import com.google.cloud.firestore.annotation.DocumentId
import com.google.cloud.firestore.annotation.PropertyName

data class Ranking(
    @DocumentId
    val id: String = "",
    
    @get:PropertyName("opinion")
    @set:PropertyName("opinion")
    var opinion: String = "",
    
    @get:PropertyName("rank")
    @set:PropertyName("rank")
    var rank: Int = 0,
    
    @get:PropertyName("review")
    @set:PropertyName("review")
    var review: String = "",
    
    @get:PropertyName("score")
    @set:PropertyName("score")
    var score: Int = 0,
    
    @get:PropertyName("trackId")
    @set:PropertyName("trackId")
    var trackId: String = ""
) 