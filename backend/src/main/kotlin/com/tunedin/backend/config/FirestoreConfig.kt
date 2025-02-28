package com.tunedin.backend.config

import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.firestore.Firestore
import com.google.cloud.firestore.FirestoreOptions
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import java.io.IOException

@Configuration
class FirestoreConfig {

    @Bean
    fun firestore(): Firestore {
        try {
            val serviceAccount = ClassPathResource("firebase-service-account.json").inputStream
            val credentials = GoogleCredentials.fromStream(serviceAccount)

            return FirestoreOptions.newBuilder()
                .setCredentials(credentials)
                .build()
                .service

        } catch (e: IOException) {
            throw RuntimeException("Failed to initialize Firestore", e)
        }
    }
} 