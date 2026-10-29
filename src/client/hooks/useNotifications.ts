import { useState, useEffect, useCallback, useRef } from "react";
import { soundManager } from "../utils/sound";
import type { Message } from "../../server/types";

export function useNotifications(roomId: string, currentUserId: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });
  const [soundMuted, setSoundMuted] = useState<boolean>(() => soundManager.getMuted());
  const isDocumentVisibleRef = useRef<boolean>(true);

  // Track window visibility & focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      isDocumentVisibleRef.current = visible;
      if (visible) {
        setUnreadCount(0);
      }
    };

    const handleFocus = () => {
      isDocumentVisibleRef.current = true;
      setUnreadCount(0);
    };

    const handleBlur = () => {
      isDocumentVisibleRef.current = false;
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Update <title> live based on room and unread count
  useEffect(() => {
    const roomLabel = roomId ? `#${roomId}` : "Ephemeral Chat";
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Loopin • ${roomLabel}`;
    } else {
      document.title = `Loopin • ${roomLabel}`;
    }
  }, [unreadCount, roomId]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied" as NotificationPermission;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return "denied" as NotificationPermission;
    }
  }, []);

  // Toggle sound chime
  const toggleSound = useCallback(() => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  }, [soundMuted]);

  // Handle new incoming message
  const onNewMessage = useCallback(
    (message: Message) => {
      // Don't alert for my own messages
      if (message.userId === currentUserId) return;

      // Play audio chime
      soundManager.playNotificationChime();

      // If document is hidden/unfocused, increment unread count & show system notification
      if (!isDocumentVisibleRef.current) {
        setUnreadCount((prev) => prev + 1);

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            const body = message.text
              ? message.text.length > 80
                ? message.text.slice(0, 77) + "..."
                : message.text
              : message.imageBase64
              ? "📷 Sent an image"
              : message.gifUrl
              ? "🎬 Sent a GIF"
              : "Sent a message";

            const notification = new Notification(`${message.userName} (#${roomId})`, {
              body,
              icon: "/favicon.svg",
              badge: "/favicon.svg",
              tag: `loopin-msg-${roomId}`,
            });

            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch {
            // Notification failed (e.g. background service worker context)
          }
        }
      }
    },
    [currentUserId, roomId]
  );

  return {
    unreadCount,
    permission,
    soundMuted,
    requestPermission,
    toggleSound,
    onNewMessage,
  };
}
