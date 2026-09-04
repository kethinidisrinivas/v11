package com.example.demo.service;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.exception.UnauthorizedException;
import com.example.demo.exception.ValidationException;
import com.example.demo.model.dto.*;
import com.example.demo.model.entity.User;
import com.example.demo.model.response.AuthResponse;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.secret-key:050605}")
    private String requiredSecretKey;

    private final Map<String, String> pendingOtps = new ConcurrentHashMap<>();

    public void validateSecretKey(String providedSecretKey) {
        if (providedSecretKey != null && !providedSecretKey.trim().isEmpty()) {
            if (!requiredSecretKey.equals(providedSecretKey.trim())) {
                throw new UnauthorizedException("Invalid secret key. Access denied.");
            }
        }
    }

    private Optional<User> findUserByCredential(String credential) {
        if (credential == null || credential.trim().isEmpty()) return Optional.empty();
        String cleanPhone = ValidationUtil.normalizePhone(credential);
        Optional<User> opt = userRepository.findByPhone(cleanPhone);
        if (opt.isPresent()) return opt;

        opt = userRepository.findByEmail(credential.trim());
        if (opt.isPresent()) return opt;

        opt = userRepository.findByUsername(credential.trim());
        if (opt.isPresent()) return opt;

        return userRepository.findById(credential.trim());
    }

    public AuthResponse register(RegisterRequest request, String headerSecretKey) {
        String keyToValidate = request.getSecretKey() != null ? request.getSecretKey() : headerSecretKey;
        validateSecretKey(keyToValidate);

        String cleanPhone = ValidationUtil.normalizePhone(request.getPhone());
        if (userRepository.existsByPhone(cleanPhone)) {
            throw new ValidationException("Phone number already registered.");
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (userRepository.existsByEmail(request.getEmail().trim())) {
                throw new ValidationException("Email address already registered.");
            }
        }

        String rawPassword = request.getPassword() != null && !request.getPassword().trim().isEmpty()
                ? request.getPassword().trim()
                : "password123";

        String username = request.getUsername();
        if (username == null || username.trim().isEmpty()) {
            username = "@user_" + System.currentTimeMillis() % 10000;
        }

        User user = User.builder()
                .name(request.getName().trim())
                .phone(cleanPhone)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .username(username)
                .password(passwordEncoder.encode(rawPassword))
                .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face")
                .statusText("Living in a world of love & stars ✨")
                .isOnline(true)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user.getId());

        return AuthResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .phone(user.getPhone())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .statusText(user.getStatusText())
                .token(token)
                .message("Registration complete! Welcome to Messenger.")
                .build();
    }

    public AuthResponse login(LoginRequest request, String headerSecretKey) {
        String keyToValidate = request.getSecretKey() != null ? request.getSecretKey() : headerSecretKey;
        validateSecretKey(keyToValidate);

        String credential = request.getEmailOrPhone().trim();
        Optional<User> userOpt = findUserByCredential(credential);

        if (userOpt.isEmpty()) {
            throw new UnauthorizedException("Invalid phone/email or password.");
        }

        User user = userOpt.get();

        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new UnauthorizedException("Invalid phone/email or password.");
            }
        }

        user.setOnline(true);
        userRepository.save(user);

        String token = jwtService.generateToken(user.getId());

        return AuthResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .phone(user.getPhone())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .statusText(user.getStatusText())
                .token(token)
                .message("Login successful!")
                .build();
    }

    public String sendOtp(OtpRequest request) {
        String cleanPhone = ValidationUtil.normalizePhone(request.getPhone());
        String otp = "123456";
        pendingOtps.put(cleanPhone, otp);
        return "OTP sent successfully to " + cleanPhone + ". (Demo OTP: " + otp + ")";
    }

    public AuthResponse verifyOtpAndLogin(VerifyOtpRequest request) {
        String cleanPhone = ValidationUtil.normalizePhone(request.getPhone());
        String storedOtp = pendingOtps.getOrDefault(cleanPhone, "123456");

        if (request.getCode() == null || !request.getCode().trim().equals(storedOtp)) {
            throw new ValidationException("Invalid OTP code. Please enter 123456.");
        }

        pendingOtps.remove(cleanPhone);

        User user = userRepository.findByPhone(cleanPhone).orElseGet(() -> {
            User newUser = User.builder()
                    .name("User " + cleanPhone.substring(Math.max(0, cleanPhone.length() - 4)))
                    .phone(cleanPhone)
                    .username("@user_" + System.currentTimeMillis() % 10000)
                    .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face")
                    .statusText("Connected via OTP ✨")
                    .isOnline(true)
                    .build();
            return userRepository.save(newUser);
        });

        String token = jwtService.generateToken(user.getId());

        return AuthResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .phone(user.getPhone())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .statusText(user.getStatusText())
                .token(token)
                .message("Phone verified & logged in successfully!")
                .build();
    }

    public String resetPassword(PasswordResetRequest request) {
        Optional<User> userOpt = findUserByCredential(request.getEmailOrPhone());

        if (userOpt.isEmpty()) {
            throw new ResourceNotFoundException("User account not found.");
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);

        return "Password reset successfully.";
    }

    public User getCurrentUserEntity(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }
}
