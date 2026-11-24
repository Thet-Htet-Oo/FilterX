package com.example.filterx.repository;

import com.example.filterx.entity.PostAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PostAttachmentRepository extends JpaRepository<PostAttachment, Long> {
    List<PostAttachment> findByPostId(Long postId);

    @Modifying
    @Transactional
    @Query("DELETE FROM PostAttachment pa WHERE pa.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
