package com.example.demo.util;

import java.util.regex.Pattern;

public class ValidationUtil {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^[+]?[0-9\\s-]{7,15}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^@[a-zA-Z0-9_]{3,20}$");

    public static boolean isValidPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) return false;
        return PHONE_PATTERN.matcher(phone.trim()).matches();
    }

    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) return false;
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    public static boolean isValidUsername(String username) {
        if (username == null || username.trim().isEmpty()) return false;
        return USERNAME_PATTERN.matcher(username.trim()).matches();
    }

    public static String normalizePhone(String phone) {
        if (phone == null) return "";
        String trimmed = phone.trim();
        if (trimmed.startsWith("+")) return trimmed;
        return "+91 " + trimmed;
    }
}
