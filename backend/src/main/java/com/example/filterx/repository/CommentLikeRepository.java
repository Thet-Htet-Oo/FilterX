package com.example.filterx.repository;

import com.example.filterx.entity.CommentLike;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
    
    // Find by user ID and comment ID
    @Query("SELECT cl FROM CommentLike cl WHERE cl.user.id = :userId AND cl.comment.id = :commentId")
    Optional<CommentLike> findByUserIdAndCommentId(@Param("userId") Long userId, @Param("commentId") Long commentId);
    
    // Check if like exists
    @Query("SELECT COUNT(cl) > 0 FROM CommentLike cl WHERE cl.user.id = :userId AND cl.comment.id = :commentId")
    boolean existsByUserIdAndCommentId(@Param("userId") Long userId, @Param("commentId") Long commentId);
    
    // Count likes for a comment
    @Query("SELECT COUNT(cl) FROM CommentLike cl WHERE cl.comment.id = :commentId")
    int countByCommentId(@Param("commentId") Long commentId);
    
    // Find all likes for a comment
    @Query("SELECT cl FROM CommentLike cl WHERE cl.comment.id = :commentId")
    List<CommentLike> findByCommentId(@Param("commentId") Long commentId);
    
    // Delete like by user and comment
    @Query("DELETE FROM CommentLike cl WHERE cl.user.id = :userId AND cl.comment.id = :commentId")
    void deleteByUserIdAndCommentId(@Param("userId") Long userId, @Param("commentId") Long commentId);

     @Modifying
    @Transactional
    @Query("DELETE FROM CommentLike cl WHERE cl.comment.id = :commentId")
    void deleteByCommentId(@Param("commentId") Long commentId);
}