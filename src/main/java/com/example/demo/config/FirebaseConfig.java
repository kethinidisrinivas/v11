package com.example.demo.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.firebase.database.FirebaseDatabase;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.config-path:firebase-service-account.json}")
    private String configPath;

    @Value("${firebase.database-url:https://love-e9901-default-rtdb.firebaseio.com/}")
    private String databaseUrl;

    @Value("${firebase.storage-bucket:love-e9901.appspot.com}")
    private String storageBucket;

    @PostConstruct
    public void initialize() {
        try {
            ClassPathResource resource = new ClassPathResource(configPath);
            if (resource.exists()) {
                InputStream serviceAccount = resource.getInputStream();
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .setDatabaseUrl(databaseUrl)
                        .setStorageBucket(storageBucket)
                        .build();

                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                    System.out.println("Firebase Admin SDK is successfully connected!");
                }
            } else {
                System.out.println("No " + configPath + " found in classpath.");
            }
        } catch (IOException e) {
            System.err.println("Firebase Error: " + e.getMessage());
        }
    }

    // 1. Cloud Firestore Bean
    @Bean
    public Firestore getFirestore() {
        if (FirebaseApp.getApps().isEmpty()) {
            return null;
        }
        return FirestoreClient.getFirestore();
    }

    // 2. Realtime Database Bean
    @Bean
    public FirebaseDatabase getRealtimeDatabase() {
        if (FirebaseApp.getApps().isEmpty()) {
            return null;
        }
        return FirebaseDatabase.getInstance();
    }
}
