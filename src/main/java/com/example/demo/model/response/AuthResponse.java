package com.example.demo.model.response;

public class AuthResponse {
    private String id;
    private String name;
    private String username;
    private String phone;
    private String email;
    private String avatar;
    private String statusText;
    private String token;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(String id, String name, String username, String phone, String email, String avatar, String statusText, String token, String message) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.phone = phone;
        this.email = email;
        this.avatar = avatar;
        this.statusText = statusText;
        this.token = token;
        this.message = message;
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

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getStatusText() { return statusText; }
    public void setStatusText(String statusText) { this.statusText = statusText; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }

    public static class AuthResponseBuilder {
        private String id;
        private String name;
        private String username;
        private String phone;
        private String email;
        private String avatar;
        private String statusText;
        private String token;
        private String message;

        public AuthResponseBuilder id(String id) { this.id = id; return this; }
        public AuthResponseBuilder name(String name) { this.name = name; return this; }
        public AuthResponseBuilder username(String username) { this.username = username; return this; }
        public AuthResponseBuilder phone(String phone) { this.phone = phone; return this; }
        public AuthResponseBuilder email(String email) { this.email = email; return this; }
        public AuthResponseBuilder avatar(String avatar) { this.avatar = avatar; return this; }
        public AuthResponseBuilder statusText(String statusText) { this.statusText = statusText; return this; }
        public AuthResponseBuilder token(String token) { this.token = token; return this; }
        public AuthResponseBuilder message(String message) { this.message = message; return this; }

        public AuthResponse build() {
            return new AuthResponse(id, name, username, phone, email, avatar, statusText, token, message);
        }
    }
}
