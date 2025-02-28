package com.tunedin.backend.model

import com.google.cloud.firestore.annotation.DocumentId
import com.google.cloud.firestore.annotation.PropertyName

data class Session(
    @DocumentId
    val id: String = "",

    @get:PropertyName("access_token")
    @set:PropertyName("access_token")
    var accessToken: String = "",
) 