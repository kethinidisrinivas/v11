package com.example.demo.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages", indexes = {
        @Index(name = "idx_msg_sender", columnList = "sender_id"),
        @Index(name = "idx_msg_receiver", columnList = "receiver_id"),
        @Index(name = "idx_msg_chat", columnList = "chat_id")
})
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "chat_id")
    private String chatId;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    private String senderName;

    @Column(name = "receiver_id")
    private String receiverId;

    @Column(length = 4000)
    private String text;

    private String messageType; // TEXT, IMAGE, VIDEO, DOCUMENT, AUDIO, LINK

    @Column(length = 2000)
    private String attachmentJson;

    @Column(length = 1000)
    private String replyToJson;

    @Column(length = 2000)
    private String reactionsJson;

    private boolean isRead;

    private String status; // sent, delivered, seen

    private boolean isStarred;

    private boolean isEdited;

    private boolean isDeletedForEveryone;

    @Column(length = 1000)
    private String deletedForUsersCsv;

    private boolean isForwarded;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Message() {
    }

    public Message(String id, String chatId, String senderId, String senderName, String receiverId, String text, String messageType, String attachmentJson, String replyToJson, String reactionsJson, boolean isRead, String status, boolean isStarred, boolean isEdited, boolean isDeletedForEveryone, String deletedForUsersCsv, boolean isForwarded, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.receiverId = receiverId;
        this.text = text;
        this.messageType = messageType;
        this.attachmentJson = attachmentJson;
        this.replyToJson = replyToJson;
        this.reactionsJson = reactionsJson;
        this.isRead = isRead;
        this.status = status;
        this.isStarred = isStarred;
        this.isEdited = isEdited;
        this.isDeletedForEveryone = isDeletedForEveryone;
        this.deletedForUsersCsv = deletedForUsersCsv;
        this.isForwarded = isForwarded;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getChatId() { return chatId; }
    public void setChatId(String chatId) { this.chatId = chatId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public String getAttachmentJson() { return attachmentJson; }
    public void setAttachmentJson(String attachmentJson) { this.attachmentJson = attachmentJson; }

    public String getReplyToJson() { return replyToJson; }
    public void setReplyToJson(String replyToJson) { this.replyToJson = replyToJson; }

    public String getReactionsJson() { return reactionsJson; }
    public void setReactionsJson(String reactionsJson) { this.reactionsJson = reactionsJson; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean isRead) { this.isRead = isRead; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isStarred() { return isStarred; }
    public void setStarred(boolean isStarred) { this.isStarred = isStarred; }

    public boolean isEdited() { return isEdited; }
    public void setEdited(boolean isEdited) { this.isEdited = isEdited; }

    public boolean isDeletedForEveryone() { return isDeletedForEveryone; }
    public void setDeletedForEveryone(boolean isDeletedForEveryone) { this.isDeletedForEveryone = isDeletedForEveryone; }

    public String getDeletedForUsersCsv() { return deletedForUsersCsv; }
    public void setDeletedForUsersCsv(String deletedForUsersCsv) { this.deletedForUsersCsv = deletedForUsersCsv; }

    public boolean isForwarded() { return isForwarded; }
    public void setForwarded(boolean isForwarded) { this.isForwarded = isForwarded; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static MessageBuilder builder() {
        return new MessageBuilder();
    }

    public static class MessageBuilder {
        private String id;
        private String chatId;
        private String senderId;
        private String senderName;
        private String receiverId;
        private String text;
        private String messageType;
        private String attachmentJson;
        private String replyToJson;
        private String reactionsJson;
        private boolean isRead;
        private String status;
        private boolean isStarred;
        private boolean isEdited;
        private boolean isDeletedForEveryone;
        private String deletedForUsersCsv;
        private boolean isForwarded;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public MessageBuilder id(String id) { this.id = id; return this; }
        public MessageBuilder chatId(String chatId) { this.chatId = chatId; return this; }
        public MessageBuilder senderId(String senderId) { this.senderId = senderId; return this; }
        public MessageBuilder senderName(String senderName) { this.senderName = senderName; return this; }
        public MessageBuilder receiverId(String receiverId) { this.receiverId = receiverId; return this; }
        public MessageBuilder text(String text) { this.text = text; return this; }
        public MessageBuilder messageType(String messageType) { this.messageType = messageType; return this; }
        public MessageBuilder attachmentJson(String attachmentJson) { this.attachmentJson = attachmentJson; return this; }
        public MessageBuilder replyToJson(String replyToJson) { this.replyToJson = replyToJson; return this; }
        public MessageBuilder reactionsJson(String reactionsJson) { this.reactionsJson = reactionsJson; return this; }
        public MessageBuilder isRead(boolean isRead) { this.isRead = isRead; return this; }
        public MessageBuilder status(String status) { this.status = status; return this; }
        public MessageBuilder isStarred(boolean isStarred) { this.isStarred = isStarred; return this; }
        public MessageBuilder isEdited(boolean isEdited) { this.isEdited = isEdited; return this; }
        public MessageBuilder isDeletedForEveryone(boolean isDeletedForEveryone) { this.isDeletedForEveryone = isDeletedForEveryone; return this; }
        public MessageBuilder deletedForUsersCsv(String deletedForUsersCsv) { this.deletedForUsersCsv = deletedForUsersCsv; return this; }
        public MessageBuilder isForwarded(boolean isForwarded) { this.isForwarded = isForwarded; return this; }
        public MessageBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public MessageBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Message build() {
            return new Message(id, chatId, senderId, senderName, receiverId, text, messageType, attachmentJson, replyToJson, reactionsJson, isRead, status, isStarred, isEdited, isDeletedForEveryone, deletedForUsersCsv, isForwarded, createdAt, updatedAt);
        }
    }
}
