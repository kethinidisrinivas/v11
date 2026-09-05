package com.example.demo.model.response;

import java.util.Date;
import java.util.List;

public class MessageResponse {
    private String id;
    private String senderId;
    private String senderName;
    private String receiverId;
    private String text;
    private Date timestamp;
    private String timeStr;
    private boolean isRead;
    private String status; // sent, delivered, seen
    private boolean isStarred;
    private boolean isEdited;
    private boolean isDeletedForEveryone;
    private Object attachment;
    private Object replyTo;
    private List<Object> reactions;

    public MessageResponse() {
    }

    public MessageResponse(String id, String senderId, String senderName, String receiverId, String text, Date timestamp, String timeStr, boolean isRead, String status, boolean isStarred, boolean isEdited, boolean isDeletedForEveryone, Object attachment, Object replyTo, List<Object> reactions) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.receiverId = receiverId;
        this.text = text;
        this.timestamp = timestamp;
        this.timeStr = timeStr;
        this.isRead = isRead;
        this.status = status;
        this.isStarred = isStarred;
        this.isEdited = isEdited;
        this.isDeletedForEveryone = isDeletedForEveryone;
        this.attachment = attachment;
        this.replyTo = replyTo;
        this.reactions = reactions;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Date getTimestamp() { return timestamp; }
    public void setTimestamp(Date timestamp) { this.timestamp = timestamp; }

    public String getTimeStr() { return timeStr; }
    public void setTimeStr(String timeStr) { this.timeStr = timeStr; }

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

    public Object getAttachment() { return attachment; }
    public void setAttachment(Object attachment) { this.attachment = attachment; }

    public Object getReplyTo() { return replyTo; }
    public void setReplyTo(Object replyTo) { this.replyTo = replyTo; }

    public List<Object> getReactions() { return reactions; }
    public void setReactions(List<Object> reactions) { this.reactions = reactions; }
}
