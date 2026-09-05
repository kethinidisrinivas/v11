package com.example.demo.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chats", indexes = {
        @Index(name = "idx_chat_user1", columnList = "user1_id"),
        @Index(name = "idx_chat_user2", columnList = "user2_id")
})
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user1_id", nullable = false)
    private String user1Id;

    @Column(name = "user2_id", nullable = false)
    private String user2Id;

    @Column(length = 1000)
    private String lastMessage;

    private LocalDateTime lastMessageTime;

    private int unreadCountUser1;

    private int unreadCountUser2;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Chat() {
    }

    public Chat(String id, String user1Id, String user2Id, String lastMessage, LocalDateTime lastMessageTime, int unreadCountUser1, int unreadCountUser2, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.user1Id = user1Id;
        this.user2Id = user2Id;
        this.lastMessage = lastMessage;
        this.lastMessageTime = lastMessageTime;
        this.unreadCountUser1 = unreadCountUser1;
        this.unreadCountUser2 = unreadCountUser2;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUser1Id() { return user1Id; }
    public void setUser1Id(String user1Id) { this.user1Id = user1Id; }

    public String getUser2Id() { return user2Id; }
    public void setUser2Id(String user2Id) { this.user2Id = user2Id; }

    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }

    public LocalDateTime getLastMessageTime() { return lastMessageTime; }
    public void setLastMessageTime(LocalDateTime lastMessageTime) { this.lastMessageTime = lastMessageTime; }

    public int getUnreadCountUser1() { return unreadCountUser1; }
    public void setUnreadCountUser1(int unreadCountUser1) { this.unreadCountUser1 = unreadCountUser1; }

    public int getUnreadCountUser2() { return unreadCountUser2; }
    public void setUnreadCountUser2(int unreadCountUser2) { this.unreadCountUser2 = unreadCountUser2; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static ChatBuilder builder() {
        return new ChatBuilder();
    }

    public static class ChatBuilder {
        private String id;
        private String user1Id;
        private String user2Id;
        private String lastMessage;
        private LocalDateTime lastMessageTime;
        private int unreadCountUser1;
        private int unreadCountUser2;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public ChatBuilder id(String id) { this.id = id; return this; }
        public ChatBuilder user1Id(String user1Id) { this.user1Id = user1Id; return this; }
        public ChatBuilder user2Id(String user2Id) { this.user2Id = user2Id; return this; }
        public ChatBuilder lastMessage(String lastMessage) { this.lastMessage = lastMessage; return this; }
        public ChatBuilder lastMessageTime(LocalDateTime lastMessageTime) { this.lastMessageTime = lastMessageTime; return this; }
        public ChatBuilder unreadCountUser1(int unreadCountUser1) { this.unreadCountUser1 = unreadCountUser1; return this; }
        public ChatBuilder unreadCountUser2(int unreadCountUser2) { this.unreadCountUser2 = unreadCountUser2; return this; }
        public ChatBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ChatBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Chat build() {
            return new Chat(id, user1Id, user2Id, lastMessage, lastMessageTime, unreadCountUser1, unreadCountUser2, createdAt, updatedAt);
        }
    }
}
