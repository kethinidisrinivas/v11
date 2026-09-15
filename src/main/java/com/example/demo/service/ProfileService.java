package com.example.demo.service;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.exception.UnauthorizedException;
import com.example.demo.exception.ValidationException;
import com.example.demo.model.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.FileUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private FirebaseStorageService firebaseStorageService;

    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "jpg", "jpeg", "png", "webp"
    );

    public Map<String, Object> uploadProfilePicture(String userId, MultipartFile file) {
        User user = userService.getUserById(userId);

        validateUserAuthorization(user);
        validateImageFile(file);

        String avatarUrl = firebaseStorageService.replaceFile(file, user.getAvatar(), "profiles");
        user.setAvatar(avatarUrl);
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Profile picture updated successfully");
        response.put("profilePictureUrl", avatarUrl);
        response.put("avatar", avatarUrl);
        response.put("user", user);

        return response;
    }

    public String updateProfilePhoto(String userId, MultipartFile file) {
        Map<String, Object> res = uploadProfilePicture(userId, file);
        return (String) res.get("avatar");
    }

    public void removeProfilePhoto(String userId) {
        User user = userService.getUserById(userId);
        validateUserAuthorization(user);

        if (user.getAvatar() != null && !user.getAvatar().contains("ui-avatars.com")) {
            firebaseStorageService.deleteFile(user.getAvatar());
        }
        String defaultAvatar = "https://ui-avatars.com/api/?name=" + java.net.URLEncoder.encode(user.getName(), java.nio.charset.StandardCharsets.UTF_8) + "&background=e0b0ff&color=051424&bold=true";
        user.setAvatar(defaultAvatar);
        userRepository.save(user);
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Cannot upload empty file");
        }

        if (file.getSize() > 50 * 1024 * 1024) {
            throw new ValidationException("File size exceeds maximum allowed limit of 50MB");
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        String extension = FileUtil.getFileExtension(originalFilename).toLowerCase();

        boolean isMimeAllowed = contentType != null && ALLOWED_MIME_TYPES.contains(contentType.toLowerCase());
        boolean isExtAllowed = ALLOWED_EXTENSIONS.contains(extension);

        if (!isMimeAllowed && !isExtAllowed) {
            throw new ValidationException("Invalid image file type. Only JPG, PNG, and WEBP image files are allowed.");
        }
    }

    private void validateUserAuthorization(User targetUser) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return;
        }

        String principalName = auth.getName();
        if (principalName != null && !principalName.isEmpty()) {
            boolean matches = principalName.equals(targetUser.getId()) ||
                              principalName.equalsIgnoreCase(targetUser.getPhone()) ||
                              principalName.equalsIgnoreCase(targetUser.getEmail()) ||
                              principalName.equalsIgnoreCase(targetUser.getUsername());
            if (!matches) {
                throw new UnauthorizedException("You are not authorized to update another user's profile picture.");
            }
        }
    }
}
