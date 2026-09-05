package com.example.demo.model.dto;

public class FileUploadRequest {
    private String folder; // profile, chat, status
    private String mediaType; // image, video, document, audio

    public FileUploadRequest() {
    }

    public FileUploadRequest(String folder, String mediaType) {
        this.folder = folder;
        this.mediaType = mediaType;
    }

    public String getFolder() { return folder; }
    public void setFolder(String folder) { this.folder = folder; }

    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
}
