package com.example.filterx.repository;

import com.example.filterx.entity.Like;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByUserIdAndPostId(Long userId, Long postId);
    Long countByPostId(Long postId);
    List<Like> findByPostId(Long postId); // ADD THIS METHOD

    @Modifying
    @Transactional
    @Query("DELETE FROM Like l WHERE l.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}