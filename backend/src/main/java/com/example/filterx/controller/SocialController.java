package com.example.filterx.controller;

// ✅ CORRECT
import com.example.filterx.entity.*;
import com.example.filterx.repository.*;
import com.example.filterx.service.PostService;
import com.example.filterx.service.NotificationService;
import com.example.filterx.dto.CategoryDTO;
import com.example.filterx.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/social")
@CrossOrigin(origins = "http://localhost:5173")
public class SocialController {
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private LikeRepository likeRepository;
    
    @Autowired
    private ReplyRepository replyRepository;
    
    @Autowired
    private ReplyLikeRepository replyLikeRepository;

    @Autowired
    private CommentLikeRepository commentLikeRepository;

    @Autowired
    private PostService postService;

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private CategoryService CategoryService;
    
    @Autowired
    private CategoryRepository CategoryRepository;

    

    // Posts endpoints with toxic content filtering
    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> request) {
        try {
            String content = (String) request.get("content");
            Long userId = Long.parseLong(request.get("userId").toString());

            Long categoryId = request.get("categoryId") != null ? 
                Long.parseLong(request.get("categoryId").toString()) : null;
            
            Optional<User> user = userRepository.findById(userId);
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }
            
            Post post = new Post(content, user.get());

            // Set category if provided
            if (categoryId != null) {
                Optional<Category> category = CategoryRepository.findById(categoryId);
                category.ifPresent(post::setCategory);
            }
            
            // Use PostService for toxic content filtering
            Post savedPost = postService.savePost(post);
            
            // Return simplified response to avoid circular references
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedPost.getId());
            response.put("content", savedPost.getContent());
            response.put("createdAt", savedPost.getCreatedAt());
            
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", savedPost.getUser().getId());
            userMap.put("username", savedPost.getUser().getUsername());
            response.put("user", userMap);

            // Add category info if exists
            if (savedPost.getCategory() != null) {
                Map<String, Object> categoryMap = new HashMap<>();
                categoryMap.put("id", savedPost.getCategory().getId());
                categoryMap.put("name", savedPost.getCategory().getName());
                categoryMap.put("color", savedPost.getCategory().getColor());
                response.put("category", categoryMap);
            }
            
            response.put("comments", new ArrayList<>());
            response.put("likes", new ArrayList<>());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Content rejected", "message", e.getMessage())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating post: " + e.getMessage());
        }
    }

    // FIXED: Get all posts without circular references
    @GetMapping("/posts")
    public ResponseEntity<List<Map<String, Object>>> getAllPosts() {
        try {
            List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
            
            List<Map<String, Object>> response = posts.stream().map(post -> {
                Map<String, Object> postMap = new HashMap<>();
                postMap.put("id", post.getId());
                postMap.put("content", post.getContent());
                postMap.put("createdAt", post.getCreatedAt());
                
                // User info
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", post.getUser().getId());
                userMap.put("username", post.getUser().getUsername());
                postMap.put("user", userMap);

                // Category info - MAKE SURE THIS IS INCLUDED
                if (post.getCategory() != null) {
                    Map<String, Object> categoryMap = new HashMap<>();
                    categoryMap.put("id", post.getCategory().getId());
                    categoryMap.put("name", post.getCategory().getName());
                    categoryMap.put("color", post.getCategory().getColor());
                    postMap.put("category", categoryMap);
                    postMap.put("categoryId", post.getCategory().getId()); // Also include categoryId for reference
                }
                
                // Comments count and data - get comments from repository
                List<Comment> postComments = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
                postMap.put("commentCount", postComments.size());
                
                // Likes count - get likes from repository
                Long likeCount = likeRepository.countByPostId(post.getId());
                postMap.put("likeCount", likeCount != null ? likeCount : 0);
                
                // Actual comments data (simplified)
                List<Map<String, Object>> comments = postComments.stream().map(comment -> {
                    Map<String, Object> commentMap = new HashMap<>();
                    commentMap.put("id", comment.getId());
                    commentMap.put("content", comment.getContent());
                    commentMap.put("createdAt", comment.getCreatedAt());
                    
                    Map<String, Object> commentUser = new HashMap<>();
                    commentUser.put("id", comment.getUser().getId());
                    commentUser.put("username", comment.getUser().getUsername());
                    commentMap.put("user", commentUser);
                    
                    // Add comment like count
                    int commentLikeCount = commentLikeRepository.countByCommentId(comment.getId());
                    commentMap.put("likeCount", commentLikeCount);
                    commentMap.put("likes", new ArrayList<>()); // Empty array for frontend
                    commentMap.put("replies", new ArrayList<>()); // Empty array for frontend
                    
                    return commentMap;
                }).collect(Collectors.toList());
                postMap.put("comments", comments);
                
                // Actual likes data (simplified) - get from repository
                List<Map<String, Object>> likes = new ArrayList<>();
                List<Like> postLikes = likeRepository.findByPostId(post.getId());
                if (postLikes != null) {
                    likes = postLikes.stream().map(like -> {
                        Map<String, Object> likeMap = new HashMap<>();
                        likeMap.put("id", like.getId());
                        
                        Map<String, Object> likeUser = new HashMap<>();
                        likeUser.put("id", like.getUser().getId());
                        likeUser.put("username", like.getUser().getUsername());
                        likeMap.put("user", likeUser);
                        
                        return likeMap;
                    }).collect(Collectors.toList());
                }
                postMap.put("likes", likes);
                
                return postMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // FIXED: Comment creation with proper toxic content checking
    @PostMapping("/comments")
    public ResponseEntity<?> createComment(@RequestBody Map<String, Object> request) {
        try {
            String content = (String) request.get("content");
            Long userId = Long.parseLong(request.get("userId").toString());
            Long postId = Long.parseLong(request.get("postId").toString());
            
            Optional<User> user = userRepository.findById(userId);
            Optional<Post> post = postRepository.findById(postId);
            
            if (user.isEmpty() || post.isEmpty()) {
                return ResponseEntity.badRequest().body("User or Post not found");
            }
            
            // Use PostService to check for toxic content
            try {
                postService.checkToxicContent(content); // This will throw if toxic
                
                // If not toxic, save the comment
                Comment comment = new Comment(content, user.get(), post.get());
                Comment savedComment = commentRepository.save(comment);

                // Create notification for post owner (if not commenting on own post)
                Long postOwnerId = post.get().getUser().getId();
                if (!postOwnerId.equals(userId)) {
                    notificationService.createCommentNotification(
                            postOwnerId,
                            userId,
                            user.get().getUsername(),
                            postId,
                            content
                    );
                }
                
                // Return simplified response that matches what frontend expects
                Map<String, Object> response = new HashMap<>();
                response.put("id", savedComment.getId());
                response.put("content", savedComment.getContent());
                response.put("createdAt", savedComment.getCreatedAt());
                
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", savedComment.getUser().getId());
                userMap.put("username", savedComment.getUser().getUsername());
                response.put("user", userMap);
                
                // Add empty arrays for likes and replies to match frontend expectation
                response.put("likes", new ArrayList<>());
                response.put("replies", new ArrayList<>());
                response.put("likeCount", 0);
                
                return ResponseEntity.ok(response);
                
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "Content rejected", "message", e.getMessage())
                );
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating comment: " + e.getMessage());
        }
    }

    // FIXED: Comment like functionality with proper error handling
   @PostMapping ("/comments/{commentId}/likes")
    public ResponseEntity<?> toggleCommentLike(@PathVariable Long commentId, @RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            
            System.out.println("Toggling comment like - Comment ID: " + commentId + ", User ID: : " + userId);
            
            // Check if user and comment exist
            Optional<User> user = userRepository.findById(userId);
            Optional<Comment> comment = commentRepository.findById(commentId);
            
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            if (comment.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Comment not found"));
            }
            
            // Check if like already exists
            Optional<CommentLike> existingLike = commentLikeRepository.findByUserIdAndCommentId(userId, commentId);
            
            if (existingLike.isPresent()) {
                // Remove like
                commentLikeRepository.delete(existingLike.get());
                System.out.println("Comment like removed successfully");
                
                Map<String, Object> response = new HashMap<>();
                response.put("liked", false);
                response.put("message", "Comment like removed successfully");
                response.put("likeCount", commentLikeRepository.countByCommentId(commentId));
                return ResponseEntity.ok(response);
            } else {
                // Add like
                CommentLike newLike = new CommentLike(user.get(), comment.get());
                commentLikeRepository.save(newLike);
                // Create notification for comment owner (if not liking own comment)
                Long commentOwnerId = comment.get().getUser().getId();
                if (!commentOwnerId.equals(userId)) {
                    notificationService.createLikeCommentNotification(
                            commentOwnerId,
                            userId,
                            user.get().getUsername(),
                            commentId
                    );
                }
                
                Map<String, Object> response = new HashMap<>();
                response.put("liked", true);
                response.put("message", "Comment like added successfully");
                response.put("likeCount", commentLikeRepository.countByCommentId(commentId));
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            System.err.println("Error toggling comment like: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Error toggling comment like: " + e.getMessage()));
        }
    }

    // FIXED: Reply functionality
    // @PostMapping("/comments/{commentId}/replies")
    // public ResponseEntity<?> createReply(@PathVariable Long commentId, @RequestBody Map<String, Object> request) {
    //     try {
    //         String content = (String) request.get("content");
    //         Long userId = Long.parseLong(request.get("userId").toString());
            
    //         Optional<User> user = userRepository.findById(userId);
    //         Optional<Comment> comment = commentRepository.findById(commentId);
            
    //         if (user.isEmpty() || comment.isEmpty()) {
    //             return ResponseEntity.badRequest().body("User or Comment not found");
    //         }
            
    //         // Use PostService to check for toxic content
    //         try {
    //             postService.checkToxicContent(content);
                
    //             // If not toxic, save the reply
    //             Reply reply = new Reply(content, user.get(), comment.get());
    //             Reply savedReply = replyRepository.save(reply);
                
    //             // Return simplified response
    //             Map<String, Object> response = new HashMap<>();
    //             response.put("id", savedReply.getId());
    //             response.put("content", savedReply.getContent());
    //             response.put("createdAt", savedReply.getCreatedAt());
                
    //             Map<String, Object> userMap = new HashMap<>();
    //             userMap.put("id", savedReply.getUser().getId());
    //             userMap.put("username", savedReply.getUser().getUsername());
    //             response.put("user", userMap);
                
    //             response.put("likeCount", 0);
    //             response.put("likes", new ArrayList<>());
                
    //             return ResponseEntity.ok(response);
                
    //         } catch (IllegalArgumentException e) {
    //             return ResponseEntity.badRequest().body(
    //                 Map.of("error", "Content rejected", "message", e.getMessage())
    //             );
    //         }
            
    //     } catch (Exception e) {
    //         e.printStackTrace();
    //         return ResponseEntity.badRequest().body("Error creating reply: " + e.getMessage());
    //     }
    // }
    // FIXED: Reply endpoints with proper toxic content filtering
@PostMapping("/comments/{commentId}/replies")
public ResponseEntity<?> createReply(@PathVariable Long commentId, @RequestBody Map<String, Object> request) {
    try {
        String content = (String) request.get("content");
        Long userId = Long.parseLong(request.get("userId").toString());
        
        Optional<User> user = userRepository.findById(userId);
        Optional<Comment> comment = commentRepository.findById(commentId);
        
        if (user.isEmpty() || comment.isEmpty()) {
            return ResponseEntity.badRequest().body("User or Comment not found");
        }
        
        // Use PostService to check for toxic content - FIXED to check reply content directly
        try {
            postService.checkToxicContent(content); // This will throw if toxic
            
            // If not toxic, save the reply
            Reply reply = new Reply(content, user.get(), comment.get());
            Reply savedReply = replyRepository.save(reply);

            Long commentOwnerId = comment.get().getUser().getId();
            if (!commentOwnerId.equals(userId)) {
                notificationService.createReplyNotification(
                        commentOwnerId,
                        userId,
                        user.get().getUsername(),
                        commentId,
                        content
                );
            }
            
            // Return simplified response
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedReply.getId());
            response.put("content", savedReply.getContent());
            response.put("createdAt", savedReply.getCreatedAt());
            
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", savedReply.getUser().getId());
            userMap.put("username", savedReply.getUser().getUsername());
            response.put("user", userMap);
            
            response.put("likeCount", 0);
            response.put("likes", new ArrayList<>());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Content rejected", "message", e.getMessage())
            );
        }
        
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error creating reply: " + e.getMessage());
    }
}

    // FIXED: Reply like functionality
    @PostMapping("/replies/{replyId}/likes")
    public ResponseEntity<?> toggleReplyLike(@PathVariable Long replyId, @RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            
            Optional<User> user = userRepository.findById(userId);
            Optional<Reply> reply = replyRepository.findById(replyId);
            
            if (user.isEmpty() || reply.isEmpty()) {
                return ResponseEntity.badRequest().body("User or Reply not found");
            }
            
            Optional<ReplyLike> existingLike = replyLikeRepository.findByUserIdAndReplyId(userId, replyId);
            
            if (existingLike.isPresent()) {
                replyLikeRepository.delete(existingLike.get());
                Map<String, Object> response = new HashMap<>();
                response.put("liked", false);
                response.put("message", "Reply like removed successfully");
                response.put("likeCount", replyLikeRepository.countByReplyId(replyId));
                return ResponseEntity.ok(response);
            } else {
                ReplyLike newLike = new ReplyLike(user.get(), reply.get());
                replyLikeRepository.save(newLike);

                // Create notification for reply owner (if not liking own reply)
                Long replyOwnerId = reply.get().getUser().getId();
                if (!replyOwnerId.equals(userId)) {
                    notificationService.createLikeReplyNotification(
                            replyOwnerId,
                            userId,
                            user.get().getUsername(),
                            replyId
                    );
                }
                
                Map<String, Object> response = new HashMap<>();
                response.put("liked", true);
                response.put("message", "Reply like added successfully");
                response.put("likeCount", replyLikeRepository.countByReplyId(replyId));
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error toggling reply like: " + e.getMessage());
        }
    }

    // FIXED: Like functionality
    @PostMapping("/likes")
    public ResponseEntity<?> toggleLike(@RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            Long postId = request.get("postId");
            
            // Check if like already exists using your repository method
            Optional<Like> existingLike = likeRepository.findByUserIdAndPostId(userId, postId);
            
            if (existingLike.isPresent()) {
                likeRepository.delete(existingLike.get());
                Map<String, Object> response = new HashMap<>();
                response.put("liked", false);
                response.put("message", "Like removed successfully");
                response.put("likeCount", likeRepository.countByPostId(postId));
                return ResponseEntity.ok(response);
            } else {
                Optional<User> user = userRepository.findById(userId);
                Optional<Post> post = postRepository.findById(postId);
                
                if (user.isEmpty() || post.isEmpty()) {
                    return ResponseEntity.badRequest().body("User or Post not found");
                }
                
                Like newLike = new Like(user.get(), post.get());
                likeRepository.save(newLike);

                // Create notification for post owner (if not liking own post)
                Long postOwnerId = post.get().getUser().getId();
                if (!postOwnerId.equals(userId)) {
                    notificationService.createLikePostNotification(
                            postOwnerId,
                            userId,
                            user.get().getUsername(),
                            postId
                    );
                }
                
                Map<String, Object> response = new HashMap<>();
                response.put("liked", true);
                response.put("message", "Like added successfully");
                response.put("likeCount", likeRepository.countByPostId(postId));
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error toggling like: " + e.getMessage());
        }
    }

    // Get user posts
   @GetMapping("/posts/user/{userId}")
public ResponseEntity<?> getUserPosts(@PathVariable Long userId) {
    try {
        List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<Map<String, Object>> response = posts.stream().map(post -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", post.getId());
            map.put("content", post.getContent());
            map.put("createdAt", post.getCreatedAt());

            // ✅ Post Author
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", post.getUser().getId());
            userMap.put("username", post.getUser().getUsername());
            map.put("user", userMap);

            // ✅ Category 
            if (post.getCategory() != null) {
                Map<String, Object> categoryMap = new HashMap<>();
                categoryMap.put("id", post.getCategory().getId());
                categoryMap.put("name", post.getCategory().getName());
                categoryMap.put("color", post.getCategory().getColor());
                map.put("category", categoryMap);
            }

            // ✅ Like count
            Long likeCount = likeRepository.countByPostId(post.getId());
            map.put("likeCount", likeCount);

            // ✅ (Optional) check if *this* user liked their own post
            // If you want to check likes for the profile owner (userId param)
            boolean likedByUser = likeRepository.findByUserIdAndPostId(userId, post.getId()).isPresent();
            map.put("likedByUser", likedByUser);

            // ✅ Comments
            List<Map<String, Object>> comments = commentRepository.findByPostId(post.getId()).stream().map(comment -> {
                Map<String, Object> cMap = new HashMap<>();
                cMap.put("id", comment.getId());
                cMap.put("content", comment.getContent());
                cMap.put("createdAt", comment.getCreatedAt());

                // Author
                Map<String, Object> cUserMap = new HashMap<>();
                cUserMap.put("id", comment.getUser().getId());
                cUserMap.put("username", comment.getUser().getUsername());
                cMap.put("user", cUserMap);

                // Likes & Replies
                cMap.put("likes", commentLikeRepository.findByCommentId(comment.getId()));
                cMap.put("replies", replyRepository.findByCommentId(comment.getId()));

                return cMap;
            }).collect(Collectors.toList());

            map.put("comments", comments);

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.badRequest().body("Error fetching user posts: " + e.getMessage());
    }
}




    // Get replies for a comment
    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<?> getCommentReplies(@PathVariable Long commentId) {
        try {
            List<Reply> replies = replyRepository.findByCommentIdOrderByCreatedAtAsc(commentId);
            
            List<Map<String, Object>> response = replies.stream().map(reply -> {
                Map<String, Object> replyMap = new HashMap<>();
                replyMap.put("id", reply.getId());
                replyMap.put("content", reply.getContent());
                replyMap.put("createdAt", reply.getCreatedAt());
                
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", reply.getUser().getId());
                userMap.put("username", reply.getUser().getUsername());
                replyMap.put("user", userMap);
                
                // Add like count for each reply
                replyMap.put("likeCount", replyLikeRepository.countByReplyId(reply.getId()));
                replyMap.put("likes", new ArrayList<>());
                
                return replyMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error fetching replies: " + e.getMessage());
        }
    }

    // Debug endpoint for posts
    @GetMapping("/posts/debug")
    public ResponseEntity<List<Post>> getAllPostsDebug() {
        try {
            List<Post> posts = postRepository.findAll();
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

     // DELETE POST ENDPOINT
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId, @RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");

            Optional<Post> postOptional = postRepository.findById(postId);

            if (postOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Post not found"));
            }

            Post post = postOptional.get();

            // Check if the user is the owner of the post
            if (!post.getUser().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only delete your own posts"));
            }

            // Delete associated replies and reply likes first
            List<Comment> comments = commentRepository.findByPostId(postId);
            for (Comment comment : comments) {
                // Delete reply likes for each reply of this comment
                List<Reply> replies = replyRepository.findByCommentId(comment.getId());
                for (Reply reply : replies) {
                    replyLikeRepository.deleteByReplyId(reply.getId());
                }
                // Delete replies for this comment
                replyRepository.deleteByCommentId(comment.getId());

                // Delete comment likes for this comment
                commentLikeRepository.deleteByCommentId(comment.getId());
            }

            // Delete associated comments
            commentRepository.deleteByPostId(postId);

            // Delete associated likes
            likeRepository.deleteByPostId(postId);

            // Delete the post
            postRepository.deleteById(postId);

            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error deleting post: " + e.getMessage()));
        }
    }


    // Debug endpoint to check comment likes
    @GetMapping("/comments/{commentId}/likes/debug")
    public ResponseEntity<?> getCommentLikesDebug(@PathVariable Long commentId) {
        try {
            Optional<Comment> comment = commentRepository.findById(commentId);
            if (comment.isEmpty()) {
                return ResponseEntity.badRequest().body("Comment not found");
            }
            
            List<CommentLike> commentLikes = commentLikeRepository.findByCommentId(commentId);
            int likeCount = commentLikeRepository.countByCommentId(commentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("commentId", commentId);
            response.put("likeCount", likeCount);
            response.put("likes", commentLikes.stream().map(like -> {
                Map<String, Object> likeMap = new HashMap<>();
                likeMap.put("id", like.getId());
                likeMap.put("userId", like.getUser().getId());
                likeMap.put("username", like.getUser().getUsername());
                likeMap.put("createdAt", like.getCreatedAt());
                return likeMap;
            }).collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error getting comment likes: " + e.getMessage());
        }
    }

    // Check if user has liked a comment
    @GetMapping("/comments/{commentId}/likes/user/{userId}")
    public ResponseEntity<?> checkUserCommentLike(@PathVariable Long commentId, @PathVariable Long userId) {
        try {
            boolean hasLiked = commentLikeRepository.existsByUserIdAndCommentId(userId, commentId);
            Map<String, Object> response = new HashMap<>();
            response.put("hasLiked", hasLiked);
            response.put("likeCount", commentLikeRepository.countByCommentId(commentId));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error checking comment like: " + e.getMessage());
        }
    }

    // Debug endpoint to check comment data
    @GetMapping("/comments/{commentId}/debug")
    public ResponseEntity<?> getCommentDebug(@PathVariable Long commentId) {
        try {
            Optional<Comment> comment = commentRepository.findById(commentId);
            if (comment.isEmpty()) {
                return ResponseEntity.badRequest().body("Comment not found");
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", comment.get().getId());
            response.put("content", comment.get().getContent());
            response.put("userId", comment.get().getUser().getId());
            response.put("postId", comment.get().getPost().getId());
            response.put("likeCount", commentLikeRepository.countByCommentId(commentId));
            response.put("replyCount", replyRepository.countByCommentId(commentId));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error getting comment debug info: " + e.getMessage());
        }
    }

    // Get comment like count
    @GetMapping("/comments/{commentId}/likes/count")
    public ResponseEntity<?> getCommentLikesCount(@PathVariable Long commentId) {
        try {
            int likeCount = commentLikeRepository.countByCommentId(commentId);
            return ResponseEntity.ok(Map.of("likeCount", likeCount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error getting like count: " + e.getMessage());
        }
    }

    // Delete a comment (only by the comment owner)
@DeleteMapping("/comments/{commentId}")
public ResponseEntity<?> deleteComment(@PathVariable Long commentId, @RequestParam Long userId) {
    // Your existing code remains the same
    Optional<Comment> commentOpt = commentRepository.findById(commentId);

    if (commentOpt.isEmpty()) {
        return ResponseEntity.status(404)
                .body(Map.of("success", false, "message", "Comment not found"));
    }

    Comment comment = commentOpt.get();

    // Only allow the comment author to delete
    if (!comment.getUser().getId().equals(userId)) {
        return ResponseEntity.status(403)
                .body(Map.of("success", false, "message", "You can only delete your own comments"));
    }

    // Delete associated likes
    commentLikeRepository.deleteByCommentId(commentId);

    // Delete associated replies and reply likes
    List<Reply> replies = replyRepository.findByCommentId(commentId);
    for (Reply reply : replies) {
        replyLikeRepository.deleteByReplyId(reply.getId());
    }
    replyRepository.deleteByCommentId(commentId);

    // Delete the comment itself
    commentRepository.delete(comment);

    return ResponseEntity.ok(Map.of("success", true, "message", "Comment deleted successfully"));
}

    @DeleteMapping("/replies/{replyId}")
public ResponseEntity<?> deleteReply(@PathVariable Long replyId, @RequestParam Long userId) {
    Optional<Reply> replyOpt = replyRepository.findById(replyId);

    if (replyOpt.isEmpty()) {
        return ResponseEntity.status(404)
                .body(Map.of("success", false, "message", "Reply not found"));
    }

    Reply reply = replyOpt.get();

    // Only allow the reply author to delete
    if (!reply.getUser().getId().equals(userId)) {
        return ResponseEntity.status(403)
                .body(Map.of("success", false, "message", "You can only delete your own replies"));
    }

    // Delete associated reply likes first
    replyLikeRepository.deleteByReplyId(replyId);

    // Delete the reply itself
    replyRepository.delete(reply);

    return ResponseEntity.ok(Map.of("success", true, "message", "Reply deleted successfully"));
}

    // Get all categories
// Get all categories - FIXED to call service method correctly
@GetMapping("/categories")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        try {
            List<CategoryDTO> categories = CategoryService.getAllCategories(); // ✅ instance call
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }


// Create a new category (admin functionality)
// Create a new category (admin functionality)
@PostMapping("/categories")
public ResponseEntity<?> createCategory(@RequestBody Category category) {
    try {
        if (CategoryService.categoryExists(category.getName())) {
            return ResponseEntity.badRequest().body("Category with this name already exists");
        }
        
        Category savedCategory = CategoryService.createCategory(category);
        return ResponseEntity.ok(savedCategory);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error creating category: " + e.getMessage());
    }
}

// Get posts by category
@GetMapping("/posts/category/{categoryId}")
    public ResponseEntity<?> getPostsByCategory(@PathVariable Long categoryId) {
        try {
            com.example.filterx.entity.Category category = CategoryService.getCategoryById(categoryId) // ✅ instance call
                    .orElseThrow(() -> new RuntimeException("Category not found"));

            List<Post> posts = postRepository.findByCategoryOrderByCreatedAtDesc(category);

            // Convert to response format
            List<Map<String, Object>> response = posts.stream().map(post -> {
                Map<String, Object> postMap = new HashMap<>();
                postMap.put("id", post.getId());
                postMap.put("content", post.getContent());
                postMap.put("createdAt", post.getCreatedAt());

                // User info
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", post.getUser().getId());
                userMap.put("username", post.getUser().getUsername());
                postMap.put("user", userMap);

                // Category info
                if (post.getCategory() != null) {
                    Map<String, Object> categoryMap = new HashMap<>();
                    categoryMap.put("id", post.getCategory().getId());
                    categoryMap.put("name", post.getCategory().getName());
                    categoryMap.put("color", post.getCategory().getColor());
                    postMap.put("category", categoryMap);
                }

                // Comments count
                List<Comment> postComments = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
                postMap.put("commentCount", postComments.size());

                // Likes count
                Long likeCount = likeRepository.countByPostId(post.getId());
                postMap.put("likeCount", likeCount != null ? likeCount : 0);

                return postMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching posts by category: " + e.getMessage());
        }
    }
}