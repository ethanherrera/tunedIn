package com.tunedin.backend.model

import com.google.cloud.firestore.annotation.DocumentId
import com.google.cloud.firestore.annotation.PropertyName

data class Track(
    @DocumentId
    val id: String = "",
    
    @get:PropertyName("album_image_url")
    @set:PropertyName("album_image_url")
    var albumImageUrl: String = "",
    
    @get:PropertyName("album_name")
    @set:PropertyName("album_name")
    var albumName: String = "",
    
    @get:PropertyName("artist_name")
    @set:PropertyName("artist_name")
    var artistName: String = "",
    
    @get:PropertyName("spotifyId")
    @set:PropertyName("spotifyId")
    var spotifyId: String = "",
    
    @get:PropertyName("track_name")
    @set:PropertyName("track_name")
    var trackName: String = ""
) 