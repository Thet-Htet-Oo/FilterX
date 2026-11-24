package com.example.filterx.controller;

import com.example.filterx.entity.User;
import com.example.filterx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    @Autowired
    private UserRepository userRepository;

    private Map<String, Object> buildUserResponseMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("fullName", user.getFullName());
        map.put("phoneNumber", user.getPhoneNumber());
        map.put("countryCode", user.getCountryCode());
        map.put("createdAt", user.getCreatedAt());
        map.put("updatedAt", user.getUpdatedAt());
        map.put("hasProfilePicture", user.hasProfilePicture());
        map.put("profilePictureUrl", user.getProfilePictureUrl());
        return map;
    }

    // 1. GET User Details
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "User not found"));
        }
        return ResponseEntity.ok(buildUserResponseMap(userOpt.get()));
    }

    // 2. GET Profile Picture (Streaming binary)
    @GetMapping("/{id}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        byte[] imageBytes = user.getProfilePicture();
        if (imageBytes == null || imageBytes.length == 0) {
            return ResponseEntity.notFound().build();
        }

        String contentTypeStr = user.getProfilePictureType();
        MediaType mediaType = MediaType.IMAGE_JPEG;
        if (contentTypeStr != null && !contentTypeStr.isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(contentTypeStr);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"avatar\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, must-revalidate")
                .body(imageBytes);
    }

    // 3. POST / Upload Profile Picture
    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        MultipartFile uploadFile = file != null ? file : (avatar != null ? avatar : image);
        if (uploadFile == null || uploadFile.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Please select an image file to upload."));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "User not found"));
        }

        // Validate file size (max 2 MB)
        if (uploadFile.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "File size exceeds the 2 MB limit."));
        }

        // Validate MIME type
        String contentType = uploadFile.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Invalid image format. Allowed formats: JPG, PNG, WEBP, GIF."));
        }

        try {
            User user = userOpt.get();
            user.setProfilePicture(uploadFile.getBytes());
            user.setProfilePictureType(contentType.toLowerCase());
            user.setUpdatedAt(LocalDateTime.now());
            User savedUser = userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Profile picture updated successfully");
            response.put("hasProfilePicture", savedUser.hasProfilePicture());
            response.put("profilePictureUrl", savedUser.getProfilePictureUrl());
            response.put("user", buildUserResponseMap(savedUser));

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to process image upload: " + e.getMessage()));
        }
    }

    // 4. DELETE Profile Picture
    @DeleteMapping("/{id}/avatar")
    public ResponseEntity<?> deleteAvatar(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "User not found"));
        }

        User user = userOpt.get();
        user.setProfilePicture(null);
        user.setProfilePictureType(null);
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Profile picture removed successfully");
        response.put("hasProfilePicture", false);
        response.put("profilePictureUrl", null);
        response.put("user", buildUserResponseMap(savedUser));

        return ResponseEntity.ok(response);
    }
}
