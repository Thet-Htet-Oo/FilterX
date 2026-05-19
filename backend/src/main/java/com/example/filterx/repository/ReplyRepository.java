package com.example.filterx.repository;

import com.example.filterx.entity.Reply;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReplyRepository extends JpaRepository<Reply, Long> {
    
    @Query("SELECT r FROM Reply r WHERE r.comment.id = :commentId ORDER BY r.createdAt ASC")
    List<Reply> findByCommentIdOrderByCreatedAtAsc(@Param("commentId") Long commentId);
    
    @Query("SELECT COUNT(r) FROM Reply r WHERE r.comment.id = :commentId")
    int countByCommentId(@Param("commentId") Long commentId);

     @Query("SELECT r FROM Reply r WHERE r.comment.id = :commentId")
    List<Reply> findByCommentId(@Param("commentId") Long commentId);

     @Modifying
    @Transactional
    @Query("DELETE FROM Reply r WHERE r.comment.id = :commentId")
    void deleteByCommentId(@Param("commentId") Long commentId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Reply r WHERE r.id = :replyId")
    void deleteByReplyId(@Param("replyId") Long replyId);

    @Query("SELECT r.comment.id FROM Reply r WHERE r.id = :replyId")
    Long findCommentIdByReplyId(@Param("replyId") Long replyId);

    @Query("SELECT r FROM Reply r WHERE r.id = :replyId")
    Optional<Reply> findReplyById(@Param("replyId") Long replyId);

}