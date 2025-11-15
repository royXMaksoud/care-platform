package com.care.notification.infrastructure.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import javax.annotation.PostConstruct;
import java.io.IOException;

/**
 * Firebase Cloud Messaging configuration
 * Initializes Firebase Admin SDK for push notifications
 */
@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials-path:#{null}}")
    private Resource credentialsPath;

    @Value("${firebase.database-url:#{null}}")
    private String databaseUrl;

    /**
     * Initialize Firebase Admin SDK
     */
    @PostConstruct
    public void initializeFirebase() {
        try {
            if (credentialsPath == null || !credentialsPath.exists()) {
                log.warn("Firebase credentials not found. Push notifications will be disabled.");
                return;
            }

            GoogleCredentials credentials = GoogleCredentials
                .fromStream(credentialsPath.getInputStream());

            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .setDatabaseUrl(databaseUrl)
                .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully");
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase: {}", e.getMessage());
        }
    }

    /**
     * Firebase Messaging instance bean
     */
    @Bean
    public FirebaseMessaging firebaseMessaging() {
        return FirebaseMessaging.getInstance();
    }
}
