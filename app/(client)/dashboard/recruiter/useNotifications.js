import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";

export default function useNotifications(initialUnread, setStats) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(initialUnread || 0);
  const playIntervalRef = useRef(null);
  const notificationIntervalRef = useRef(null);

  const startNotificationPolling = () => {
    fetchNotifications();
    notificationIntervalRef.current = setInterval(fetchNotifications, 60 * 1000);
  };
  const cleanupNotificationPolling = () => {
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
    }
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  };

  const fetchNotifications = async () => {
    try {
      const notificationsResponse = await fetch("/api/recruiter/notifications");
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        const notificationsList = notificationsData.notifications || notificationsData;
        const now = Date.now();
        const threeMinutesAgo = now - 20 * 60 * 1000;
        const relevantNotifications = notificationsList.filter(
          (n) => new Date(n.createdAt).getTime() > threeMinutesAgo
        );
        setNotifications(relevantNotifications);

        const unread = notificationsData.pagination?.unread
          || notificationsList.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
        setStats?.(prev => ({ ...prev, unreadNotifications: unread }));

        if (unread > 0 && !playIntervalRef.current) {
          playIntervalRef.current = setInterval(playNotificationSound, 20000);
        } else if (unread === 0 && playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
          playIntervalRef.current = null;
        }
      }
    } catch (error) {
      // Silent fail to avoid spam
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio("/notificationSound2.mp3");
    audio.play().catch(() => {});
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch("/api/recruiter/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, isRead: true }),
      });
      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setStats?.(prev => ({ ...prev, unreadNotifications: Math.max(0, prev.unreadNotifications - 1) }));
        if (unreadCount - 1 === 0 && playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
          playIntervalRef.current = null;
        }
      }
    } catch (error) {}
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch("/api/recruiter/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );
        setUnreadCount(0);
        setStats?.(prev => ({ ...prev, unreadNotifications: 0 }));
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
          playIntervalRef.current = null;
        }
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  };

  const toastSuccess = (msg) => toast.success(msg);
  const toastError = (msg) => toast.error(msg);

  // Floating notifications button (can be customized further)
  const renderFloatingButton = (onClick) => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <button
        onClick={onClick}
        className="relative bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>
    </motion.div>
  );

  useEffect(() => {
    fetchNotifications();
    return cleanupNotificationPolling;
    // eslint-disable-next-line
  }, []);

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    renderFloatingButton,
    startNotificationPolling,
    cleanupNotificationPolling,
    toastSuccess,
    toastError,
  };
}