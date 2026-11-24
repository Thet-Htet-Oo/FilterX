package com.example.filterx.repository;

import com.example.filterx.entity.CommentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface CommentAttachmentRepository extends JpaRepository<CommentAttachment, Long> {
    Optional<CommentAttachment> findByCommentId(Long commentId);

    @Modifying
    @Transactional
    @Query("DELETE FROM CommentAttachment ca WHERE ca.comment.id = :commentId")
    void deleteByCommentId(@Param("commentId") Long commentId);
}
