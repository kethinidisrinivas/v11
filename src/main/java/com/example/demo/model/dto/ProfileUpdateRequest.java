package com.example.demo.model.dto;

public class ProfileUpdateRequest {
    private String name;
    private String username;
    private String statusText;
    private String avatar;
    private String about;

    public ProfileUpdateRequest() {
    }

    public ProfileUpdateRequest(String name, String username, String statusText, String avatar, String about) {
        this.name = name;
        this.username = username;
        this.statusText = statusText;
        this.avatar = avatar;
        this.about = about;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getStatusText() { return statusText; }
    public void setStatusText(String statusText) { this.statusText = statusText; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getAbout() { return about; }
    public void setAbout(String about) { this.about = about; }
}
