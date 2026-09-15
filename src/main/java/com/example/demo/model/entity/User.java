package com.example.demo.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_phone", columnList = "phone"),
        @Index(name = "idx_user_email", columnList = "email")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(unique = true)
    private String email;

    private String password;

    @Column(length = 1000)
    private String avatar;

    @Column(length = 500)
    private String statusText;

    private boolean isOnline;

    private LocalDateTime lastSeen;

    @Column(length = 2000)
    private String privacySettingsJson;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public User() {
    }

    public User(String id, String name, String username, String phone, String email, String password, String avatar, String statusText, boolean isOnline, LocalDateTime lastSeen, String privacySettingsJson, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.phone = phone;
        this.email = email;
        this.password = password;
        this.avatar = avatar;
        this.statusText = statusText;
        this.isOnline = isOnline;
        this.lastSeen = lastSeen;
        this.privacySettingsJson = privacySettingsJson;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getProfilePictureUrl() { return avatar; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.avatar = profilePictureUrl; }

    public String getStatusText() { return statusText; }
    public void setStatusText(String statusText) { this.statusText = statusText; }

    public boolean isOnline() { return isOnline; }
    public void setOnline(boolean isOnline) { this.isOnline = isOnline; }

    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }

    public String getPrivacySettingsJson() { return privacySettingsJson; }
    public void setPrivacySettingsJson(String privacySettingsJson) { this.privacySettingsJson = privacySettingsJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private String id;
        private String name;
        private String username;
        private String phone;
        private String email;
        private String password;
        private String avatar;
        private String statusText;
        private boolean isOnline;
        private LocalDateTime lastSeen;
        private String privacySettingsJson;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public UserBuilder id(String id) { this.id = id; return this; }
        public UserBuilder name(String name) { this.name = name; return this; }
        public UserBuilder username(String username) { this.username = username; return this; }
        public UserBuilder phone(String phone) { this.phone = phone; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder password(String password) { this.password = password; return this; }
        public UserBuilder avatar(String avatar) { this.avatar = avatar; return this; }
        public UserBuilder statusText(String statusText) { this.statusText = statusText; return this; }
        public UserBuilder isOnline(boolean isOnline) { this.isOnline = isOnline; return this; }
        public UserBuilder lastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; return this; }
        public UserBuilder privacySettingsJson(String privacySettingsJson) { this.privacySettingsJson = privacySettingsJson; return this; }
        public UserBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public UserBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public User build() {
            return new User(id, name, username, phone, email, password, avatar, statusText, isOnline, lastSeen, privacySettingsJson, createdAt, updatedAt);
        }
    }
}
