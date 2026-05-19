package com.example.filterx.repository;

import com.example.filterx.entity.Post;
import com.example.filterx.entity.User;
import com.example.filterx.entity.Category;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Post> findAllByOrderByCreatedAtDesc();
    List<Post> findByCategoryOrderByCreatedAtDesc(Category category);

    @Transactional
    void deleteAllByUser(User user); // Spring Data JPA generates the query automatically

}
