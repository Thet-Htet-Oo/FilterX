package com.example.filterx.service;

import com.example.filterx.entity.User;
import com.example.filterx.repository.UserRepository;
import com.example.filterx.repository.PostRepository;
import com.example.filterx.repository.CommentRepository;
import com.example.filterx.utils.PasswordUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import com.example.filterx.utils.PhoneValidator;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private PasswordUtils passwordUtils;

    
    public User registerUser(User user) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Hash the password before saving
        String hashedPassword = passwordUtils.hashPassword(user.getPassword());
        user.setPassword(hashedPassword);

        // Validate & format phone number if provided
        if (user.getPhoneNumber() != null && !user.getPhoneNumber().isEmpty()) {
        try {
            String region = user.getCountryCode() != null ? user.getCountryCode() : "MM";
            String formattedPhone = PhoneValidator.validateAndFormat(user.getPhoneNumber(), region);
            user.setPhoneNumber(formattedPhone);
        } catch (RuntimeException e) {
            throw new RuntimeException("Invalid phone number: " + e.getMessage());
        }
    }

    return userRepository.save(user);
}

    public User loginUser(String username, String password) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            // Verify the password against the hashed version
            if (passwordUtils.verifyPassword(password, user.get().getPassword())) {
                return user.get();
            }
        }
        throw new RuntimeException("Invalid username or password");
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    public User updateUser(Long userId, User userToUpdate) {
    User existingUser = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found"));

    // Only overwrite fields that are non-null / updated
    existingUser.setUsername(userToUpdate.getUsername());
    existingUser.setEmail(userToUpdate.getEmail());
    existingUser.setFullName(userToUpdate.getFullName());

    // Password is already hashed in controller, so just set it if provided
    if (userToUpdate.getPassword() != null && !userToUpdate.getPassword().isEmpty()) {
        existingUser.setPassword(userToUpdate.getPassword());
    }

    if (userToUpdate.getPhoneNumber() != null && !userToUpdate.getPhoneNumber().isEmpty()) {
    String region = userToUpdate.getCountryCode() != null ? userToUpdate.getCountryCode() : "MM";
    String formattedPhone = PhoneValidator.validateAndFormat(userToUpdate.getPhoneNumber(), region);
    existingUser.setPhoneNumber(formattedPhone);
    existingUser.setCountryCode(region); 
}

    return userRepository.save(existingUser);
}




    
    // ADD THIS DELETE METHOD
    public void deleteUser(Long id) {
    // Fetch the user entity first
    User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

    // Delete related posts and comments
    postRepository.deleteAllByUser(user);
    commentRepository.deleteAllByUser(user);

    // Delete the user
    userRepository.delete(user);
}

    
    public UserRepository getUserRepository() {
        return userRepository;
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }
}