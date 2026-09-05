package com.example.demo.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "calls", indexes = {
        @Index(name = "idx_call_user", columnList = "user_id"),
        @Index(name = "idx_call_contact", columnList = "contact_id")
})
public class Call {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "contact_id")
    private String contactId;

    private String contactName;

    @Column(length = 1000)
    private String contactAvatar;

    private String type; // incoming, outgoing, missed, declined

    private String mode; // audio, video

    private int duration; // in seconds

    private String formattedDuration;

    private String timeStr;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Call() {
    }

    public Call(String id, String userId, String contactId, String contactName, String contactAvatar, String type, String mode, int duration, String formattedDuration, String timeStr, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.contactId = contactId;
        this.contactName = contactName;
        this.contactAvatar = contactAvatar;
        this.type = type;
        this.mode = mode;
        this.duration = duration;
        this.formattedDuration = formattedDuration;
        this.timeStr = timeStr;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getContactAvatar() { return contactAvatar; }
    public void setContactAvatar(String contactAvatar) { this.contactAvatar = contactAvatar; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public String getFormattedDuration() { return formattedDuration; }
    public void setFormattedDuration(String formattedDuration) { this.formattedDuration = formattedDuration; }

    public String getTimeStr() { return timeStr; }
    public void setTimeStr(String timeStr) { this.timeStr = timeStr; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static CallBuilder builder() {
        return new CallBuilder();
    }

    public static class CallBuilder {
        private String id;
        private String userId;
        private String contactId;
        private String contactName;
        private String contactAvatar;
        private String type;
        private String mode;
        private int duration;
        private String formattedDuration;
        private String timeStr;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public CallBuilder id(String id) { this.id = id; return this; }
        public CallBuilder userId(String userId) { this.userId = userId; return this; }
        public CallBuilder contactId(String contactId) { this.contactId = contactId; return this; }
        public CallBuilder contactName(String contactName) { this.contactName = contactName; return this; }
        public CallBuilder contactAvatar(String contactAvatar) { this.contactAvatar = contactAvatar; return this; }
        public CallBuilder type(String type) { this.type = type; return this; }
        public CallBuilder mode(String mode) { this.mode = mode; return this; }
        public CallBuilder duration(int duration) { this.duration = duration; return this; }
        public CallBuilder formattedDuration(String formattedDuration) { this.formattedDuration = formattedDuration; return this; }
        public CallBuilder timeStr(String timeStr) { this.timeStr = timeStr; return this; }
        public CallBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CallBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Call build() {
            return new Call(id, userId, contactId, contactName, contactAvatar, type, mode, duration, formattedDuration, timeStr, createdAt, updatedAt);
        }
    }
}
