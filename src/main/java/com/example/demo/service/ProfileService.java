package com.example.demo.service;

import com.example.demo.model.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private FirebaseStorageService firebaseStorageService;

    public String updateProfilePhoto(String userId, MultipartFile file) {
        User user = userService.getUserById(userId);
        String avatarUrl = firebaseStorageService.replaceFile(file, user.getAvatar(), "profiles");
        user.setAvatar(avatarUrl);
        userRepository.save(user);
        return avatarUrl;
    }

    public void removeProfilePhoto(String userId) {
        User user = userService.getUserById(userId);
        if (user.getAvatar() != null) {
            firebaseStorageService.deleteFile(user.getAvatar());
        }
        String defaultAvatar = "https://ui-avatars.com/api/?name=" + java.net.URLEncoder.encode(user.getName(), java.nio.charset.StandardCharsets.UTF_8) + "&background=e0b0ff&color=051424&bold=true";
        user.setAvatar(defaultAvatar);
        userRepository.save(user);
    }
}
