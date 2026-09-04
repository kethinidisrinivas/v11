package com.example.demo.controller;

import com.example.demo.model.dto.ProfileUpdateRequest;
import com.example.demo.model.entity.User;
import com.example.demo.model.response.ApiResponse;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
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
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllOrSearchUsers(@RequestParam(value = "query", required = false) String query) {
        List<User> users = userService.searchUsers(query);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable("id") String id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUserProfile(
            @PathVariable("id") String id,
            @RequestBody ProfileUpdateRequest request
    ) {
        User updated = userService.updateProfile(id, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }
}
