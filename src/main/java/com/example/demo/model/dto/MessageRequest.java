package com.example.demo.model.dto;

public class MessageRequest {
    private String contactId;
    private String text;
    private String type; // TEXT, IMAGE, VIDEO, DOCUMENT, AUDIO
    private String mediaUrl;
    private String fileName;
    private String fileSize;
    private String replyToMessageId;

    public MessageRequest() {
    }

    public MessageRequest(String contactId, String text, String type, String mediaUrl, String fileName, String fileSize, String replyToMessageId) {
        this.contactId = contactId;
        this.text = text;
        this.type = type;
        this.mediaUrl = mediaUrl;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.replyToMessageId = replyToMessageId;
    }

    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileSize() { return fileSize; }
    public void setFileSize(String fileSize) { this.fileSize = fileSize; }

    public String getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(String replyToMessageId) { this.replyToMessageId = replyToMessageId; }
}
