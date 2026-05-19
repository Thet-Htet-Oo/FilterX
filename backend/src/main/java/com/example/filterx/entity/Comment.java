package com.example.filterx.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "comments")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 500)
    private String content;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"posts", "comments", "likes", "password", "email"})
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    @JsonIgnore
    private Post post;
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<CommentLike> likes = new ArrayList<>();
    
    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Reply> replies = new ArrayList<>();
    
    public Comment() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Comment(String content, User user, Post post) {
        this();
        this.content = content;
        this.user = user;
        this.post = post;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Post getPost() { return post; }
    public void setPost(Post post) { this.post = post; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<CommentLike> getLikes() { return likes; }
    public void setLikes(List<CommentLike> likes) { this.likes = likes; }
    public List<Reply> getReplies() { return replies; }
    public void setReplies(List<Reply> replies) { this.replies = replies; }
    
    // Helper method to add like
    public void addLike(CommentLike like) {
        likes.add(like);
        like.setComment(this);
    }
    
    // Helper method to remove like
    public void removeLike(CommentLike like) {
        likes.remove(like);
        like.setComment(null);
    }
}