import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { useNotifications } from "./NotificationContext.js";
import { useToast } from "./ToastContext.jsx";
import { getAvatarUrl } from "./avatarUtils.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./home.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { unreadCount } = useNotifications();

  const isHome = location.pathname === "/home";
  const isAbout = location.pathname === "/about";
  const isNotifications = location.pathname === "/notifications";
  const isProfile = location.pathname === "/profile" || location.pathname === "/edit-profile";

  const handleLogout = () => {
    logout();
    addToast("You have been logged out successfully", "info");
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg hp-navbar-custom" style={{ position: "sticky", top: 0, zIndex: 1030 }}>
      <div className="container">
        <Link className="hp-navbar-brand navbar-brand" to="/home">
          <i className="bi bi-mortarboard-fill"></i> Filter X
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbarNav"
          aria-controls="mainNavbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ borderColor: "#d4af37" }}>
          <i className="bi bi-list" style={{ color: "#d4af37", fontSize: "1.5rem" }}></i>
        </button>
        <div className="collapse navbar-collapse" id="mainNavbarNav">
          <ul className="hp-navbar-nav navbar-nav ms-auto align-items-lg-center">
            <li className="hp-nav-item nav-item">
              {isHome ? (
                <a className="hp-nav-link nav-link" href="#postsContainer">
                  <span className="text-warning">Post</span>
                </a>
              ) : (
                <Link className="hp-nav-link nav-link" to="/home">Post</Link>
              )}
            </li>
            <li className="hp-nav-item nav-item">
              <Link className={`hp-nav-link nav-link ${isAbout ? "text-warning" : ""}`} to="/about">
                About Us
              </Link>
            </li>
            <li className="hp-nav-item nav-item">
              <Link
                className={`hp-nav-link nav-link position-relative ${isNotifications ? "text-warning" : ""}`}
                to="/notifications"
                title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}>
                <i className="bi bi-bell-fill" style={{ fontSize: "1.2rem" }}></i>
                {unreadCount > 0 && (
                  <span className="hp-notif-badge" aria-hidden="true">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </li>
            <li className="hp-nav-item nav-item">
              <Link className={`hp-nav-link nav-link ${isProfile ? "text-warning" : ""}`} to="/profile">
                {user?.hasProfilePicture || user?.profilePictureUrl ? (
                  <img
                    src={getAvatarUrl(user)}
                    alt={user?.username || "Profile"}
                    className="rounded-circle me-1"
                    style={{ width: "24px", height: "24px", objectFit: "cover", border: "1.5px solid #d4af37", verticalAlign: "middle" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <i className="bi bi-person-circle me-1"></i>
                )}
                {user?.username || "Profile"}
              </Link>
            </li>
            <li className="hp-nav-item nav-item">
              <button className="hp-logout-btn btn btn-sm ms-2" style={{ borderRadius: "9999px" }} onClick={handleLogout} title="Logout">
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
