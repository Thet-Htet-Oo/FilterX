import { useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { useToast } from "./ToastContext.jsx";
import Navbar from "./Navbar.jsx";
import {
  AttachmentGallery,
  FileList,
  CommentAttachmentView,
  LightboxModal,
  formatFileSize,
  getFileMeta,
  validateSelectedFile
} from "./AttachmentComponents.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./home.css";
import { DEFAULT_AVATAR, getAvatarUrl } from "./avatarUtils.js";

function Home({ user }) {
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [postCategoryId, setPostCategoryId] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentCategory, setCurrentCategory] = useState(null);

  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const { addToast } = useToast();
  const location = useLocation();

  // Load posts and categories on mount
  useEffect(() => {
    loadPosts();
    loadCategories();
  }, []);

  // Update current category when filter changes
  useEffect(() => {
    if (filterCategory !== "all") {
      const category = categories.find(c => c.id === parseInt(filterCategory));
      setCurrentCategory(category);
    } else {
      setCurrentCategory(null);
    }
  }, [filterCategory, categories]);

  // Handle notification navigation
  useEffect(() => {
    if (location.state && location.state.fromNotification) {
      const { entityId, type } = location.state;
      const checkPostsLoaded = setInterval(() => {
        if (posts.length > 0) {
          clearInterval(checkPostsLoaded);
          setTimeout(() => {
            handleNotificationNavigation(entityId, type);
          }, 300);
        }
      }, 100);
      setTimeout(() => clearInterval(checkPostsLoaded), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, posts]);

  const handleNotificationNavigation = async (entityId, type) => {
    switch (type) {
      case 'LIKE_POST':
      case 'COMMENT':
        highlightPost(entityId);
        break;
      case 'LIKE_COMMENT':
      case 'REPLY':
        const postId = await findPostIdForComment(entityId);
        if (postId) {
          highlightPost(postId);
          setTimeout(() => highlightComment(entityId), 1000);
        }
        break;
      default:
        break;
    }
  };

  const highlightPost = (postId) => {
    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postElement.classList.add('hp-highlight-notification');
      setTimeout(() => postElement.classList.remove('hp-highlight-notification'), 3000);
    }
  };

  const highlightComment = (commentId) => {
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      commentElement.classList.add('hp-highlight-notification');
      setTimeout(() => commentElement.classList.remove('hp-highlight-notification'), 3000);
    }
  };

  const findPostIdForComment = async (commentId) => {
    for (const post of posts) {
      if (post.comments && post.comments.some(c => c.id === commentId)) {
        return post.id;
      }
    }
    return null;
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/social/categories');
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPosts = async (categoryId = "all") => {
    try {
      const url = categoryId === "all"
        ? 'http://localhost:8080/api/social/posts'
        : `http://localhost:8080/api/social/posts/category/${categoryId}`;

      const response = await fetch(url);
      if (response.ok) {
        const postsData = await response.json();
        const postsWithFormattedData = postsData.map(post => ({
          ...post,
          comments: Array.isArray(post.comments) ? post.comments : [],
          attachments: Array.isArray(post.attachments) ? post.attachments : [],
          likeCount: post.likeCount || 0,
          commentCount: Array.isArray(post.comments) ? post.comments.length : 0
        }));
        setPosts(postsWithFormattedData);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      addToast("Error loading posts. Please try again.", "error");
    }
  };

  const handleCategoryFilterChange = (categoryId) => {
    setFilterCategory(categoryId);
    setShowCategoryDropdown(false);
    loadPosts(categoryId);
  };

  // ---------------------------------------------------------------------------
  // Attachment Handlers for Create Post
  // ---------------------------------------------------------------------------
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (selectedPhotos.length + files.length > 3) {
      addToast("Maximum 3 photos allowed per post", "warning");
      return;
    }

    const validNewPhotos = [];
    const newPreviews = [];

    for (const file of files) {
      const check = validateSelectedFile(file, true);
      if (!check.valid) {
        addToast(check.error, "error");
        continue;
      }
      validNewPhotos.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedPhotos(prev => [...prev, ...validNewPhotos]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const removeSelectedPhoto = (index) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (selectedFiles.length + files.length > 3) {
      addToast("Maximum 3 files allowed per post", "warning");
      return;
    }

    const validNewFiles = [];
    for (const file of files) {
      const check = validateSelectedFile(file, false);
      if (!check.valid) {
        addToast(check.error, "error");
        continue;
      }
      validNewFiles.push(file);
    }

    setSelectedFiles(prev => [...prev, ...validNewFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ---------------------------------------------------------------------------
  // Create Post
  // ---------------------------------------------------------------------------
  const handlePost = async () => {
    const text = postText.trim();
    if (!text && selectedPhotos.length === 0 && selectedFiles.length === 0) {
      addToast("Post cannot be empty. Please enter text or attach photos/files.", "warning");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const formData = new FormData();
      formData.append("userId", userData.id);
      if (text) formData.append("content", text);
      
      const catToUse = postCategoryId || (filterCategory !== "all" ? filterCategory : null);
      if (catToUse && catToUse !== "all" && catToUse !== "null" && catToUse !== "undefined") {
        formData.append("categoryId", parseInt(catToUse));
      }

      selectedPhotos.forEach(photo => formData.append("photos", photo));
      selectedFiles.forEach(file => formData.append("files", file));

      const response = await fetch('http://localhost:8080/api/social/posts', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setPosts(prevPosts => [data, ...prevPosts]);
        setPostText("");
        setPostCategoryId("");
        photoPreviews.forEach(url => URL.revokeObjectURL(url));
        setSelectedPhotos([]);
        setPhotoPreviews([]);
        setSelectedFiles([]);
        addToast("Post created successfully!", "success");
      } else {
        const errorMsg = data.message || data.error || "Failed to create post";
        setError(errorMsg);
        addToast(errorMsg, "error");
      }
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMsg = error.message || "Error creating post. Please try again.";
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete Post
  // ---------------------------------------------------------------------------
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`http://localhost:8080/api/social/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id })
      });

      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        addToast("Post deleted successfully", "success");
      } else {
        const data = await response.json();
        addToast(data.error || "Failed to delete post", "error");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      addToast("Error deleting post", "error");
    }
  };

  // ---------------------------------------------------------------------------
  // Edit Post (Full Attachment CRUD)
  // ---------------------------------------------------------------------------
  const handleEditPost = async (postId, updatedContent, removeAttachmentIds, newPhotos, newFiles, categoryId) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const formData = new FormData();
      formData.append("userId", userData.id);
      if (updatedContent !== undefined && updatedContent !== null) {
        formData.append("content", updatedContent);
      }
      if (categoryId !== undefined && categoryId !== null && categoryId !== "" && categoryId !== "all" && categoryId !== "null" && categoryId !== "undefined") {
        formData.append("categoryId", parseInt(categoryId));
      } else if (categoryId === "" || categoryId === 0 || categoryId === "0") {
        formData.append("categoryId", "0");
      }
      if (removeAttachmentIds && removeAttachmentIds.length > 0) {
        removeAttachmentIds.forEach(id => formData.append("removeAttachmentIds", id));
      }
      if (newPhotos && newPhotos.length > 0) {
        newPhotos.forEach(p => formData.append("photos", p));
      }
      if (newFiles && newFiles.length > 0) {
        newFiles.forEach(f => formData.append("files", f));
      }

      const response = await fetch(`http://localhost:8080/api/social/posts/${postId}`, {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setPosts(prev => prev.map(p => (p.id === postId ? data : p)));
        addToast("Post updated successfully!", "success");
        return { success: true };
      } else {
        const errorMsg = data.message || data.error || "Failed to update post";
        addToast(errorMsg, "error");
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error("Error updating post:", err);
      addToast("Error updating post. Please try again.", "error");
      return { success: false, error: err.message };
    }
  };

  // ---------------------------------------------------------------------------
  // Comments: Create, Edit & Auto-Delete
  // ---------------------------------------------------------------------------
  const handleCommentPost = async (postId, commentText, photoFile, fileFile) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const formData = new FormData();
      formData.append("userId", userData.id);
      formData.append("postId", postId);
      if (commentText) formData.append("content", commentText);
      if (photoFile) formData.append("photo", photoFile);
      if (fileFile) formData.append("file", fileFile);

      const response = await fetch('http://localhost:8080/api/social/comments', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const newComment = await response.json();
        addToast("Comment added successfully!", "success");
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), newComment],
              commentCount: (post.commentCount || 0) + 1
            };
          }
          return post;
        }));
        return true;
      } else {
        const data = await response.json();
        addToast(data.message || data.error || "Failed to add comment", "error");
        return false;
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      addToast("Error adding comment. Please try again.", "error");
      return false;
    }
  };

  const handleEditComment = async (commentId, postId, updatedText, deleteAttachment, newPhoto, newFile) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const formData = new FormData();
      formData.append("userId", userData.id);
      if (updatedText !== undefined && updatedText !== null) {
        formData.append("content", updatedText);
      }
      if (deleteAttachment) {
        formData.append("deleteAttachment", "true");
      }
      if (newPhoto) formData.append("photo", newPhoto);
      if (newFile) formData.append("file", newFile);

      const response = await fetch(`http://localhost:8080/api/social/comments/${commentId}`, {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        if (data.deleted) {
          // Comment was automatically deleted because attachment was removed
          addToast("Comment was deleted because its attachment was removed.", "info");
          setPosts(prevPosts => prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                comments: post.comments.filter(c => c.id !== commentId),
                commentCount: Math.max((post.commentCount || 1) - 1, 0)
              };
            }
            return post;
          }));
        } else {
          addToast("Comment updated successfully!", "success");
          setPosts(prevPosts => prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                comments: post.comments.map(c => (c.id === commentId ? data : c))
              };
            }
            return post;
          }));
        }
        return true;
      } else {
        addToast(data.message || data.error || "Failed to update comment", "error");
        return false;
      }
    } catch (err) {
      console.error("Error editing comment:", err);
      addToast("Error updating comment", "error");
      return false;
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`http://localhost:8080/api/social/comments/${commentId}?userId=${userData.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        addToast("Comment deleted successfully", "success");
        loadPosts(filterCategory);
      } else {
        const data = await response.json();
        addToast(data.message || "Failed to delete comment", "error");
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      addToast("Error deleting comment. Please try again.", "error");
    }
  };

  // Likes & Replies
  const handleLikePost = async (postId) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                likedByUser: !post.likedByUser,
                likeCount: post.likedByUser ? post.likeCount - 1 : post.likeCount + 1
              }
            : post
        )
      );

      const response = await fetch('http://localhost:8080/api/social/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id, postId })
      });

      if (!response.ok) loadPosts(filterCategory);
    } catch (error) {
      console.error('Error liking post:', error);
      loadPosts(filterCategory);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`http://localhost:8080/api/social/comments/${commentId}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id })
      });
      if (response.ok) loadPosts(filterCategory);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleLikeReply = async (replyId) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`http://localhost:8080/api/social/replies/${replyId}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id })
      });
      if (response.ok) loadPosts(filterCategory);
    } catch (error) {
      console.error('Error liking reply:', error);
    }
  };

  const handleReplyToComment = async (commentId, replyText) => {
    if (!replyText.trim()) return;
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`http://localhost:8080/api/social/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText, userId: userData.id })
      });

      if (response.ok) {
        addToast("Reply posted successfully!", "success");
        loadPosts(filterCategory);
      } else {
        const data = await response.json();
        addToast(data.error || data.message || "Failed to add reply", "error");
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      addToast(error.message || "Error adding reply. Please try again.", "error");
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`http://localhost:8080/api/social/replies/${replyId}?userId=${userData.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        addToast("Reply deleted successfully", "success");
        loadPosts(filterCategory);
      } else {
        addToast("Failed to delete reply", "error");
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      addToast("Error deleting reply. Please try again.", "error");
    }
  };

  return (
    <div className="hp-container">
      <div className="hp-home d-flex flex-column min-vh-100">
        <Navbar />

        {/* Main Content */}
        <main className="hp-main-content container my-4 flex-grow-1">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Category Filter */}
              <section className="hp-glass-card mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h5 className="mb-0">
                    <i className="bi bi-funnel me-2"></i>Filter by Category
                  </h5>
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle hp-category-filter-btn"
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    >
                      {filterCategory === "all"
                        ? "All Categories"
                        : categories.find(c => c.id === parseInt(filterCategory))?.name || "Select Category"}
                    </button>
                    {showCategoryDropdown && (
                      <div className="dropdown-menu show hp-category-filter-menu" style={{ display: 'block' }}>
                        <button className="dropdown-item" onClick={() => handleCategoryFilterChange("all")}>
                          All Categories
                        </button>
                        {categories.map(category => (
                          <button
                            key={category.id}
                            className="dropdown-item"
                            onClick={() => handleCategoryFilterChange(category.id)}
                            style={{ color: category.color || '#6c757d' }}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {currentCategory && (
                  <div className="mt-2 text-muted small">
                    <i className="bi bi-info-circle me-1"></i>Currently viewing posts in <strong>{currentCategory.name}</strong>.
                  </div>
                )}
              </section>

              {/* Create Post Card */}
              <section className="hp-glass-card hp-compose-card mb-4" id="postsContainer">
                <textarea
                  id="hp-postText"
                  placeholder="What's on your mind? Share text, code files, or photos..."
                  rows="3"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="w-100"
                ></textarea>

                {/* Selected Attachments Previews */}
                {(selectedPhotos.length > 0 || selectedFiles.length > 0) && (
                  <div className="attachment-previews-section">
                    {/* Photos Preview */}
                    {selectedPhotos.length > 0 && (
                      <div>
                        <small className="text-muted d-block mb-1">
                          Photos ({selectedPhotos.length}/3):
                        </small>
                        <div className="photo-thumbnails-strip">
                          {photoPreviews.map((url, idx) => (
                            <div key={idx} className="thumbnail-preview-wrap">
                              <img src={url} alt={`Preview ${idx + 1}`} />
                              <button
                                type="button"
                                className="thumbnail-remove-btn"
                                onClick={() => removeSelectedPhoto(idx)}
                                title="Remove photo"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Files Preview */}
                    {selectedFiles.length > 0 && (
                      <div>
                        <small className="text-muted d-block mb-1">
                          Files ({selectedFiles.length}/3):
                        </small>
                        <div className="file-chips-strip">
                          {selectedFiles.map((file, idx) => {
                            const meta = getFileMeta(file.name);
                            return (
                              <div key={idx} className="file-chip">
                                <i className={`bi ${meta.icon}`} style={{ color: meta.color }}></i>
                                <span className="file-chip-name">{file.name}</span>
                                <span className="text-muted small">({formatFileSize(file.size)})</span>
                                <button
                                  type="button"
                                  className="file-chip-remove"
                                  onClick={() => removeSelectedFile(idx)}
                                  title="Remove file"
                                >
                                  &times;
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Category Selector Dropdown inside Create Post Form */}
                <div className="d-flex align-items-center gap-2 mt-3 pt-2 border-top">
                  <span className="small text-muted fw-bold">Category:</span>
                  <select
                    className="form-select form-select-sm hp-category-select"
                    value={postCategoryId || (filterCategory !== "all" ? filterCategory : "")}
                    onChange={(e) => setPostCategoryId(e.target.value)}
                  >
                    <option value="">Select Category (Optional)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="alert alert-danger mt-2" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                {/* Post Action Toolbar */}
                <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                  <div className="d-flex gap-2">
                    {/* Hidden Photo Input */}
                    <input
                      type="file"
                      ref={photoInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      style={{ display: "none" }}
                      onChange={handlePhotoSelect}
                    />
                    <button
                      type="button"
                      className="btn hp-attach-btn"
                      onClick={() => photoInputRef.current && photoInputRef.current.click()}
                      disabled={selectedPhotos.length >= 3}
                      title="Add up to 3 photos (JPG, PNG, WEBP, GIF, max 2 MB)"
                    >
                      <i className="bi bi-image text-success me-1"></i>
                      Photos ({selectedPhotos.length}/3)
                    </button>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      style={{ display: "none" }}
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      className="btn hp-attach-btn"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      disabled={selectedFiles.length >= 3}
                      title="Attach up to 3 study/code files (max 2 MB each)"
                    >
                      <i className="bi bi-paperclip text-primary me-1"></i>
                      Files ({selectedFiles.length}/3)
                    </button>
                  </div>

                  <button
                    onClick={handlePost}
                    className="hp-btn hp-btn-glass btn"
                    disabled={loading || (!postText.trim() && selectedPhotos.length === 0 && selectedFiles.length === 0)}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Posting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-feather me-2"></i>Post
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* Posts Feed */}
              <section className="hp-posts-container">
                {posts.map((post) => (
                  <Post
                    key={post.id}
                    post={post}
                    user={user}
                    categories={categories}
                    onPhotoClick={(url, name) => setLightboxImage({ url, alt: name })}
                    handleCommentPost={handleCommentPost}
                    handleEditComment={handleEditComment}
                    handleLikePost={handleLikePost}
                    handleLikeComment={handleLikeComment}
                    handleLikeReply={handleLikeReply}
                    handleReplyToComment={handleReplyToComment}
                    handleDeleteComment={handleDeleteComment}
                    handleDeleteReply={handleDeleteReply}
                    handleDeletePost={handleDeletePost}
                    handleEditPost={handleEditPost}
                  />
                ))}

                {posts.length === 0 && (
                  <div className="hp-glass-card text-center py-5 d-flex flex-column justify-content-center">
                    <i className="bi bi-chat-square-text display-4 text-muted mb-3"></i>
                    <h5 className="mt-3">No posts yet</h5>
                    <p className="text-muted">
                      {currentCategory
                        ? `Be the first to post in ${currentCategory.name}!`
                        : "Be the first to share something!"}
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Lightbox Modal */}
      <LightboxModal image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}

// =============================================================================
// POST COMPONENT (Display & Edit Mode with Attachment CRUD)
// =============================================================================
function Post({
  post,
  user,
  categories,
  onPhotoClick,
  handleCommentPost,
  handleEditComment,
  handleLikePost,
  handleLikeComment,
  handleLikeReply,
  handleReplyToComment,
  handleDeleteComment,
  handleDeleteReply,
  handleDeletePost,
  handleEditPost
}) {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentPhoto, setCommentPhoto] = useState(null);
  const [commentPhotoPreview, setCommentPhotoPreview] = useState(null);
  const [commentFile, setCommentFile] = useState(null);
  const [commentReplies, setCommentReplies] = useState({});

  // Post Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [editCategoryId, setEditCategoryId] = useState(post.category?.id || "");
  const [removeAttachmentIds, setRemoveAttachmentIds] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const commentPhotoInputRef = useRef(null);
  const commentFileInputRef = useRef(null);
  const editPhotoInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const safeComments = Array.isArray(post.comments) ? post.comments : [];
  const safeAttachments = Array.isArray(post.attachments) ? post.attachments : [];
  const isPostAuthor = user?.id === post.user?.id;

  // Load replies for comments
  useEffect(() => {
    const loadAllReplies = async () => {
      if (safeComments.length > 0) {
        for (const comment of safeComments) {
          try {
            const response = await fetch(`http://localhost:8080/api/social/comments/${comment.id}/replies`);
            if (response.ok) {
              const replies = await response.json();
              setCommentReplies(prev => ({ ...prev, [comment.id]: replies }));
            }
          } catch (error) {
            console.error('Error loading replies for comment:', comment.id, error);
          }
        }
      }
    };
    loadAllReplies();
  }, [safeComments]);

  // Comment Attachment selection (Enforce: Max 1 Photo OR 1 File)
  const handleCommentPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const check = validateSelectedFile(file, true);
    if (!check.valid) {
      alert(check.error);
      return;
    }
    // Swap: clear file if photo selected
    setCommentFile(null);
    setCommentPhoto(file);
    if (commentPhotoPreview) URL.revokeObjectURL(commentPhotoPreview);
    setCommentPhotoPreview(URL.createObjectURL(file));
    if (commentPhotoInputRef.current) commentPhotoInputRef.current.value = "";
  };

  const handleCommentFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const check = validateSelectedFile(file, false);
    if (!check.valid) {
      alert(check.error);
      return;
    }
    // Swap: clear photo if file selected
    if (commentPhotoPreview) URL.revokeObjectURL(commentPhotoPreview);
    setCommentPhoto(null);
    setCommentPhotoPreview(null);
    setCommentFile(file);
    if (commentFileInputRef.current) commentFileInputRef.current.value = "";
  };

  const clearCommentAttachment = () => {
    if (commentPhotoPreview) URL.revokeObjectURL(commentPhotoPreview);
    setCommentPhoto(null);
    setCommentPhotoPreview(null);
    setCommentFile(null);
  };

  const submitComment = async () => {
    if (!commentText.trim() && !commentPhoto && !commentFile) return;
    const success = await handleCommentPost(post.id, commentText, commentPhoto, commentFile);
    if (success) {
      setCommentText("");
      clearCommentAttachment();
      setShowCommentBox(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Post Edit Handlers
  // ---------------------------------------------------------------------------
  const startEdit = () => {
    setEditContent(post.content || "");
    setEditCategoryId(post.category?.id ? post.category.id.toString() : "");
    setRemoveAttachmentIds([]);
    newPhotoPreviews.forEach(url => URL.revokeObjectURL(url));
    setNewPhotos([]);
    setNewPhotoPreviews([]);
    setNewFiles([]);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    newPhotoPreviews.forEach(url => URL.revokeObjectURL(url));
    setNewPhotos([]);
    setNewPhotoPreviews([]);
    setNewFiles([]);
    setRemoveAttachmentIds([]);
    setIsEditing(false);
  };

  const toggleRemoveExistingAttachment = (attId) => {
    setRemoveAttachmentIds(prev =>
      prev.includes(attId) ? prev.filter(id => id !== attId) : [...prev, attId]
    );
  };

  const handleEditPhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Calculate kept photos count
    const keptPhotosCount = safeAttachments
      .filter(a => a.attachmentType === 'PHOTO' && !removeAttachmentIds.includes(a.id))
      .length;

    if (keptPhotosCount + newPhotos.length + files.length > 3) {
      alert("Maximum 3 photos allowed per post");
      return;
    }

    const validNew = [];
    const previews = [];
    for (const f of files) {
      const check = validateSelectedFile(f, true);
      if (!check.valid) {
        alert(check.error);
        continue;
      }
      validNew.push(f);
      previews.push(URL.createObjectURL(f));
    }
    setNewPhotos(prev => [...prev, ...validNew]);
    setNewPhotoPreviews(prev => [...prev, ...previews]);
    if (editPhotoInputRef.current) editPhotoInputRef.current.value = "";
  };

  const removeNewPhoto = (index) => {
    URL.revokeObjectURL(newPhotoPreviews[index]);
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Calculate kept files count
    const keptFilesCount = safeAttachments
      .filter(a => a.attachmentType === 'FILE' && !removeAttachmentIds.includes(a.id))
      .length;

    if (keptFilesCount + newFiles.length + files.length > 3) {
      alert("Maximum 3 files allowed per post");
      return;
    }

    const validNew = [];
    for (const f of files) {
      const check = validateSelectedFile(f, false);
      if (!check.valid) {
        alert(check.error);
        continue;
      }
      validNew.push(f);
    }
    setNewFiles(prev => [...prev, ...validNew]);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const removeNewFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const saveEdit = async () => {
    const text = editContent.trim();
    const keptCount = safeAttachments.filter(a => !removeAttachmentIds.includes(a.id)).length;
    const totalRemaining = keptCount + newPhotos.length + newFiles.length;

    if (!text && totalRemaining === 0) {
      alert("Post cannot be empty. Must have either text or at least one attachment.");
      return;
    }

    setEditSubmitting(true);
    const result = await handleEditPost(
      post.id,
      text,
      removeAttachmentIds,
      newPhotos,
      newFiles,
      editCategoryId || null
    );
    setEditSubmitting(false);
    if (result && result.success) {
      cancelEdit();
    }
  };

  return (
    <article className="hp-glass-card hp-post mb-3 position-relative" id={`post-${post.id}`}>
      {/* Header */}
      <div className="d-flex align-items-center mb-3">
        <img
          src={getAvatarUrl(post.user)}
          alt="Profile"
          className="hp-profile-mini me-2"
          onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
        />
        <strong className="hp-username">{post.user?.username || "User"}</strong>

        {post.category && post.category.name && (
          <span
            className="category-pill ms-2"
            style={{
              backgroundColor: post.category.color || '#6c757d',
              color: '#fff'
            }}
          >
            #{post.category.name}
          </span>
        )}

        <small className="text-muted ms-auto me-2">
          {new Date(post.createdAt).toLocaleString()}
        </small>

        {/* Post Author Actions (Edit & Delete) */}
        {isPostAuthor && !isEditing && (
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={startEdit}
              title="Edit post"
            >
              <i className="bi bi-pencil"></i>
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeletePost(post.id)}
              title="Delete post"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        )}
      </div>

      {/* Post Body: Normal vs Edit Mode */}
      {isEditing ? (
        <div className="edit-post-card mb-3">
          <label className="form-label small fw-bold">Edit Content:</label>
          <textarea
            className="form-control mb-2"
            rows="3"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit text content..."
          ></textarea>

          {/* Category Selector in Edit Post */}
          <div className="mb-3 d-flex align-items-center gap-2">
            <label className="form-label small fw-bold mb-0">Category:</label>
            <select
              className="form-select form-select-sm hp-category-select"
              value={editCategoryId || ""}
              onChange={(e) => setEditCategoryId(e.target.value)}
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Existing Attachments Removal */}
          {safeAttachments.length > 0 && (
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">Manage Existing Attachments:</label>
              <div className="d-flex flex-wrap gap-2">
                {safeAttachments.map(att => {
                  const isRemoved = removeAttachmentIds.includes(att.getId ? att.getId() : att.id);
                  const attId = att.getId ? att.getId() : att.id;
                  const meta = getFileMeta(att.fileName);
                  return (
                    <div
                      key={attId}
                      className="border rounded p-1 px-2 d-flex align-items-center gap-2 small"
                      style={{
                        backgroundColor: isRemoved ? '#f8d7da' : '#e9ecef',
                        textDecoration: isRemoved ? 'line-through' : 'none'
                      }}
                    >
                      <i className={`bi ${att.attachmentType === 'PHOTO' ? 'bi-image' : meta.icon}`}></i>
                      <span className="text-truncate" style={{ maxWidth: '140px' }}>{att.fileName}</span>
                      <button
                        type="button"
                        className={`btn btn-sm py-0 px-1 ${isRemoved ? 'btn-outline-secondary' : 'btn-outline-danger'}`}
                        onClick={() => toggleRemoveExistingAttachment(attId)}
                        title={isRemoved ? "Undo remove" : "Remove attachment"}
                      >
                        {isRemoved ? "Undo" : "Remove"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Attachments Preview */}
          {(newPhotos.length > 0 || newFiles.length > 0) && (
            <div className="attachment-previews-section mb-3">
              {newPhotos.length > 0 && (
                <div className="photo-thumbnails-strip mb-2">
                  {newPhotoPreviews.map((url, i) => (
                    <div key={i} className="thumbnail-preview-wrap">
                      <img src={url} alt={`New Photo ${i + 1}`} />
                      <button type="button" className="thumbnail-remove-btn" onClick={() => removeNewPhoto(i)}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
              {newFiles.length > 0 && (
                <div className="file-chips-strip">
                  {newFiles.map((f, i) => (
                    <div key={i} className="file-chip">
                      <i className="bi bi-file-earmark-code text-primary"></i>
                      <span className="file-chip-name">{f.name}</span>
                      <button type="button" className="file-chip-remove" onClick={() => removeNewFile(i)}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add New Attachments Controls */}
          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
            <div className="d-flex gap-2">
              <input
                type="file"
                ref={editPhotoInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                style={{ display: "none" }}
                onChange={handleEditPhotoSelect}
              />
              <button
                type="button"
                className="btn btn-sm hp-attach-btn"
                onClick={() => editPhotoInputRef.current && editPhotoInputRef.current.click()}
              >
                <i className="bi bi-image text-success me-1"></i> Add Photos
              </button>

              <input
                type="file"
                ref={editFileInputRef}
                multiple
                style={{ display: "none" }}
                onChange={handleEditFileSelect}
              />
              <button
                type="button"
                className="btn btn-sm hp-attach-btn"
                onClick={() => editFileInputRef.current && editFileInputRef.current.click()}
              >
                <i className="bi bi-paperclip text-primary me-1"></i> Add Files
              </button>
            </div>

            <div className="d-flex gap-2">
              <button className="cancel-btn btn btn-sm" onClick={cancelEdit} disabled={editSubmitting}>
                Cancel
              </button>
              <button className="hp-btn hp-btn-glass btn btn-sm" onClick={saveEdit} disabled={editSubmitting}>
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {post.content && <p className="post-text-content">{post.content}</p>}

          {/* Render Attached Photos in Grid */}
          <AttachmentGallery attachments={safeAttachments} onPhotoClick={onPhotoClick} />

          {/* Render Attached Files as Downloadable Cards */}
          <FileList attachments={safeAttachments} />
        </>
      )}

      {/* Post Actions (Like, Comment count) */}
      <div className="d-flex gap-2 flex-wrap hp-action-buttons mb-3">
        <button
          className={`hp-btn btn btn-sm hp-btn-outline-custom ${
            post.likedByUser ? "hp-btn-outline-success" : "hp-btn-outline-success"
          }`}
          style={{
            backgroundColor: post.likedByUser ? "#2a7a2a" : "",
            color: post.likedByUser ? "white" : ""
          }}
          title="Like"
          onClick={() => handleLikePost(post.id)}
        >
          <i className="bi bi-hand-thumbs-up"></i> Like ({post.likeCount || 0})
        </button>
        <button
          className="hp-btn hp-btn-outline-secondary hp-btn-outline-custom btn btn-sm"
          title="Comment"
          onClick={() => setShowCommentBox(!showCommentBox)}
        >
          <i className="bi bi-chat-dots"></i> Comment ({post.commentCount || 0})
        </button>
      </div>

      {/* Comments Section */}
      <section className="hp-comments">
        {showCommentBox && (
          <section className="hp-comment-box mb-3 p-2 border rounded bg-light">
            <textarea
              className="form-control mb-2"
              placeholder="Write a comment..."
              rows="2"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitComment();
                }
              }}
            ></textarea>

            {/* Comment Attachment Preview (Max 1) */}
            {(commentPhotoPreview || commentFile) && (
              <div className="d-flex align-items-center gap-2 mb-2 p-1 bg-white border rounded">
                {commentPhotoPreview && (
                  <img
                    src={commentPhotoPreview}
                    alt="Comment Preview"
                    style={{ width: "45px", height: "45px", objectFit: "cover", borderRadius: "4px" }}
                  />
                )}
                {commentFile && (
                  <div className="d-flex align-items-center gap-1 small text-truncate">
                    <i className="bi bi-file-earmark-code text-primary"></i>
                    <span className="text-truncate" style={{ maxWidth: "200px" }}>{commentFile.name}</span>
                    <span className="text-muted">({formatFileSize(commentFile.size)})</span>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ms-auto py-0 px-2"
                  onClick={clearCommentAttachment}
                  title="Remove attachment"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Comment Actions & Attachment Buttons */}
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-1">
                <input
                  type="file"
                  ref={commentPhotoInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={handleCommentPhotoSelect}
                />
                <button
                  type="button"
                  className="btn btn-sm hp-attach-btn-sm"
                  onClick={() => commentPhotoInputRef.current && commentPhotoInputRef.current.click()}
                  title="Attach 1 photo"
                >
                  <i className="bi bi-image text-success me-1"></i>Photo
                </button>

                <input
                  type="file"
                  ref={commentFileInputRef}
                  style={{ display: "none" }}
                  onChange={handleCommentFileSelect}
                />
                <button
                  type="button"
                  className="btn btn-sm hp-attach-btn-sm"
                  onClick={() => commentFileInputRef.current && commentFileInputRef.current.click()}
                  title="Attach 1 file (code/doc)"
                >
                  <i className="bi bi-paperclip text-primary me-1"></i>File
                </button>
              </div>

              <div className="d-flex gap-2">
                <button className="cancel-btn btn btn-sm" onClick={() => setShowCommentBox(false)}>
                  Cancel
                </button>
                <button
                  className="hp-btn hp-btn-glass btn btn-sm"
                  onClick={submitComment}
                  disabled={!commentText.trim() && !commentPhoto && !commentFile}
                >
                  <i className="bi bi-send me-1"></i>Post Comment
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Comment List */}
        {safeComments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            postId={post.id}
            user={user}
            onPhotoClick={onPhotoClick}
            onLikeComment={handleLikeComment}
            onLikeReply={handleLikeReply}
            onReplyToComment={handleReplyToComment}
            handleDeleteComment={handleDeleteComment}
            handleDeleteReply={handleDeleteReply}
            handleEditComment={handleEditComment}
            replies={commentReplies[comment.id] || []}
          />
        ))}
      </section>
    </article>
  );
}

// =============================================================================
// COMMENT COMPONENT (Display & Edit Mode with Auto-Delete Rule)
// =============================================================================
function Comment({
  comment,
  postId,
  user,
  onPhotoClick,
  onLikeComment,
  onLikeReply,
  onReplyToComment,
  handleDeleteComment,
  handleDeleteReply,
  handleEditComment,
  replies = []
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  // Comment Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editCommentText, setEditCommentText] = useState(comment.content || "");
  const [swapPhoto, setSwapPhoto] = useState(null);
  const [swapPhotoPreview, setSwapPhotoPreview] = useState(null);
  const [swapFile, setSwapFile] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const swapPhotoInputRef = useRef(null);
  const swapFileInputRef = useRef(null);

  const safeReplies = Array.isArray(replies) ? replies : [];
  const likesCount = comment.likeCount || 0;
  const isCommentAuthor = user?.id === comment.user?.id;
  const hasExistingAttachment = !!comment.attachment;

  const submitReply = () => {
    if (replyText.trim()) {
      onReplyToComment(comment.id, replyText);
      setReplyText("");
      setShowReplyBox(false);
    }
  };

  const startEdit = () => {
    setEditCommentText(comment.content || "");
    setSwapPhoto(null);
    setSwapPhotoPreview(null);
    setSwapFile(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (swapPhotoPreview) URL.revokeObjectURL(swapPhotoPreview);
    setSwapPhoto(null);
    setSwapPhotoPreview(null);
    setSwapFile(null);
    setIsEditing(false);
  };

  const handleSwapPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const check = validateSelectedFile(file, true);
    if (!check.valid) {
      alert(check.error);
      return;
    }
    setSwapFile(null);
    setSwapPhoto(file);
    if (swapPhotoPreview) URL.revokeObjectURL(swapPhotoPreview);
    setSwapPhotoPreview(URL.createObjectURL(file));
  };

  const handleSwapFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const check = validateSelectedFile(file, false);
    if (!check.valid) {
      alert(check.error);
      return;
    }
    if (swapPhotoPreview) URL.revokeObjectURL(swapPhotoPreview);
    setSwapPhoto(null);
    setSwapPhotoPreview(null);
    setSwapFile(file);
  };

  // ---------------------------------------------------------------------------
  // AUTO-DELETE RULE:
  // If user removes the comment's attachment without replacing it,
  // the entire comment is automatically deleted!
  // ---------------------------------------------------------------------------
  const handleRemoveCommentAttachment = async () => {
    const confirmed = window.confirm(
      "⚠️ Removing the attachment will delete this entire comment.\n\nAre you sure you want to proceed?"
    );
    if (!confirmed) return;

    setEditSubmitting(true);
    await handleEditComment(comment.id, postId, null, true, null, null);
    setEditSubmitting(false);
    setIsEditing(false);
  };

  const saveCommentEdit = async () => {
    const text = editCommentText.trim();
    const hasAtt = hasExistingAttachment || swapPhoto || swapFile;
    if (!text && !hasAtt) {
      alert("Comment cannot be empty.");
      return;
    }

    setEditSubmitting(true);
    const success = await handleEditComment(
      comment.id,
      postId,
      text,
      false,
      swapPhoto,
      swapFile
    );
    setEditSubmitting(false);
    if (success) {
      cancelEdit();
    }
  };

  return (
    <article className="hp-comment mb-2 p-2 border-bottom" id={`comment-${comment.id}`}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <img
            src={getAvatarUrl(comment.user)}
            alt="Profile"
            className="hp-profile-mini me-2"
            style={{ width: "30px", height: "30px" }}
            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
          />
          <strong className="hp-username me-2">{comment.user?.username || "User"}</strong>
          <small className="text-muted">
            {new Date(comment.createdAt).toLocaleString()}
          </small>
        </div>

        {/* Comment Author Edit & Delete */}
        {isCommentAuthor && !isEditing && (
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm py-0 px-1 btn-outline-secondary"
              onClick={startEdit}
              title="Edit comment"
            >
              <i className="bi bi-pencil" style={{ fontSize: "0.8rem" }}></i>
            </button>
            <button
              className="btn btn-sm py-0 px-1 btn-outline-danger"
              onClick={() => handleDeleteComment(comment.id)}
              title="Delete comment"
            >
              <i className="bi bi-trash" style={{ fontSize: "0.8rem" }}></i>
            </button>
          </div>
        )}
      </div>

      {/* Comment Body: Edit Mode vs Normal View */}
      {isEditing ? (
        <div className="mt-2 p-2 bg-light border rounded">
          <textarea
            className="form-control mb-2"
            rows="2"
            value={editCommentText}
            onChange={(e) => setEditCommentText(e.target.value)}
          ></textarea>

          {/* Current Attachment & Auto-Delete Trigger */}
          {hasExistingAttachment && !swapPhoto && !swapFile && (
            <div className="d-flex align-items-center justify-content-between p-1 px-2 mb-2 bg-white border rounded">
              <span className="small text-truncate">
                <i className="bi bi-paperclip me-1"></i>
                {comment.attachment.fileName}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger py-0 px-2 small"
                onClick={handleRemoveCommentAttachment}
                title="Removing this attachment deletes the entire comment"
              >
                <i className="bi bi-trash me-1"></i>Remove Attachment (Deletes Comment)
              </button>
            </div>
          )}

          {/* Swapped Attachment Preview */}
          {(swapPhotoPreview || swapFile) && (
            <div className="d-flex align-items-center gap-2 p-1 px-2 mb-2 bg-white border rounded">
              {swapPhotoPreview && (
                <img src={swapPhotoPreview} alt="Swap Preview" style={{ width: "40px", height: "40px", objectFit: "cover" }} />
              )}
              {swapFile && <span className="small text-truncate">{swapFile.name}</span>}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary py-0 px-1 ms-auto"
                onClick={() => {
                  setSwapPhoto(null);
                  setSwapPhotoPreview(null);
                  setSwapFile(null);
                }}
              >
                &times;
              </button>
            </div>
          )}

          {/* Edit Actions */}
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-1">
              <input
                type="file"
                ref={swapPhotoInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={handleSwapPhoto}
              />
              <button
                type="button"
                className="btn btn-sm hp-attach-btn-sm"
                onClick={() => swapPhotoInputRef.current && swapPhotoInputRef.current.click()}
                title="Swap with photo"
              >
                <i className="bi bi-image text-success me-1"></i>Photo
              </button>

              <input
                type="file"
                ref={swapFileInputRef}
                style={{ display: "none" }}
                onChange={handleSwapFile}
              />
              <button
                type="button"
                className="btn btn-sm hp-attach-btn-sm"
                onClick={() => swapFileInputRef.current && swapFileInputRef.current.click()}
                title="Swap with file"
              >
                <i className="bi bi-paperclip text-primary me-1"></i>File
              </button>
            </div>

            <div className="d-flex gap-2">
              <button className="cancel-btn btn btn-sm" onClick={cancelEdit} disabled={editSubmitting}>
                Cancel
              </button>
              <button className="hp-btn hp-btn-glass btn btn-sm" onClick={saveCommentEdit} disabled={editSubmitting}>
                {editSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {comment.content && <div className="mt-1">{comment.content}</div>}
          <CommentAttachmentView attachment={comment.attachment} onPhotoClick={onPhotoClick} />
        </>
      )}

      {/* Comment Actions (Like, Reply, Count) */}
      <div className="d-flex gap-2 mt-2">
        <button
          className="cmrp-like btn-sm"
          title="Like comment"
          onClick={() => onLikeComment(comment.id)}
        >
          <i className="bi bi-hand-thumbs-up"></i> ({likesCount})
        </button>
        <button
          className="cmrp-reply btn-sm"
          title="Reply"
          onClick={() => setShowReplyBox(!showReplyBox)}
        >
          <i className="bi bi-reply"></i> Reply
        </button>

        {safeReplies.length > 0 && (
          <button
            className="hp-btn hp-btn-outline-info btn-sm"
            onClick={() => setShowReplies(!showReplies)}
          >
            <i className="bi bi-chat"></i> {safeReplies.length} {showReplies ? 'Hide' : 'Show'} replies
          </button>
        )}
      </div>

      {/* Reply Box */}
      {showReplyBox && (
        <div className="hp-reply-box mt-2">
          <textarea
            className="form-control mb-2"
            placeholder="Write a reply..."
            rows="1"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitReply();
              }
            }}
          ></textarea>
          <div className="d-flex gap-2">
            <button className="cancel-btn btn btn-sm" onClick={() => setShowReplyBox(false)}>
              Cancel
            </button>
            <button
              className="hp-btn hp-btn-glass btn-sm"
              onClick={submitReply}
              disabled={!replyText.trim()}
            >
              <i className="bi bi-send me-1"></i>Reply
            </button>
          </div>
        </div>
      )}

      {/* Replies List */}
      {safeReplies.length > 0 && showReplies && (
        <div className="hp-replies mt-2 ms-3 border-start ps-2">
          {safeReplies.map((reply) => (
            <div key={reply.id} className="hp-reply mb-1" id={`reply-${reply.id}`}>
              <div className="d-flex align-items-center">
                <img
                  src={getAvatarUrl(reply.user)}
                  alt="Profile"
                  className="hp-profile-mini me-2"
                  style={{ width: "25px", height: "25px" }}
                  onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                />
                <strong className="hp-username me-2">{reply.user?.username || "User"}:</strong>
                <span>{reply.content}</span>
              </div>
              <small className="text-muted d-block">
                {new Date(reply.createdAt).toLocaleString()}
              </small>

              <div className="d-flex gap-2 mt-1">
                <button
                  className="btn-sm cmrp-like"
                  title="Like reply"
                  onClick={() => onLikeReply(reply.id)}
                >
                  <i className="bi bi-hand-thumbs-up"></i> ({reply.likeCount || 0})
                </button>
                {user?.id === reply.user?.id && (
                  <button
                    className="btn-sm cmrp-delete"
                    title="Delete reply"
                    onClick={() => handleDeleteReply(reply.id)}
                  >
                    <i className="bi bi-trash"></i> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default Home;
