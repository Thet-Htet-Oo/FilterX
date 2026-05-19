// src/components/Notification.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./home.css";

function Notification() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:8080/api/notifications?userId=${user.id}`);
      if (response.ok) {
        const notificationsData = await response.json();
        setNotifications(notificationsData);
      } else {
        addToast("Error loading notifications", "error");
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      addToast("Error loading notifications", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? {...notif, isRead: true} : notif
          )
        );
        return true;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    return false;
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/notifications/mark-all-read?userId=${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({...notif, isRead: true}))
        );
        addToast("All notifications marked as read", "success");
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      addToast("Error marking notifications as read", "error");
    }
  };

  const handleLogout = () => {
    logout();
    addToast("You have been logged out successfully", "info");
    navigate("/");
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LIKE_POST':
        return 'bi-hand-thumbs-up';
      case 'LIKE_COMMENT':
        return 'bi-hand-thumbs-up';
      case 'LIKE_REPLY':
        return 'bi-hand-thumbs-up';
      case 'COMMENT':
        return 'bi-chat';
      case 'REPLY':
        return 'bi-reply';
      default:
        return 'bi-bell';
    }
  };

  const getNotificationMessage = (notification) => {
    const sender = notification.senderUsername || 'Someone';

    switch (notification.type) {
      case 'LIKE_POST':
        return `${sender} liked your post`;
      case 'LIKE_COMMENT':
        return `${sender} liked your comment`;
      case 'LIKE_REPLY':
        return `${sender} liked your reply`;
      case 'COMMENT':
        return `${sender} commented on your post`;
      case 'REPLY':
        return `${sender} replied to your comment`;
      default:
        return `${sender} interacted with your content`;
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    const markedAsRead = await markAsRead(notification.id);

    if (markedAsRead) {
      // Navigate to home page with notification data
      navigate('/home', {
        state: {
          fromNotification: true,
          notificationId: notification.id,
          entityId: notification.entityId,
          type: notification.type
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="hp-container">
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hp-container">
      <div className="hp-home d-flex flex-column min-vh-100">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg hp-navbar-custom" style={{ position: "sticky", top: 0, zIndex: 1030 }}>
          <div className="container">
            <Link className="hp-navbar-brand navbar-brand" to="/home">
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
              style={{ borderColor: "#d4af37" }}
            >
              <i className="bi bi-list" style={{ color: "#d4af37", fontSize: "1.5rem" }}></i>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="hp-navbar-nav navbar-nav ms-auto align-items-lg-center">
                <li className="hp-nav-item nav-item">
                  <Link className="hp-nav-link nav-link" to="/home">
                    Home
                  </Link>
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
                  <span className="hp-nav-link nav-link text-warning">
                    Notifications
                  </span>
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
            <header className="hp-page-header">Notifications</header>
            <div className="hp-page-tagline">Stay updated with your activity</div>

            {/* Notifications Header */}
            <section className="hp-glass-card d-flex align-items-center justify-content-between mb-4">
              <div>
                <h4>Your Notifications</h4>
                <p className="mb-0">
                  {notifications.filter(n => !n.isRead).length} unread of {notifications.length} total
                </p>
              </div>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <button
                  className="hp-btn hp-btn-outline-custom btn"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </button>
              )}
            </section>

            {/* Notifications List */}
            <section className="hp-posts-container">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`hp-glass-card mb-3 ${!notification.isRead ? 'border-warning' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="d-flex align-items-start">
                      <div className="me-3">
                        <i
                          className={`bi ${getNotificationIcon(notification.type)}`}
                          style={{ fontSize: "1.5rem", color: "#d4af37" }}
                        ></i>
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-1">{getNotificationMessage(notification)}</p>
                        <small className="text-muted">
                          {new Date(notification.createdAt).toLocaleString()}
                        </small>
                      </div>
                      {!notification.isRead && (
                        <button
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          <i className="bi bi-check"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="hp-glass-card text-center py-5 d-flex flex-column justify-content-center">
                  <i className="bi bi-bell display-4 text-muted mb-3"></i>
                  <h5 className="mt-3">No notifications yet</h5>
                  <p className="text-muted">Your notifications will appear here</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Notification;