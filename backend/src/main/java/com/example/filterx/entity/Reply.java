package com.example.filterx.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "replies")
public class Reply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 500)
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"posts", "comments", "replies", "password"}) 
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "comment_id", nullable = false)
    @JsonIgnore
    private Comment comment;
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "reply", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ReplyLike> likes = new ArrayList<>();
    
    public Reply() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Reply(String content, User user, Comment comment) {
        this();
        this.content = content;
        this.user = user;
        this.comment = comment;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Comment getComment() { return comment; }
    public void setComment(Comment comment) { this.comment = comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<ReplyLike> getLikes() { return likes; }
    public void setLikes(List<ReplyLike> likes) { this.likes = likes; }
}