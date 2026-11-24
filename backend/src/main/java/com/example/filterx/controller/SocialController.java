package com.example.filterx.controller;

import com.example.filterx.dto.AttachmentDTO;
import com.example.filterx.dto.CategoryDTO;
import com.example.filterx.entity.*;
import com.example.filterx.repository.*;
import com.example.filterx.service.CategoryService;
import com.example.filterx.service.NotificationService;
import com.example.filterx.service.PostService;
import com.example.filterx.utils.AttachmentValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/social", "/api"})
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
    private PostAttachmentRepository postAttachmentRepository;

    @Autowired
    private CommentAttachmentRepository commentAttachmentRepository;

    @Autowired
    private PostService postService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    // =========================================================================
    // HELPER MAPPERS
    // =========================================================================
    private Map<String, Object> mapUserToResponse(User user) {
        if (user == null) return null;
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("username", user.getUsername());
        userMap.put("hasProfilePicture", user.hasProfilePicture());
        userMap.put("profilePictureUrl", user.getProfilePictureUrl());
        return userMap;
    }

    private Map<String, Object> mapCommentToResponse(Comment comment) {
        Map<String, Object> commentMap = new HashMap<>();
        commentMap.put("id", comment.getId());
        commentMap.put("content", comment.getContent());
        commentMap.put("createdAt", comment.getCreatedAt());

        commentMap.put("user", mapUserToResponse(comment.getUser()));

        int commentLikeCount = commentLikeRepository.countByCommentId(comment.getId());
        commentMap.put("likeCount", commentLikeCount);
        commentMap.put("likes", new ArrayList<>());
        commentMap.put("replies", new ArrayList<>());

        Optional<CommentAttachment> attOpt = commentAttachmentRepository.findByCommentId(comment.getId());
        if (attOpt.isPresent()) {
            CommentAttachment att = attOpt.get();
            Map<String, Object> attMap = new HashMap<>();
            attMap.put("id", att.getId());
            attMap.put("attachmentType", att.getAttachmentType().name());
            attMap.put("fileName", att.getFileName());
            attMap.put("contentType", att.getContentType());
            attMap.put("fileSize", att.getFileSize());
            attMap.put("downloadUrl", "http://localhost:8080/api/attachments/comments/" + att.getId());
            commentMap.put("attachment", attMap);
        } else {
            commentMap.put("attachment", null);
        }

        return commentMap;
    }

    private Map<String, Object> mapPostToResponse(Post post, Long currentUserId) {
        Map<String, Object> postMap = new HashMap<>();
        postMap.put("id", post.getId());
        postMap.put("content", post.getContent());
        postMap.put("createdAt", post.getCreatedAt());

        postMap.put("user", mapUserToResponse(post.getUser()));

        if (post.getCategory() != null) {
            Map<String, Object> categoryMap = new HashMap<>();
            categoryMap.put("id", post.getCategory().getId());
            categoryMap.put("name", post.getCategory().getName());
            categoryMap.put("color", post.getCategory().getColor());
            categoryMap.put("description", post.getCategory().getDescription());
            postMap.put("category", categoryMap);
            postMap.put("categoryId", post.getCategory().getId());
        } else {
            postMap.put("category", null);
            postMap.put("categoryId", null);
        }

        List<Comment> postComments = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
        postMap.put("commentCount", postComments.size());

        Long likeCount = likeRepository.countByPostId(post.getId());
        postMap.put("likeCount", likeCount != null ? likeCount : 0);

        if (currentUserId != null) {
            boolean likedByUser = likeRepository.findByUserIdAndPostId(currentUserId, post.getId()).isPresent();
            postMap.put("likedByUser", likedByUser);
        }

        List<Map<String, Object>> comments = postComments.stream()
                .map(this::mapCommentToResponse)
                .collect(Collectors.toList());
        postMap.put("comments", comments);

        List<Like> postLikes = likeRepository.findByPostId(post.getId());
        List<Map<String, Object>> likes = new ArrayList<>();
        if (postLikes != null) {
            likes = postLikes.stream().map(like -> {
                Map<String, Object> likeMap = new HashMap<>();
                likeMap.put("id", like.getId());
                likeMap.put("user", mapUserToResponse(like.getUser()));
                return likeMap;
            }).collect(Collectors.toList());
        }
        postMap.put("likes", likes);

        List<PostAttachment> postAttachments = postAttachmentRepository.findByPostId(post.getId());
        List<Map<String, Object>> attachmentsList = postAttachments.stream().map(att -> {
            Map<String, Object> attMap = new HashMap<>();
            attMap.put("id", att.getId());
            attMap.put("attachmentType", att.getAttachmentType().name());
            attMap.put("fileName", att.getFileName());
            attMap.put("contentType", att.getContentType());
            attMap.put("fileSize", att.getFileSize());
            attMap.put("downloadUrl", "http://localhost:8080/api/attachments/posts/" + att.getId());
            return attMap;
        }).collect(Collectors.toList());
        postMap.put("attachments", attachmentsList);

        return postMap;
    }

    // =========================================================================
    // POSTS: CREATE, READ, UPDATE, DELETE
    // =========================================================================

    // 1. Create Post (JSON body backward-compatible)
    @PostMapping(value = "/posts", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createPostJson(@RequestBody Map<String, Object> request) {
        try {
            String content = (String) request.get("content");
            Long userId = Long.parseLong(request.get("userId").toString());
            Long categoryId = request.get("categoryId") != null ?
                    Long.parseLong(request.get("categoryId").toString()) : null;

            Optional<User> user = userRepository.findById(userId);
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Content cannot be empty"));
            }

            Post post = new Post(content, user.get());
            if (categoryId != null && categoryId > 0) {
                Optional<Category> category = categoryRepository.findById(categoryId);
                category.ifPresent(post::setCategory);
            }

            Post savedPost = postService.savePost(post);
            return ResponseEntity.ok(mapPostToResponse(savedPost, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content rejected", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error creating post: " + e.getMessage()));
        }
    }

    // 2. Create Post (Multipart Form Data with photos and files)
    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createPostMultipart(
            @RequestParam(value = "content", required = false) String content,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            String text = (content != null) ? content.trim() : "";
            List<MultipartFile> validPhotos = (photos != null) ? photos.stream().filter(f -> !f.isEmpty()).collect(Collectors.toList()) : new ArrayList<>();
            List<MultipartFile> validFiles = (files != null) ? files.stream().filter(f -> !f.isEmpty()).collect(Collectors.toList()) : new ArrayList<>();

            // Rule: Either text or attachment must be present
            if (text.isEmpty() && validPhotos.isEmpty() && validFiles.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Post cannot be empty. Please enter text or attach photos/files."));
            }

            // Rule: Max 3 photos and max 3 files
            if (validPhotos.size() > 3) {
                return ResponseEntity.badRequest().body(Map.of("error", "Maximum 3 photos allowed per post."));
            }
            if (validFiles.size() > 3) {
                return ResponseEntity.badRequest().body(Map.of("error", "Maximum 3 files allowed per post."));
            }

            // Validate all photos
            for (MultipartFile photo : validPhotos) {
                AttachmentValidator.validatePhoto(photo);
            }

            // Validate all files
            for (MultipartFile file : validFiles) {
                AttachmentValidator.validateFile(file);
            }

            // Run AI toxic content filtering if text is provided
            if (!text.isEmpty()) {
                postService.checkToxicContent(text);
            }

            Post post = new Post(!text.isEmpty() ? text : null, userOpt.get());
            if (categoryId != null && categoryId > 0) {
                categoryRepository.findById(categoryId).ifPresent(post::setCategory);
            }

            Post savedPost = postRepository.save(post);

            // Save photos
            for (MultipartFile photo : validPhotos) {
                String contentType = AttachmentValidator.resolveContentType(photo.getContentType(), photo.getOriginalFilename());
                PostAttachment pa = new PostAttachment(
                        savedPost,
                        AttachmentType.PHOTO,
                        photo.getOriginalFilename(),
                        contentType,
                        photo.getSize(),
                        photo.getBytes()
                );
                postAttachmentRepository.save(pa);
            }

            // Save files
            for (MultipartFile file : validFiles) {
                String contentType = AttachmentValidator.resolveContentType(file.getContentType(), file.getOriginalFilename());
                PostAttachment pa = new PostAttachment(
                        savedPost,
                        AttachmentType.FILE,
                        file.getOriginalFilename(),
                        contentType,
                        file.getSize(),
                        file.getBytes()
                );
                postAttachmentRepository.save(pa);
            }

            return ResponseEntity.ok(mapPostToResponse(savedPost, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Validation error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error creating post: " + e.getMessage()));
        }
    }

    // 3. Edit Post (Multipart Form Data with attachment removal & addition)
    @PutMapping(value = "/posts/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updatePostMultipart(
            @PathVariable Long postId,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "removeAttachmentIds", required = false) List<Long> removeAttachmentIds,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        try {
            Optional<Post> postOpt = postRepository.findById(postId);
            if (postOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Post not found"));
            }

            Post post = postOpt.get();
            if (!post.getUser().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only edit your own posts"));
            }

            List<PostAttachment> existingAttachments = postAttachmentRepository.findByPostId(postId);
            Set<Long> removeIds = (removeAttachmentIds != null) ? new HashSet<>(removeAttachmentIds) : Collections.emptySet();

            List<PostAttachment> toDelete = new ArrayList<>();
            List<PostAttachment> keptAttachments = new ArrayList<>();

            for (PostAttachment att : existingAttachments) {
                if (removeIds.contains(att.getId())) {
                    toDelete.add(att);
                } else {
                    keptAttachments.add(att);
                }
            }

            long keptPhotosCount = keptAttachments.stream().filter(a -> a.getAttachmentType() == AttachmentType.PHOTO).count();
            long keptFilesCount = keptAttachments.stream().filter(a -> a.getAttachmentType() == AttachmentType.FILE).count();

            List<MultipartFile> newPhotos = (photos != null) ? photos.stream().filter(f -> !f.isEmpty()).collect(Collectors.toList()) : new ArrayList<>();
            List<MultipartFile> newFiles = (files != null) ? files.stream().filter(f -> !f.isEmpty()).collect(Collectors.toList()) : new ArrayList<>();

            // Rule: Max 3 photos & max 3 files combined
            if (keptPhotosCount + newPhotos.size() > 3) {
                return ResponseEntity.badRequest().body(Map.of("error", "Maximum 3 photos allowed per post. (Kept: " + keptPhotosCount + ", New: " + newPhotos.size() + ")"));
            }
            if (keptFilesCount + newFiles.size() > 3) {
                return ResponseEntity.badRequest().body(Map.of("error", "Maximum 3 files allowed per post. (Kept: " + keptFilesCount + ", New: " + newFiles.size() + ")"));
            }

            String text = (content != null) ? content.trim() : "";
            long totalAttachments = keptAttachments.size() + newPhotos.size() + newFiles.size();

            // Rule: Post cannot be empty
            if (text.isEmpty() && totalAttachments == 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Post cannot be empty. Must have either text or at least one attachment."));
            }

            // Validate new attachments
            for (MultipartFile photo : newPhotos) {
                AttachmentValidator.validatePhoto(photo);
            }
            for (MultipartFile file : newFiles) {
                AttachmentValidator.validateFile(file);
            }

            // AI toxic content filter on edited text
            if (!text.isEmpty()) {
                postService.checkToxicContent(text);
            }

            // Delete removed attachments
            if (!toDelete.isEmpty()) {
                postAttachmentRepository.deleteAll(toDelete);
            }

            // Save new photos
            for (MultipartFile photo : newPhotos) {
                String contentType = AttachmentValidator.resolveContentType(photo.getContentType(), photo.getOriginalFilename());
                PostAttachment pa = new PostAttachment(
                        post,
                        AttachmentType.PHOTO,
                        photo.getOriginalFilename(),
                        contentType,
                        photo.getSize(),
                        photo.getBytes()
                );
                postAttachmentRepository.save(pa);
            }

            // Save new files
            for (MultipartFile file : newFiles) {
                String contentType = AttachmentValidator.resolveContentType(file.getContentType(), file.getOriginalFilename());
                PostAttachment pa = new PostAttachment(
                        post,
                        AttachmentType.FILE,
                        file.getOriginalFilename(),
                        contentType,
                        file.getSize(),
                        file.getBytes()
                );
                postAttachmentRepository.save(pa);
            }

            // Update text & category
            post.setContent(!text.isEmpty() ? text : null);
            if (categoryId != null) {
                if (categoryId > 0) {
                    categoryRepository.findById(categoryId).ifPresent(post::setCategory);
                } else {
                    post.setCategory(null);
                }
            }

            Post updatedPost = postRepository.save(post);
            return ResponseEntity.ok(mapPostToResponse(updatedPost, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Validation error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error editing post: " + e.getMessage()));
        }
    }

    // 4. Edit Post (JSON format for text-only updates)
    @PutMapping(value = "/posts/{postId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updatePostJson(
            @PathVariable Long postId,
            @RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            String content = (String) request.get("content");
            Long categoryId = request.get("categoryId") != null ? Long.parseLong(request.get("categoryId").toString()) : null;

            Optional<Post> postOpt = postRepository.findById(postId);
            if (postOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Post not found"));
            }

            Post post = postOpt.get();
            if (!post.getUser().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only edit your own posts"));
            }

            String text = (content != null) ? content.trim() : "";
            List<PostAttachment> attachments = postAttachmentRepository.findByPostId(postId);

            if (text.isEmpty() && attachments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Post cannot be empty."));
            }

            if (!text.isEmpty()) {
                postService.checkToxicContent(text);
            }

            post.setContent(!text.isEmpty() ? text : null);
            if (categoryId != null) {
                if (categoryId > 0) {
                    categoryRepository.findById(categoryId).ifPresent(post::setCategory);
                } else {
                    post.setCategory(null);
                }
            }

            Post updatedPost = postRepository.save(post);
            return ResponseEntity.ok(mapPostToResponse(updatedPost, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Validation error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error editing post: " + e.getMessage()));
        }
    }

    // 5. Delete Post (with Cascade Deletion of Post Attachments and Comment Attachments)
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(
            @PathVariable Long postId,
            @RequestBody(required = false) Map<String, Long> request,
            @RequestParam(value = "userId", required = false) Long queryUserId) {
        try {
            Long userId = queryUserId;
            if (userId == null && request != null && request.containsKey("userId")) {
                userId = request.get("userId");
            }

            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing userId for post deletion"));
            }

            Optional<Post> postOptional = postRepository.findById(postId);
            if (postOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Post not found"));
            }

            Post post = postOptional.get();
            if (!post.getUser().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only delete your own posts"));
            }

            // 1. Delete post attachments
            postAttachmentRepository.deleteByPostId(postId);

            // 2. Delete comments, comment attachments, replies, and reply likes
            List<Comment> comments = commentRepository.findByPostId(postId);
            for (Comment comment : comments) {
                // Delete comment attachment
                commentAttachmentRepository.deleteByCommentId(comment.getId());

                // Delete reply likes & replies
                List<Reply> replies = replyRepository.findByCommentId(comment.getId());
                for (Reply reply : replies) {
                    replyLikeRepository.deleteByReplyId(reply.getId());
                }
                replyRepository.deleteByCommentId(comment.getId());

                // Delete comment likes
                commentLikeRepository.deleteByCommentId(comment.getId());
            }

            // Delete comments
            commentRepository.deleteByPostId(postId);

            // Delete post likes
            likeRepository.deleteByPostId(postId);

            // Delete post
            postRepository.deleteById(postId);

            return ResponseEntity.ok(Map.of("message", "Post and associated attachments deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error deleting post: " + e.getMessage()));
        }
    }

    // 6. Get All Posts (Feed)
    @GetMapping("/posts")
    public ResponseEntity<List<Map<String, Object>>> getAllPosts() {
        try {
            List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
            List<Map<String, Object>> response = posts.stream()
                    .map(post -> mapPostToResponse(post, null))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // 7. Get User Posts (Profile Timeline)
    @GetMapping("/posts/user/{userId}")
    public ResponseEntity<?> getUserPosts(@PathVariable Long userId) {
        try {
            List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
            List<Map<String, Object>> response = posts.stream()
                    .map(post -> mapPostToResponse(post, userId))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error fetching user posts: " + e.getMessage());
        }
    }

    // 8. Get Posts by Category
    @GetMapping("/posts/category/{categoryId}")
    public ResponseEntity<?> getPostsByCategory(@PathVariable Long categoryId) {
        try {
            Category category = categoryService.getCategoryById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found"));

            List<Post> posts = postRepository.findByCategoryOrderByCreatedAtDesc(category);
            List<Map<String, Object>> response = posts.stream()
                    .map(post -> mapPostToResponse(post, null))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching posts by category: " + e.getMessage());
        }
    }

    // =========================================================================
    // COMMENTS: CREATE, READ, UPDATE, DELETE & AUTO-DELETE RULE
    // =========================================================================

    // 1. Create Comment (JSON format backward-compatible)
    @PostMapping(value = "/comments", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createCommentJson(@RequestBody Map<String, Object> request) {
        try {
            String content = (String) request.get("content");
            Long userId = Long.parseLong(request.get("userId").toString());
            Long postId = Long.parseLong(request.get("postId").toString());

            Optional<User> user = userRepository.findById(userId);
            Optional<Post> post = postRepository.findById(postId);
            if (user.isEmpty() || post.isEmpty()) {
                return ResponseEntity.badRequest().body("User or Post not found");
            }

            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Comment cannot be empty");
            }

            postService.checkToxicContent(content);

            Comment comment = new Comment(content, user.get(), post.get());
            Comment savedComment = commentRepository.save(comment);

            // Notify post owner
            Long postOwnerId = post.get().getUser().getId();
            if (!postOwnerId.equals(userId)) {
                notificationService.createCommentNotification(postOwnerId, userId, user.get().getUsername(), postId, content);
            }

            return ResponseEntity.ok(mapCommentToResponse(savedComment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content rejected", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating comment: " + e.getMessage());
        }
    }

    // 2. Create Comment (Multipart Form Data with 1 Photo OR 1 File)
    @PostMapping(value = "/comments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createCommentMultipart(
            @RequestParam(value = "content", required = false) String content,
            @RequestParam("userId") Long userId,
            @RequestParam("postId") Long postId,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            Optional<Post> postOpt = postRepository.findById(postId);
            if (userOpt.isEmpty() || postOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User or Post not found"));
            }

            boolean hasPhoto = (photo != null && !photo.isEmpty());
            boolean hasFile = (file != null && !file.isEmpty());

            // Rule: At most 1 photo OR 1 file (never both)
            if (hasPhoto && hasFile) {
                return ResponseEntity.badRequest().body(Map.of("error", "Comments can only have at most 1 photo OR 1 file, not both."));
            }

            String text = (content != null) ? content.trim() : "";
            if (text.isEmpty() && !hasPhoto && !hasFile) {
                return ResponseEntity.badRequest().body(Map.of("error", "Comment cannot be empty."));
            }

            if (hasPhoto) {
                AttachmentValidator.validatePhoto(photo);
            }
            if (hasFile) {
                AttachmentValidator.validateFile(file);
            }

            if (!text.isEmpty()) {
                postService.checkToxicContent(text);
            }

            Comment comment = new Comment(!text.isEmpty() ? text : null, userOpt.get(), postOpt.get());
            Comment savedComment = commentRepository.save(comment);

            if (hasPhoto) {
                String contentType = AttachmentValidator.resolveContentType(photo.getContentType(), photo.getOriginalFilename());
                CommentAttachment ca = new CommentAttachment(
                        savedComment,
                        AttachmentType.PHOTO,
                        photo.getOriginalFilename(),
                        contentType,
                        photo.getSize(),
                        photo.getBytes()
                );
                commentAttachmentRepository.save(ca);
            } else if (hasFile) {
                String contentType = AttachmentValidator.resolveContentType(file.getContentType(), file.getOriginalFilename());
                CommentAttachment ca = new CommentAttachment(
                        savedComment,
                        AttachmentType.FILE,
                        file.getOriginalFilename(),
                        contentType,
                        file.getSize(),
                        file.getBytes()
                );
                commentAttachmentRepository.save(ca);
            }

            // Notify post owner
            Long postOwnerId = postOpt.get().getUser().getId();
            if (!postOwnerId.equals(userId)) {
                String snippet = !text.isEmpty() ? text : (hasPhoto ? "[Photo attached]" : "[File attached]");
                notificationService.createCommentNotification(postOwnerId, userId, userOpt.get().getUsername(), postId, snippet);
            }

            return ResponseEntity.ok(mapCommentToResponse(savedComment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Validation error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error creating comment: " + e.getMessage()));
        }
    }

    // 3. Edit Comment & Attachment Auto-Delete Rule
    @PutMapping(value = "/comments/{commentId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateCommentMultipart(
            @PathVariable Long commentId,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "deleteAttachment", required = false, defaultValue = "false") boolean deleteAttachment,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            Optional<Comment> commentOpt = commentRepository.findById(commentId);
            if (commentOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Comment not found"));
            }

            Comment comment = commentOpt.get();
            if (!comment.getUser().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only edit your own comments"));
            }

            Optional<CommentAttachment> existingAttOpt = commentAttachmentRepository.findByCommentId(commentId);

            boolean hasNewPhoto = (photo != null && !photo.isEmpty());
            boolean hasNewFile = (file != null && !file.isEmpty());

            if (hasNewPhoto && hasNewFile) {
                return ResponseEntity.badRequest().body(Map.of("error", "Comments can only have at most 1 photo OR 1 file, not both."));
            }

            // =================================================================
            // AUTO-DELETE RULE:
            // If comment had an attachment and the user removes it without uploading
            // a replacement, AUTOMATICALLY DELETE THE ENTIRE COMMENT!
            // =================================================================
            if (existingAttOpt.isPresent() && deleteAttachment && !hasNewPhoto && !hasNewFile) {
                // Delete attachment
                commentAttachmentRepository.deleteByCommentId(commentId);

                // Delete child replies & likes
                List<Reply> replies = replyRepository.findByCommentId(commentId);
                for (Reply reply : replies) {
                    replyLikeRepository.deleteByReplyId(reply.getId());
                }
                replyRepository.deleteByCommentId(commentId);
                commentLikeRepository.deleteByCommentId(commentId);

                // Delete comment itself
                commentRepository.delete(comment);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "deleted", true,
                        "commentId", commentId,
                        "message", "Comment was automatically deleted because its attachment was removed."
                ));
            }

            // Handle replacing the attachment
            if (hasNewPhoto || hasNewFile) {
                if (existingAttOpt.isPresent()) {
                    commentAttachmentRepository.delete(existingAttOpt.get());
                }

                if (hasNewPhoto) {
                    AttachmentValidator.validatePhoto(photo);
                    String contentType = AttachmentValidator.resolveContentType(photo.getContentType(), photo.getOriginalFilename());
                    CommentAttachment ca = new CommentAttachment(
                            comment,
                            AttachmentType.PHOTO,
                            photo.getOriginalFilename(),
                            contentType,
                            photo.getSize(),
                            photo.getBytes()
                    );
                    commentAttachmentRepository.save(ca);
                } else {
                    AttachmentValidator.validateFile(file);
                    String contentType = AttachmentValidator.resolveContentType(file.getContentType(), file.getOriginalFilename());
                    CommentAttachment ca = new CommentAttachment(
                            comment,
                            AttachmentType.FILE,
                            file.getOriginalFilename(),
                            contentType,
                            file.getSize(),
                            file.getBytes()
                    );
                    commentAttachmentRepository.save(ca);
                }
            }

            String text = (content != null) ? content.trim() : "";
            boolean hasAttachment = (existingAttOpt.isPresent() && !deleteAttachment) || hasNewPhoto || hasNewFile;

            if (text.isEmpty() && !hasAttachment) {
                return ResponseEntity.badRequest().body(Map.of("error", "Comment cannot be empty."));
            }

            if (!text.isEmpty()) {
                postService.checkToxicContent(text);
            }

            comment.setContent(!text.isEmpty() ? text : null);
            Comment updatedComment = commentRepository.save(comment);

            return ResponseEntity.ok(mapCommentToResponse(updatedComment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Validation error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error editing comment: " + e.getMessage()));
        }
    }

    // 4. Delete Comment
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, @RequestParam Long userId) {
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Comment not found"));
        }

        Comment comment = commentOpt.get();
        if (!comment.getUser().getId().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "You can only delete your own comments"));
        }

        // Delete associated comment attachment
        commentAttachmentRepository.deleteByCommentId(commentId);

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

    // =========================================================================
    // LIKES, REPLIES, CATEGORIES & DEBUG ENDPOINTS
    // =========================================================================

    @PostMapping("/comments/{commentId}/likes")
    public ResponseEntity<?> toggleCommentLike(@PathVariable Long commentId, @RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            Optional<User> user = userRepository.findById(userId);
            Optional<Comment> comment = commentRepository.findById(commentId);

            if (user.isEmpty() || comment.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User or Comment not found"));
            }

            Optional<CommentLike> existingLike = commentLikeRepository.findByUserIdAndCommentId(userId, commentId);

            if (existingLike.isPresent()) {
                commentLikeRepository.delete(existingLike.get());
                Map<String, Object> response = new HashMap<>();
                response.put("liked", false);
                response.put("message", "Comment like removed successfully");
                response.put("likeCount", commentLikeRepository.countByCommentId(commentId));
                return ResponseEntity.ok(response);
            } else {
                CommentLike newLike = new CommentLike(user.get(), comment.get());
                commentLikeRepository.save(newLike);

                Long commentOwnerId = comment.get().getUser().getId();
                if (!commentOwnerId.equals(userId)) {
                    notificationService.createLikeCommentNotification(commentOwnerId, userId, user.get().getUsername(), commentId);
                }

                Map<String, Object> response = new HashMap<>();
                response.put("liked", true);
                response.put("message", "Comment like added successfully");
                response.put("likeCount", commentLikeRepository.countByCommentId(commentId));
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error toggling comment like: " + e.getMessage()));
        }
    }

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

            postService.checkToxicContent(content);

            Reply reply = new Reply(content, user.get(), comment.get());
            Reply savedReply = replyRepository.save(reply);

            Long commentOwnerId = comment.get().getUser().getId();
            if (!commentOwnerId.equals(userId)) {
                notificationService.createReplyNotification(commentOwnerId, userId, user.get().getUsername(), commentId, content);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", savedReply.getId());
            response.put("content", savedReply.getContent());
            response.put("createdAt", savedReply.getCreatedAt());
            response.put("user", mapUserToResponse(savedReply.getUser()));
            response.put("likeCount", 0);
            response.put("likes", new ArrayList<>());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content rejected", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating reply: " + e.getMessage());
        }
    }

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

                Long replyOwnerId = reply.get().getUser().getId();
                if (!replyOwnerId.equals(userId)) {
                    notificationService.createLikeReplyNotification(replyOwnerId, userId, user.get().getUsername(), replyId);
                }

                Map<String, Object> response = new HashMap<>();
                response.put("liked", true);
                response.put("message", "Reply like added successfully");
                response.put("likeCount", replyLikeRepository.countByReplyId(replyId));
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error toggling reply like: " + e.getMessage());
        }
    }

    @PostMapping("/likes")
    public ResponseEntity<?> toggleLike(@RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            Long postId = request.get("postId");

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

                Long postOwnerId = post.get().getUser().getId();
                if (!postOwnerId.equals(userId)) {
                    notificationService.createLikePostNotification(postOwnerId, userId, user.get().getUsername(), postId);
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

    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<?> getCommentReplies(@PathVariable Long commentId) {
        try {
            List<Reply> replies = replyRepository.findByCommentIdOrderByCreatedAtAsc(commentId);
            List<Map<String, Object>> response = replies.stream().map(reply -> {
                Map<String, Object> replyMap = new HashMap<>();
                replyMap.put("id", reply.getId());
                replyMap.put("content", reply.getContent());
                replyMap.put("createdAt", reply.getCreatedAt());
                replyMap.put("user", mapUserToResponse(reply.getUser()));
                replyMap.put("likeCount", replyLikeRepository.countByReplyId(reply.getId()));
                replyMap.put("likes", new ArrayList<>());

                return replyMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching replies: " + e.getMessage());
        }
    }

    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<?> deleteReply(@PathVariable Long replyId, @RequestParam Long userId) {
        Optional<Reply> replyOpt = replyRepository.findById(replyId);
        if (replyOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Reply not found"));
        }

        Reply reply = replyOpt.get();
        if (!reply.getUser().getId().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "You can only delete your own replies"));
        }

        replyLikeRepository.deleteByReplyId(replyId);
        replyRepository.delete(reply);

        return ResponseEntity.ok(Map.of("success", true, "message", "Reply deleted successfully"));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        try {
            List<CategoryDTO> categories = categoryService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/categories")
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        try {
            if (categoryService.categoryExists(category.getName())) {
                return ResponseEntity.badRequest().body("Category with this name already exists");
            }
            Category savedCategory = categoryService.createCategory(category);
            return ResponseEntity.ok(savedCategory);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating category: " + e.getMessage());
        }
    }

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

    @GetMapping("/comments/{commentId}/likes/count")
    public ResponseEntity<?> getCommentLikesCount(@PathVariable Long commentId) {
        try {
            int likeCount = commentLikeRepository.countByCommentId(commentId);
            return ResponseEntity.ok(Map.of("likeCount", likeCount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error getting like count: " + e.getMessage());
        }
    }

    @GetMapping("/posts/debug")
    public ResponseEntity<List<Post>> getAllPostsDebug() {
        try {
            List<Post> posts = postRepository.findAll();
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
