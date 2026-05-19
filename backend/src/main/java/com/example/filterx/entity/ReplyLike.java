package com.example.filterx.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "reply_likes")
public class ReplyLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "reply_id", nullable = false)
    @JsonIgnore
    private Reply reply;
    
    public ReplyLike() {}
    
    public ReplyLike(User user, Reply reply) {
        this.user = user;
        this.reply = reply;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Reply getReply() { return reply; }
    public void setReply(Reply reply) { this.reply = reply; }
}
