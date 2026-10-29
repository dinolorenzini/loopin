import { useState, useEffect, useRef, useCallback } from "react";
import type { ClientMessage, Message, ServerMessage, User } from "../../server/types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseChatRoomOptions {
  roomId: string;
  currentUser: User;
  onNewMessage?: (msg: Message) => void;
}

export function useChatRoom({ roomId, currentUser, onNewMessage }: UseChatRoomOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string }[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentUserRef = useRef<User>(currentUser);
  currentUserRef.current = currentUser;

  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  const sendPacket = useCallback((packet: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(packet));
    }
  }, []);

  const connect = useCallback(() => {
    if (!roomId) return;
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {
        // Ignore
      }
    }

    setStatus("connecting");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/room/${encodeURIComponent(roomId)}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      setStatus("connected");
      // Send join event with user profile
      sendPacket({
        type: "join",
        user: currentUserRef.current,
      });
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const data = JSON.parse(event.data) as ServerMessage;

        switch (data.type) {
          case "init": {
            setMessages(data.messages || []);
            setUsers(data.users || []);
            break;
          }

          case "user_joined": {
            setUsers((prev) => {
              if (prev.some((u) => u.id === data.user.id)) return prev;
              return [...prev, data.user];
            });
            break;
          }

          case "user_left": {
            setUsers((prev) => prev.filter((u) => u.id !== data.userId));
            setTypingUsers((prev) => prev.filter((u) => u.id !== data.userId));
            break;
          }

          case "user_updated": {
            setUsers((prev) =>
              prev.map((u) => (u.id === data.user.id ? data.user : u))
            );
            // Also update user's past messages with latest name/color
            setMessages((prev) =>
              prev.map((m) =>
                m.userId === data.user.id
                  ? {
                      ...m,
                      userName: data.user.name,
                      userColor: data.user.color,
                      userAvatar: data.user.avatar,
                    }
                  : m
              )
            );
            break;
          }

          case "new_message": {
            setMessages((prev) => [...prev, data.message]);
            if (onNewMessageRef.current) {
              onNewMessageRef.current(data.message);
            }
            break;
          }

          case "message_edited": {
            setMessages((prev) =>
              prev.map((m) => (m.id === data.message.id ? data.message : m))
            );
            break;
          }

          case "message_deleted": {
            setMessages((prev) => prev.filter((m) => m.id !== data.id));
            break;
          }

          case "message_reacted": {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === data.messageId ? { ...m, reactions: data.reactions } : m
              )
            );
            break;
          }

          case "typing_status": {
            // Filter out current user from typing indicator
            const others = data.typingUsers.filter(
              (u) => u.id !== currentUserRef.current.id
            );
            setTypingUsers(others);
            break;
          }
        }
      } catch {
        // Ignore parse error
      }
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      setStatus("disconnected");

      // Auto-reconnect after 2 seconds
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, 2000);
    };

    ws.onerror = () => {
      if (!isMountedRef.current) return;
      setStatus("disconnected");
    };
  }, [roomId, sendPacket]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          // Ignore
        }
      }
    };
  }, [connect]);

  // Actions
  const sendMessage = useCallback(
    ({ text, imageBase64, gifUrl }: { text?: string; imageBase64?: string; gifUrl?: string }) => {
      sendPacket({
        type: "send_message",
        text,
        imageBase64,
        gifUrl,
      });
    },
    [sendPacket]
  );

  const editMessage = useCallback(
    (id: string, text: string) => {
      sendPacket({
        type: "edit_message",
        id,
        text,
      });
    },
    [sendPacket]
  );

  const deleteMessage = useCallback(
    (id: string) => {
      sendPacket({
        type: "delete_message",
        id,
      });
    },
    [sendPacket]
  );

  const reactMessage = useCallback(
    (messageId: string, emoji: string) => {
      sendPacket({
        type: "react_message",
        messageId,
        emoji,
      });
    },
    [sendPacket]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      sendPacket({
        type: "typing",
        isTyping,
      });
    },
    [sendPacket]
  );

  const updateProfile = useCallback(
    (profile: Partial<Pick<User, "name" | "color" | "avatar">>) => {
      sendPacket({
        type: "update_profile",
        ...profile,
      });
    },
    [sendPacket]
  );

  return {
    messages,
    users,
    status,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    reactMessage,
    sendTyping,
    updateProfile,
    reconnect: connect,
  };
}
