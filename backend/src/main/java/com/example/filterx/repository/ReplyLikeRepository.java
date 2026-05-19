package com.example.filterx.repository;

import com.example.filterx.entity.ReplyLike;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ReplyLikeRepository extends JpaRepository<ReplyLike, Long> {
    
    @Query("SELECT rl FROM ReplyLike rl WHERE rl.user.id = :userId AND rl.reply.id = :replyId")
    Optional<ReplyLike> findByUserIdAndReplyId(@Param("userId") Long userId, @Param("replyId") Long replyId);
    
    @Query("SELECT COUNT(rl) FROM ReplyLike rl WHERE rl.reply.id = :replyId")
    long countByReplyId(@Param("replyId") Long replyId);
    
    @Query("SELECT CASE WHEN COUNT(rl) > 0 THEN true ELSE false END FROM ReplyLike rl WHERE rl.user.id = :userId AND rl.reply.id = :replyId")
    boolean existsByUserIdAndReplyId(@Param("userId") Long userId, @Param("replyId") Long replyId);

     @Modifying
    @Transactional
    @Query("DELETE FROM ReplyLike rl WHERE rl.reply.id = :replyId")
    void deleteByReplyId(@Param("replyId") Long replyId);
}