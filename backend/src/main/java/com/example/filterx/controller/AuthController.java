package com.example.filterx.controller;

import com.example.filterx.dto.AuthRequest;
import com.example.filterx.dto.UserUpdateRequest;
import com.example.filterx.entity.User;
import com.example.filterx.service.UserService;
import com.example.filterx.utils.PasswordUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {
    
    @Autowired
    private UserService userService;

    @Autowired
    private PasswordUtils passwordUtils;
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User registered successfully");
            response.put("user", registeredUser);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody AuthRequest loginRequest) {
        try {
            String username = loginRequest.getUsername();
            String password = loginRequest.getPassword();
            
            User user = userService.loginUser(username, password);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("user", user);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/check-username/{username}")
    public ResponseEntity<?> checkUsernameAvailability(@PathVariable String username) {
        boolean exists = userService.getUserRepository().existsByUsername(username);
        Map<String, Object> response = new HashMap<>();
        response.put("available", !exists);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/check-email/{email}")
    public ResponseEntity<?> checkEmailAvailability(@PathVariable String email) {
        boolean exists = userService.getUserRepository().existsByEmail(email);
        Map<String, Object> response = new HashMap<>();
        response.put("available", !exists);
        return ResponseEntity.ok(response);
    }

     @PutMapping("/users/{userId}")
public ResponseEntity<?> updateUser(
        @PathVariable Long userId,
        @RequestBody UserUpdateRequest updateRequest) {

    Optional<User> existingUserOpt = userService.getUserById(userId);
    if (existingUserOpt.isEmpty()) {
        return ResponseEntity.status(404)
                .body(Map.of("success", false, "message", "User not found"));
    }

    User userToUpdate = existingUserOpt.get();

    // Check if new username is taken by another user
    if (!userToUpdate.getUsername().equals(updateRequest.getUsername()) &&
        userService.getUserRepository().existsByUsername(updateRequest.getUsername())) {
        return ResponseEntity.status(409)
                .body(Map.of("success", false, "message", "Username is already taken"));
    }

    // Check if new email is taken by another user
    if (!userToUpdate.getEmail().equals(updateRequest.getEmail()) &&
        userService.getUserRepository().existsByEmail(updateRequest.getEmail())) {
        return ResponseEntity.status(409)
                .body(Map.of("success", false, "message", "Email is already taken"));
    }

    // Update editable fields
    userToUpdate.setUsername(updateRequest.getUsername());
    userToUpdate.setEmail(updateRequest.getEmail());
    userToUpdate.setFullName(updateRequest.getFullName());
    userToUpdate.setPhoneNumber(updateRequest.getPhoneNumber());

    // Update password only if provided, else keep existing
    if (updateRequest.getPassword() != null && !updateRequest.getPassword().isEmpty()) {
        userToUpdate.setPassword(passwordUtils.hashPassword(updateRequest.getPassword()));
    }

    // Save the updated user
    User updatedUser = userService.updateUser(userId, userToUpdate);

    // Hide password in response
    updatedUser.setPassword(null);

    Map<String, Object> userMap = new HashMap<>();
    userMap.put("id", updatedUser.getId());
    userMap.put("username", updatedUser.getUsername());
    userMap.put("email", updatedUser.getEmail());
    userMap.put("fullName", updatedUser.getFullName());
    userMap.put("phoneNumber", updatedUser.getPhoneNumber());
    userMap.put("countryCode", updatedUser.getCountryCode());
    userMap.put("createdAt", updatedUser.getCreatedAt());
    userMap.put("updatedAt", updatedUser.getUpdatedAt());
    userMap.put("hasProfilePicture", updatedUser.hasProfilePicture());
    userMap.put("profilePictureUrl", updatedUser.getProfilePictureUrl());

    Map<String, Object> response = new HashMap<>();
    response.put("success", true);
    response.put("message", "User updated successfully");
    response.put("user", userMap);

    return ResponseEntity.ok(response);
}

@GetMapping("/users/{userId}")
public ResponseEntity<?> getUserProfile(@PathVariable Long userId) {
    Optional<User> userOpt = userService.getUserById(userId);
    if (userOpt.isEmpty()) {
        return ResponseEntity.status(404)
                .body(Map.of("success", false, "message", "User not found"));
    }
    User user = userOpt.get();
    Map<String, Object> userMap = new HashMap<>();
    userMap.put("id", user.getId());
    userMap.put("username", user.getUsername());
    userMap.put("email", user.getEmail());
    userMap.put("fullName", user.getFullName());
    userMap.put("phoneNumber", user.getPhoneNumber());
    userMap.put("countryCode", user.getCountryCode());
    userMap.put("createdAt", user.getCreatedAt());
    userMap.put("updatedAt", user.getUpdatedAt());
    userMap.put("hasProfilePicture", user.hasProfilePicture());
    userMap.put("profilePictureUrl", user.getProfilePictureUrl());
    return ResponseEntity.ok(userMap);
}



    @DeleteMapping("/users/{userId}")
public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
    try {
        Optional<User> existingUserOpt = userService.getUserById(userId);

        if (existingUserOpt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("success", false, "message", "User not found"));
        }

        userService.deleteUser(userId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User deleted successfully"
        ));
    } catch (Exception e) {
        return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", "Error deleting user: " + e.getMessage()));
    }
}


}
