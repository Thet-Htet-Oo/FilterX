
package com.example.filterx.service;

import com.example.filterx.entity.Notification;
import com.example.filterx.entity.NotificationType;
import com.example.filterx.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId);
    }

    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    public Notification createNotification(Notification notification) {
        return notificationRepository.save(notification);
    }

    // New methods for specific notification types
    public Notification createLikePostNotification(Long userId, Long senderId, String senderUsername, Long postId) {
        Notification notification = new Notification(
                userId, senderId, senderUsername,
                NotificationType.LIKE_POST, postId,
                "liked your post"
        );
        return notificationRepository.save(notification);
    }

    public Notification createLikeCommentNotification(Long userId, Long senderId, String senderUsername, Long commentId) {
        Notification notification = new Notification(
                userId, senderId, senderUsername,
                NotificationType.LIKE_COMMENT, commentId,
                "liked your comment"
        );
        return notificationRepository.save(notification);
    }

    public Notification createLikeReplyNotification(Long userId, Long senderId, String senderUsername, Long replyId) {
        Notification notification = new Notification(
                userId, senderId, senderUsername,
                NotificationType.LIKE_REPLY, replyId,
                "liked your reply"
        );
        return notificationRepository.save(notification);
    }

    public Notification createCommentNotification(Long userId, Long senderId, String senderUsername, Long postId, String commentContent) {
        String truncatedContent = commentContent.length() > 50 ?
                commentContent.substring(0, 47) + "..." : commentContent;
        Notification notification = new Notification(
                userId, senderId, senderUsername,
                NotificationType.COMMENT, postId,
                "commented: " + truncatedContent
        );
        return notificationRepository.save(notification);
    }

    public Notification createReplyNotification(Long userId, Long senderId, String senderUsername, Long commentId, String replyContent) {
        String truncatedContent = replyContent.length() > 50 ?
                replyContent.substring(0, 47) + "..." : replyContent;
        Notification notification = new Notification(
                userId, senderId, senderUsername,
                NotificationType.REPLY, commentId,
                "replied: " + truncatedContent
        );
        return notificationRepository.save(notification);
    }
}