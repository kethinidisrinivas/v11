package com.example.demo.controller;

import com.example.demo.model.dto.ProfileUpdateRequest;
import com.example.demo.model.entity.User;
import com.example.demo.model.response.ApiResponse;
import com.example.demo.service.ProfileService;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(
        origins = "http://localhost:4200",
        allowedHeaders = "*",
        methods = {
                RequestMethod.GET,
                RequestMethod.POST,
                RequestMethod.PUT,
                RequestMethod.PATCH,
                RequestMethod.DELETE,
                RequestMethod.OPTIONS
        }
)
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @Autowired
    private UserService userService;

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            @PathVariable("userId") String userId,
            @RequestBody ProfileUpdateRequest request
    ) {
        User user = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", user));
    }

    @PostMapping("/{userId}/photo")
    public ResponseEntity<ApiResponse<String>> uploadProfilePhoto(
            @PathVariable("userId") String userId,
            @RequestParam("file") MultipartFile file
    ) {
        String avatarUrl = profileService.updateProfilePhoto(userId, file);
        return ResponseEntity.ok(ApiResponse.success("Profile photo updated successfully", avatarUrl));
    }

    @DeleteMapping("/{userId}/photo")
    public ResponseEntity<ApiResponse<Void>> removeProfilePhoto(@PathVariable("userId") String userId) {
        profileService.removeProfilePhoto(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile photo removed successfully"));
    }
}
