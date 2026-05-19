package com.example.filterx.repository;

import com.example.filterx.entity.Comment;
import com.example.filterx.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId")
    List<Comment> findByPostId(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Comment c WHERE c.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);

    @Transactional
    void deleteAllByUser(User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM Comment c WHERE c.id = :commentId")
    void deleteByCommentId(@Param("commentId") Long commentId);

    @Query("SELECT c.post.id FROM Comment c WHERE c.id = :commentId")
    Long findPostIdByCommentId(@Param("commentId") Long commentId);

    @Query("SELECT c FROM Comment c WHERE c.id = :commentId")
    Optional<Comment> findCommentById(@Param("commentId") Long commentId);
}