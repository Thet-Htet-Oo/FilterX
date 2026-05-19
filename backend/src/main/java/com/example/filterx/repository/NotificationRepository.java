// src/main/java/com/example/filterx/repository/NotificationRepository.java
package com.example.filterx.repository;

import com.example.filterx.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.isRead = false")
    Long countUnreadByUserId(@Param("userId") Long userId);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id")
    int markAsRead(@Param("id") Long id);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId")
    int markAllAsRead(@Param("userId") Long userId);
}