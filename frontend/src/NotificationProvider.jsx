import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { NotificationContext } from "./NotificationContext.js";

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = user?.id;

  const refreshUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/notifications/unread-count?userId=${userId}`
      );
      if (response.ok) {
        const count = await response.json();
        setUnreadCount(Number(count) || 0);
      }
    } catch (error) {
      console.error("Error loading unread notification count:", error);
    }
  }, [userId]);

  useEffect(() => {
    refreshUnreadCount();

    if (!userId) return;

    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount, userId]);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}
