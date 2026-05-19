// src/components/Toast.jsx
import React, { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

const Toast = ({ message, type = "info", onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "bi-check-circle-fill";
      case "error":
        return "bi-exclamation-circle-fill";
      case "warning":
        return "bi-exclamation-triangle-fill";
      default:
        return "bi-info-circle-fill";
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-success";
      case "error":
        return "bg-danger";
      case "warning":
        return "bg-warning";
      default:
        return "bg-info";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`toast show align-items-center text-white border-0 ${getBgColor()}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        minWidth: "300px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "opacity 0.3s ease-out"
      }}
    >
      <div className="d-flex">
        <div className="toast-body d-flex align-items-center">
          <i className={`bi ${getIcon()} me-2`} style={{ fontSize: "1.2rem" }}></i>
          {message}
        </div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
          aria-label="Close"
        ></button>
      </div>
    </div>
  );
};

export default Toast;