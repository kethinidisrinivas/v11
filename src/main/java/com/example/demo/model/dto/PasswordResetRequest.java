package com.example.demo.model.dto;

import jakarta.validation.constraints.NotBlank;

public class PasswordResetRequest {

    @NotBlank(message = "Phone or email is required")
    private String emailOrPhone;

    @NotBlank(message = "OTP code is required")
    private String code;

    @NotBlank(message = "New password is required")
    private String newPassword;

    public PasswordResetRequest() {
    }

    public PasswordResetRequest(String emailOrPhone, String code, String newPassword) {
        this.emailOrPhone = emailOrPhone;
        this.code = code;
        this.newPassword = newPassword;
    }

    public String getEmailOrPhone() {
        return emailOrPhone;
    }

    public void setEmailOrPhone(String emailOrPhone) {
        this.emailOrPhone = emailOrPhone;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
