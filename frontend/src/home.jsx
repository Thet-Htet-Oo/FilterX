import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./home.css";

function Home({ user }) {
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentCategory, setCurrentCategory] = useState(null);
  
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();

  // Load Bootstrap JS for navbar toggler
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Load posts and categories from backend on component mount
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
      const { entityId, type, notificationId } = location.state;

      // Wait for posts to load
      const checkPostsLoaded = setInterval(() => {
        if (posts.length > 0) {
          clearInterval(checkPostsLoaded);
          setTimeout(() => {
            handleNotificationNavigation(entityId, type);
          }, 300);
        }
      }, 100);

      // Clear interval after 5 seconds if posts never load
      setTimeout(() => clearInterval(checkPostsLoaded), 5000);

      // Clear the state to prevent scrolling on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, posts]);

  // Debug: Log posts data to see structure
  useEffect(() => {
    console.log('Posts data:', posts);
    if (posts.length > 0 && posts[0].comments && posts[0].comments.length > 0) {
      console.log('First comment structure:', posts[0].comments[0]);
    }
  }, [posts]);

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
          // Load comments if not already loaded, then highlight the comment
          setTimeout(() => highlightComment(entityId), 1000);
        }
        break;

      case 'LIKE_REPLY':
        const { postId: replyPostId, commentId } = await findPostAndCommentForReply(entityId);
        if (replyPostId && commentId) {
          highlightPost(replyPostId);
          // Load comments and replies if not already loaded, then highlight
          setTimeout(() => {
            highlightComment(commentId);
            setTimeout(() => highlightReply(entityId), 500);
          }, 1000);
        }
        break;

      default:
        console.warn('Unknown notification type:', type);
    }
  };

  const findPostIdForComment = async (commentId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/social/comments/${commentId}/post`);
      if (response.ok) {
        const data = await response.json();
        return data.postId;
      }
    } catch (error) {
      console.error('Error finding post for comment:', error);
    }

    // Fallback: search through loaded posts
    for (const post of posts) {
      if (post.comments && post.comments.some(comment => comment.id === commentId)) {
        return post.id;
      }
    }
    return null;
  };

  const findPostAndCommentForReply = async (replyId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/social/replies/${replyId}/comment-and-post`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error finding post and comment for reply:', error);
    }

    // Fallback: search through loaded posts and comments
    for (const post of posts) {
      if (post.comments) {
        for (const comment of post.comments) {
          // Check if comment has replies array
          if (comment.replies && comment.replies.some(reply => reply.id === replyId)) {
            return { postId: post.id, commentId: comment.id };
          }

          // If replies are loaded separately, check the replies prop
          if (replies[comment.id] && replies[comment.id].some(reply => reply.id === replyId)) {
            return { postId: post.id, commentId: comment.id };
          }
        }
      }
    }
    return { postId: null, commentId: null };
  };

  const highlightPost = (postId) => {
    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postElement.classList.add('hp-highlight-post');
      setTimeout(() => postElement.classList.remove('hp-highlight-post'), 3000);
    }
  };

  const highlightComment = (commentId) => {
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      commentElement.classList.add('hp-highlight-comment');
      setTimeout(() => commentElement.classList.remove('hp-highlight-comment'), 3000);
    }
  };

  const highlightReply = (replyId) => {
    const replyElement = document.getElementById(`reply-${replyId}`);
    if (replyElement) {
      replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      replyElement.classList.add('hp-highlight-reply');
      setTimeout(() => replyElement.classList.remove('hp-highlight-reply'), 3000);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/social/categories');
      if (response.ok) {
        const categoriesData = await response.json();
        console.log('Categories data:', categoriesData);
        setCategories(categoriesData);
      } else {
        console.error('Failed to load categories:', response.status);
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
      
      console.log('Loading posts from:', url);
      const response = await fetch(url);
      if (response.ok) {
        const postsData = await response.json();
        console.log('Posts loaded:', postsData);
        
        // Ensure each post has a proper comments array
        const postsWithFormattedData = postsData.map(post => ({
          ...post,
          comments: Array.isArray(post.comments) ? post.comments : [],
          likeCount: post.likeCount || 0,
          commentCount: Array.isArray(post.comments) ? post.comments.length : 0
        }));
        
        setPosts(postsWithFormattedData);
      } else {
        console.error('Failed to load posts:', response.status);
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

  const handleLogout = () => {
    authLogout();
    addToast("You have been logged out successfully", "info");
    navigate("/");
  };

  const handlePost = async () => {
    const text = postText.trim();
    if (!text) return;

    setLoading(true);
    setError("");

    try {
      const userData = JSON.parse(localStorage.getItem("user"));

      const postData = {
        content: text,
        userId: userData.id
      };
      
      // Automatically assign the current category if filtered (not "all")
      if (filterCategory !== "all") {
        postData.categoryId = parseInt(filterCategory);
      }

      console.log('Sending post data:', postData);

      const response = await fetch('http://localhost:8080/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(responseText || `Server error: ${response.status}`);
        }
        data = { message: responseText };
      }

      if (response.ok) {
        setPosts(prevPosts => [data, ...prevPosts]);
        setPostText("");
        addToast("Post created successfully!", "success");
      } else {
        const errorMsg = data.error || data.message || "Failed to create post";
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

  const handleCommentPost = async (postId, commentText) => {
    if (!commentText.trim()) return;

    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      
      // Create optimistic comment (appears immediately)
      const optimisticComment = {
        id: Date.now(), // Temporary ID
        content: commentText,
        userId: userData.id,
        user: { 
          id: userData.id,
          username: userData.username 
        },
        postId: postId,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        replies: []
      };

      // Update UI immediately with optimistic comment
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), optimisticComment],
            commentCount: (post.commentCount || 0) + 1
          };
        }
        return post;
      }));

      const response = await fetch('http://localhost:8080/api/social/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentText,
          userId: userData.id,
          postId: postId
        })
      });

      if (response.ok) {
        const newComment = await response.json();
        addToast("Comment added successfully!", "success");
        
        // Replace optimistic comment with real one from server
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => 
                comment.id === optimisticComment.id ? newComment : comment
              )
            };
          }
          return post;
        }));
      } else {
        // If failed, roll back the optimistic update
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.filter(comment => comment.id !== optimisticComment.id),
              commentCount: (post.commentCount || 1) - 1
            };
          }
          return post;
        }));
        addToast("Failed to add comment", "error");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      addToast("Error adding comment. Please try again.", "error");
    }
  };

  const handleLikePost = async (postId) => {
  try {
    const userData = JSON.parse(localStorage.getItem("user"));

    // 👉 STEP 1: instantly update UI (this is what keeps button green)
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              likedByUser: !post.likedByUser,
              likeCount: post.likedByUser
                ? post.likeCount - 1
                : post.likeCount + 1
            }
          : post
      )
    );

    // 👉 STEP 2: call backend
    const response = await fetch('http://localhost:8080/api/social/likes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userData.id,
        postId: postId
      })
    });

    // OPTIONAL: only reload if something critical changed
    if (!response.ok) {
      // rollback if failed
      loadPosts(filterCategory);
    }

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.id
        })
      });

      if (response.ok) {
        loadPosts(filterCategory);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleLikeReply = async (replyId) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`http://localhost:8080/api/social/replies/${replyId}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.id
        })
      });

      if (response.ok) {
        loadPosts(filterCategory);
      } else {
        console.error('Failed to like reply');
      }
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: replyText,
                userId: userData.id
            })
        });

        const responseText = await response.text();
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            if (!response.ok) {
                throw new Error(responseText || `Server error: ${response.status}`);
            }
            data = { message: responseText };
        }

        if (response.ok) {
            addToast("Reply posted successfully!", "success");
            loadPosts(filterCategory);
        } else {
            const errorMsg = data.error || data.message || "Failed to add reply";
            addToast(errorMsg, "error");
        }
    } catch (error) {
        console.error('Error adding reply:', error);
        addToast(error.message || "Error adding reply. Please try again.", "error");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      
      // ADD userId query parameter to the URL
      const response = await fetch(`http://localhost:8080/api/social/comments/${commentId}?userId=${userData.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        addToast("Comment deleted successfully", "success");
        loadPosts(filterCategory); // reload posts
      } else {
        const data = await response.json();
        addToast(data.message || "Failed to delete comment", "error");
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      addToast("Error deleting comment. Please try again.", "error");
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`http://localhost:8080/api/social/replies/${replyId}?userId=${userData.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        addToast("Reply deleted successfully", "success");
        loadPosts(filterCategory); // reload posts to refresh replies
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
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg hp-navbar-custom" style={{ position: "sticky", top: 0, zIndex: 1030 }}>
          <div className="container">
            <Link className="hp-navbar-brand navbar-brand" to="/">
              <i className="bi bi-mortarboard-fill"></i> Filter X
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
              style={{ borderColor: "#d4af37" }}>
              <i className="bi bi-list" style={{ color: "#d4af37", fontSize: "1.5rem" }}></i>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="hp-navbar-nav navbar-nav ms-auto align-items-lg-center">
                <li className="hp-nav-item nav-item">
                  <a className="hp-nav-link nav-link" href="#postsContainer">
                    <span className="text-warning">Post</span>
                  </a>
                </li>
                <li className="hp-nav-item nav-item">
                  <Link className="hp-nav-link nav-link" to="/about">
                    About
                  </Link>
                </li>
                <li className="hp-nav-item nav-item">
                  <Link className="hp-nav-link nav-link" to="/profile">
                    Profile
                  </Link>
                </li>
                <li className="hp-nav-item nav-item">
                  <Link className="hp-nav-link nav-link" to="/notifications">
                    Notifications
                  </Link>
                </li>
                <li className="hp-nav-item nav-item">
                  <a className="hp-nav-link nav-link" href="#" onClick={handleLogout}>
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <main className="hp-main container-fluid flex-grow-1 py-3 d-flex flex-column">
          <div className="hp-content-wrapper">
            <header className="hp-page-header">Filter X</header>
            <div className="hp-page-tagline">Empowering Learning & Knowledge Sharing</div>

            {/* Profile Section */}
            <section className="hp-glass-card d-flex align-items-center mb-4">
              <img
                src="https://i.pinimg.com/736x/54/c7/c3/54c7c36c20ced3eb982c4e3e21f465fe.jpg"
                alt="Profile"
                className="hp-profile-img me-4"
              />
              <div className="flex-grow-1">
                <div className="hp-username">{user?.username || "User"}</div>
                <div className="hp-meta">{user?.email || ""}</div>
                <div className="hp-meta">{user?.fullName || ""}</div>
              </div>
              <div className="ms-auto">
                <Link to={"/profile"} className="hp-btn hp-btn-outline-custom btn">
                  View Profile
                </Link>
              </div>
            </section>

            {/* Category Filter */}
            <section className="hp-glass-card mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5>Filter by Category</h5>
                <div className="dropdown">
                  <button 
                    className="btn btn-outline-secondary dropdown-toggle"
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    {filterCategory === "all" 
                      ? "All Categories" 
                      : categories.find(c => c.id === parseInt(filterCategory))?.name || "Select Category"}
                  </button>
                  {showCategoryDropdown && (
                    <div className="dropdown-menu show" style={{display: 'block'}}>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleCategoryFilterChange("all")}
                      >
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
              
              {/* Show current category info */}
              {currentCategory && (
                <div className="mt-3">
                  <p className="mb-1">Currently viewing: <strong>{currentCategory.name}</strong></p>
                  <p className="mb-0 small text-muted">
                    Posts will be automatically added to this category.
                  </p>
                </div>
              )}
            </section>

            {/* Post Box */}
            <section className="hp-glass-card mb-4" id="postsContainer">
              <textarea
                id="hp-postText"
                placeholder={currentCategory ? `What's on your mind about ${currentCategory.name}?` : "What's on your mind?"}
                rows="4"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="w-100"
              ></textarea>
              
              {currentCategory && (
                <div className="mt-2 small text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  This post will be added to the <strong>{currentCategory.name}</strong> category.
                </div>
              )}

              {error && (
                <div className="alert alert-danger mt-2" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <div className="d-flex justify-content-end mt-3">
                <button
                  onClick={handlePost}
                  className="hp-btn hp-btn-glass btn"
                  disabled={loading}
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

            {/* Posts Container */}
            <section className="hp-posts-container">
              {posts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  user={user}
                  handleCommentPost={handleCommentPost}
                  handleLikePost={handleLikePost}
                  handleLikeComment={handleLikeComment}
                  handleLikeReply={handleLikeReply} 
                  handleReplyToComment={handleReplyToComment}
                  handleDeleteComment={handleDeleteComment}
                  handleDeleteReply={handleDeleteReply}
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
        </main>
      </div>
    </div>
  );
}

function Post({ post, user, handleCommentPost, handleLikePost, handleLikeComment, handleLikeReply, handleReplyToComment, handleDeleteComment, handleDeleteReply }) {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentReplies, setCommentReplies] = useState({});

  // Ensure comments is always an array
  const safeComments = Array.isArray(post.comments) ? post.comments : [];

  // Load replies for all comments when post is rendered
  useEffect(() => {
    const loadAllReplies = async () => {
      if (safeComments.length > 0) {
        for (const comment of safeComments) {
          try {
            const response = await fetch(`http://localhost:8080/api/social/comments/${comment.id}/replies`);
            if (response.ok) {
              const replies = await response.json();
              setCommentReplies(prev => ({...prev, [comment.id]: replies}));
            }
          } catch (error) {
            console.error('Error loading replies for comment:', comment.id, error);
          }
        }
      }
    };

    loadAllReplies();
  }, [safeComments]);

  const submitComment = () => {
    if (commentText.trim()) {
      handleCommentPost(post.id, commentText);
      setCommentText("");
      setShowCommentBox(false);
    }
  };

  return (
    <article className="hp-glass-card hp-post mb-3" id={`post-${post.id}`}>
      <div className="d-flex align-items-center mb-3">
        <img
          src="https://i.pinimg.com/736x/54/c7/c3/54c7c36c20ced3eb982c4e3e21f465fe.jpg"
          alt="Profile"
          className="hp-profile-mini me-2"
        />
        <strong className="hp-username">{post.user?.username || "User"}</strong>
        
        {/* Display category badge if exists */}
        {post.category && (
          <span 
            className="badge ms-2"
            style={{ 
              backgroundColor: post.category.color || '#6c757d',
              color: '#fff'
            }}
          >
            #{post.category.name}
          </span>
        )}
        
        <small className="text-muted ms-auto">
          {new Date(post.createdAt).toLocaleString()}
        </small>
      </div>
      <p>{post.content}</p>
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

      <section className="hp-comments">
        {showCommentBox && (
          <section className="hp-comment-box">
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
            <div className="d-flex gap-2">
              <button
                className="cancel-btn btn btn-sm"
                onClick={() => setShowCommentBox(false)}
              >
                Cancel
              </button>
              <button
                className="hp-btn hp-btn-glass btn btn-sm flex-grow-1"
                onClick={submitComment}
                disabled={!commentText.trim()}
              >
                <i className="bi bi-send me-1"></i>Post Comment
              </button>
            </div>
          </section>
        )}

        {safeComments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            onLikeComment={handleLikeComment}
            onLikeReply={handleLikeReply}
            onReplyToComment={handleReplyToComment}
            handleDeleteComment={handleDeleteComment}
            handleDeleteReply={handleDeleteReply}
            user={user}
            replies={commentReplies[comment.id] || []}
          />
        ))}
      </section>
    </article>
  );
}

function Comment({ comment, onLikeComment, onLikeReply, onReplyToComment, handleDeleteComment, handleDeleteReply, user, replies = [] }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  // Handle different response formats from API
  const safeReplies = Array.isArray(replies) ? replies : [];
  const likesCount = comment.likeCount || 0;

  const submitReply = () => {
    if (replyText.trim()) {
      onReplyToComment(comment.id, replyText);
      setReplyText("");
      setShowReplyBox(false);
    }
  };

  return (
    <article className="hp-comment mb-2" id={`comment-${comment.id}`}>
      <div className="d-flex align-items-center">
        <img
          src="https://i.pinimg.com/736x/54/c7/c3/54c7c36c20ced3eb982c4e3e21f465fe.jpg"
          alt="Profile"
          className="hp-profile-mini me-2"
          style={{width: "30px", height: "30px"}}
        />
        <strong className="hp-username me-2">{comment.user?.username || "User"}:</strong>
        <span>{comment.content}</span>
      </div>
      <small className="text-muted">
        {new Date(comment.createdAt).toLocaleString()}
      </small>

      {/* Comment Actions */}
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
        {comment.user?.id === user?.id && (
          <button
            className="btn-sm cmrp-delete"
            title="Delete comment"
            onClick={() => handleDeleteComment(comment.id)}
          >
            <i className="bi bi-trash"></i> Delete
          </button>
        )}

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
            <button
              className="cancel-btn btn btn-sm"
              onClick={() => setShowReplyBox(false)}
            >
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

      {safeReplies.length > 0 && showReplies && (
        <div className="hp-replies mt-2">
          {safeReplies.map((reply) => (
            <div key={reply.id} className="hp-reply mb-1" id={`reply-${reply.id}`}>
              <div className="d-flex align-items-center">
                <img
                  src="https://i.pinimg.com/736x/54/c7/c3/54c7c36c20ced3eb982c4e3e21f465fe.jpg"
                  alt="Profile"
                  className="hp-profile-mini me-2"
                  style={{width: "25px", height: "25px"}}
                />
                <strong className="hp-username me-2">{reply.user?.username || "User"}:</strong>
                <span>{reply.content}</span>
              </div>
              <small className="text-muted">
                {new Date(reply.createdAt).toLocaleString()}
              </small>

              {/* Reply actions */}
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