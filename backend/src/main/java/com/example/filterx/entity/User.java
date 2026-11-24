package com.example.filterx.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;

    @Column(name = "country_code")
    private String countryCode;
    
    private String fullName; // ADD THIS FIELD
    private String phoneNumber; // ADD THIS FIELD

    @Lob
    @Column(name = "profile_picture", columnDefinition = "MEDIUMBLOB")
    @JsonIgnore
    private byte[] profilePicture;

    @Column(name = "profile_picture_type", length = 100)
    private String profilePictureType;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Post> posts = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Comment> comments = new ArrayList<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Like> likes = new ArrayList<>();
    
    // Getters and setters for all fields including the new ones
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getFullName() { return fullName; } // ADD GETTER
    public void setFullName(String fullName) { this.fullName = fullName; } // ADD SETTER
    
    public String getPhoneNumber() { return phoneNumber; } // ADD GETTER
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; } // ADD SETTER
    
    public List<Post> getPosts() { return posts; }
    public void setPosts(List<Post> posts) { this.posts = posts; }
    
    public List<Comment> getComments() { return comments; }
    public void setComments(List<Comment> comments) { this.comments = comments; }
    
    public List<Like> getLikes() { return likes; }
    public void setLikes(List<Like> likes) { this.likes = likes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public byte[] getProfilePicture() { return profilePicture; }
    public void setProfilePicture(byte[] profilePicture) { this.profilePicture = profilePicture; }

    public String getProfilePictureType() { return profilePictureType; }
    public void setProfilePictureType(String profilePictureType) { this.profilePictureType = profilePictureType; }

    @Transient
    @JsonProperty("hasProfilePicture")
    public boolean hasProfilePicture() {
        return this.profilePicture != null && this.profilePicture.length > 0;
    }

    @Transient
    @JsonProperty("profilePictureUrl")
    public String getProfilePictureUrl() {
        if (!hasProfilePicture()) {
            return null;
        }
        long ts = this.updatedAt != null ? java.sql.Timestamp.valueOf(this.updatedAt).getTime() : System.currentTimeMillis();
        return "http://localhost:8080/api/users/" + this.id + "/avatar?v=" + ts;
    }
}