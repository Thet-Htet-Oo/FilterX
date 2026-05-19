package com.example.filterx.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore; // Add this import

@Entity
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 1000)
    private String content;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    private LocalDateTime createdAt;
    
    // ⚠️ REMOVE DUPLICATE FIELD - KEEP ONLY ONE comments FIELD
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Add this to prevent circular references
    private List<Comment> comments = new ArrayList<>();
    
    // ⚠️ REMOVE DUPLICATE FIELD - KEEP ONLY ONE likes FIELD
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Add this to prevent circular references
    private List<Like> likes = new ArrayList<>();
    
    public Post() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Post(String content, User user) {
        this();
        this.content = content;
        this.user = user;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    // Add getter and setter
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    
    // Getters and setters - ONLY ONE SET PER FIELD
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public List<Comment> getComments() { return comments; }
    public void setComments(List<Comment> comments) { this.comments = comments; }
    
    public List<Like> getLikes() { return likes; }
    public void setLikes(List<Like> likes) { this.likes = likes; }
}