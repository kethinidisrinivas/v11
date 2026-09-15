package com.example.demo.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "contacts", indexes = {
        @Index(name = "idx_contact_user_id", columnList = "user_id"),
        @Index(name = "idx_contact_phone", columnList = "phone")
})
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "contact_user_id")
    private String contactUserId;

    @Column(nullable = false)
    private String name;

    private String username;

    private String phone;

    @Column(length = 1000)
    private String avatar;

    @Column(length = 500)
    private String statusText;

    private String about;

    private boolean isFavorite;

    private boolean isOnline;

    private String lastSeen;

    private int unreadCount;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Contact() {
    }

    public Contact(String id, String userId, String contactUserId, String name, String username, String phone, String avatar, String statusText, String about, boolean isFavorite, boolean isOnline, String lastSeen, int unreadCount, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.contactUserId = contactUserId;
        this.name = name;
        this.username = username;
        this.phone = phone;
        this.avatar = avatar;
        this.statusText = statusText;
        this.about = about;
        this.isFavorite = isFavorite;
        this.isOnline = isOnline;
        this.lastSeen = lastSeen;
        this.unreadCount = unreadCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getContactUserId() { return contactUserId; }
    public void setContactUserId(String contactUserId) { this.contactUserId = contactUserId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getStatusText() { return statusText; }
    public void setStatusText(String statusText) { this.statusText = statusText; }

    public String getAbout() { return about; }
    public void setAbout(String about) { this.about = about; }

    public boolean isFavorite() { return isFavorite; }
    public void setFavorite(boolean favorite) { isFavorite = favorite; }

    public boolean isOnline() { return isOnline; }
    public void setOnline(boolean online) { isOnline = online; }

    public String getLastSeen() { return lastSeen; }
    public void setLastSeen(String lastSeen) { this.lastSeen = lastSeen; }

    public int getUnreadCount() { return unreadCount; }
    public void setUnreadCount(int unreadCount) { this.unreadCount = unreadCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static ContactBuilder builder() {
        return new ContactBuilder();
    }

    public static class ContactBuilder {
        private String id;
        private String userId;
        private String contactUserId;
        private String name;
        private String username;
        private String phone;
        private String avatar;
        private String statusText;
        private String about;
        private boolean isFavorite;
        private boolean isOnline;
        private String lastSeen;
        private int unreadCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public ContactBuilder id(String id) { this.id = id; return this; }
        public ContactBuilder userId(String userId) { this.userId = userId; return this; }
        public ContactBuilder contactUserId(String contactUserId) { this.contactUserId = contactUserId; return this; }
        public ContactBuilder name(String name) { this.name = name; return this; }
        public ContactBuilder username(String username) { this.username = username; return this; }
        public ContactBuilder phone(String phone) { this.phone = phone; return this; }
        public ContactBuilder avatar(String avatar) { this.avatar = avatar; return this; }
        public ContactBuilder statusText(String statusText) { this.statusText = statusText; return this; }
        public ContactBuilder about(String about) { this.about = about; return this; }
        public ContactBuilder isFavorite(boolean isFavorite) { this.isFavorite = isFavorite; return this; }
        public ContactBuilder isOnline(boolean isOnline) { this.isOnline = isOnline; return this; }
        public ContactBuilder lastSeen(String lastSeen) { this.lastSeen = lastSeen; return this; }
        public ContactBuilder unreadCount(int unreadCount) { this.unreadCount = unreadCount; return this; }
        public ContactBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ContactBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Contact build() {
            return new Contact(id, userId, contactUserId, name, username, phone, avatar, statusText, about, isFavorite, isOnline, lastSeen, unreadCount, createdAt, updatedAt);
        }
    }
}
