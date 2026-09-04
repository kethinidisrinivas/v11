package com.example.demo.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initFirebase() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = getClass().getResourceAsStream("/firebase-service-account.json");
                if (serviceAccount != null) {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .setStorageBucket("messenger-app.appspot.com")
                            .build();

                    FirebaseApp.initializeApp(options);
                    System.out.println("Firebase initialized successfully with service account.");
                } else {
                    System.out.println("No firebase-service-account.json found. FirebaseStorageService running in fallback/emulator mode.");
                }
            }
        } catch (Exception e) {
            System.err.println("Firebase initialization notice: " + e.getMessage());
        }
    }
}
