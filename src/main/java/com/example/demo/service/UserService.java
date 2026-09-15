package com.example.demo.service;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.dto.ProfileUpdateRequest;
import com.example.demo.model.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    public List<User> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return userRepository.findAll();
        }
        return userRepository.searchUsers(query.trim());
    }

    public User updateProfile(String userId, ProfileUpdateRequest request) {
        User user = getUserById(userId);
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName().trim());
        }
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            String uname = request.getUsername().trim();
            if (!uname.startsWith("@")) uname = "@" + uname;
            user.setUsername(uname);
        }
        if (request.getStatusText() != null) {
            user.setStatusText(request.getStatusText().trim());
        }
        if (request.getAvatar() != null && !request.getAvatar().trim().isEmpty()) {
            user.setAvatar(request.getAvatar().trim());
        }
        return userRepository.save(user);
    }
}
