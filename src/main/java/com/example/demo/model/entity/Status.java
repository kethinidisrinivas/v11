package com.example.demo.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "statuses", indexes = {
        @Index(name = "idx_status_user", columnList = "user_id")
})
public class Status {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    private String userName;

    @Column(length = 1000)
    private String userAvatar;

    private String type; // text, image, video

    @Column(length = 1000)
    private String mediaUrl;

    @Column(length = 1000)
    private String textContent;

    private String bgColor;

    @Column(length = 1000)
    private String caption;

    private Integer rotationAngle;

    @Column(length = 500)
    private String textOverlay;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String doodleDataUrl;

    private String fontStyle;

    private int viewsCount;

    private boolean seen;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Status() {
    }

    public Status(String id, String userId, String userName, String userAvatar, String type, String mediaUrl, String textContent, String bgColor, String caption, Integer rotationAngle, String textOverlay, String doodleDataUrl, String fontStyle, int viewsCount, boolean seen, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userAvatar = userAvatar;
        this.type = type;
        this.mediaUrl = mediaUrl;
        this.textContent = textContent;
        this.bgColor = bgColor;
        this.caption = caption;
        this.rotationAngle = rotationAngle;
        this.textOverlay = textOverlay;
        this.doodleDataUrl = doodleDataUrl;
        this.fontStyle = fontStyle;
        this.viewsCount = viewsCount;
        this.seen = seen;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserAvatar() { return userAvatar; }
    public void setUserAvatar(String userAvatar) { this.userAvatar = userAvatar; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

    public String getTextContent() { return textContent; }
    public void setTextContent(String textContent) { this.textContent = textContent; }

    public String getBgColor() { return bgColor; }
    public void setBgColor(String bgColor) { this.bgColor = bgColor; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public Integer getRotationAngle() { return rotationAngle; }
    public void setRotationAngle(Integer rotationAngle) { this.rotationAngle = rotationAngle; }

    public String getTextOverlay() { return textOverlay; }
    public void setTextOverlay(String textOverlay) { this.textOverlay = textOverlay; }

    public String getDoodleDataUrl() { return doodleDataUrl; }
    public void setDoodleDataUrl(String doodleDataUrl) { this.doodleDataUrl = doodleDataUrl; }

    public String getFontStyle() { return fontStyle; }
    public void setFontStyle(String fontStyle) { this.fontStyle = fontStyle; }

    public int getViewsCount() { return viewsCount; }
    public void setViewsCount(int viewsCount) { this.viewsCount = viewsCount; }

    public boolean isSeen() { return seen; }
    public void setSeen(boolean seen) { this.seen = seen; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static StatusBuilder builder() {
        return new StatusBuilder();
    }

    public static class StatusBuilder {
        private String id;
        private String userId;
        private String userName;
        private String userAvatar;
        private String type;
        private String mediaUrl;
        private String textContent;
        private String bgColor;
        private String caption;
        private Integer rotationAngle;
        private String textOverlay;
        private String doodleDataUrl;
        private String fontStyle;
        private int viewsCount;
        private boolean seen;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public StatusBuilder id(String id) { this.id = id; return this; }
        public StatusBuilder userId(String userId) { this.userId = userId; return this; }
        public StatusBuilder userName(String userName) { this.userName = userName; return this; }
        public StatusBuilder userAvatar(String userAvatar) { this.userAvatar = userAvatar; return this; }
        public StatusBuilder type(String type) { this.type = type; return this; }
        public StatusBuilder mediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; return this; }
        public StatusBuilder textContent(String textContent) { this.textContent = textContent; return this; }
        public StatusBuilder bgColor(String bgColor) { this.bgColor = bgColor; return this; }
        public StatusBuilder caption(String caption) { this.caption = caption; return this; }
        public StatusBuilder rotationAngle(Integer rotationAngle) { this.rotationAngle = rotationAngle; return this; }
        public StatusBuilder textOverlay(String textOverlay) { this.textOverlay = textOverlay; return this; }
        public StatusBuilder doodleDataUrl(String doodleDataUrl) { this.doodleDataUrl = doodleDataUrl; return this; }
        public StatusBuilder fontStyle(String fontStyle) { this.fontStyle = fontStyle; return this; }
        public StatusBuilder viewsCount(int viewsCount) { this.viewsCount = viewsCount; return this; }
        public StatusBuilder seen(boolean seen) { this.seen = seen; return this; }
        public StatusBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public StatusBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Status build() {
            return new Status(id, userId, userName, userAvatar, type, mediaUrl, textContent, bgColor, caption, rotationAngle, textOverlay, doodleDataUrl, fontStyle, viewsCount, seen, createdAt, updatedAt);
        }
    }
}
