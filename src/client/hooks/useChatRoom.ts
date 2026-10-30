import { useState, useEffect, useRef, useCallback } from "react";
import type { ClientMessage, Message, ServerMessage, User, ReplyReference } from "../../server/types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface NameConflictInfo {
  name: string;
  suggestedName: string;
  message: string;
}

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
  const [nameConflict, setNameConflict] = useState<NameConflictInfo | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const pingIntervalRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const currentUserRef = useRef<User>(currentUser);
  currentUserRef.current = currentUser;

  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  // Offline outbox queue for messages sent while disconnected (Item 8)
  const pendingOutboxRef = useRef<ClientMessage[]>([]);

  const sendPacket = useCallback((packet: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(packet));
      } catch {
        if (packet.type === "send_message") {
          pendingOutboxRef.current.push(packet);
        }
      }
    } else {
      if (packet.type === "send_message") {
        pendingOutboxRef.current.push(packet);
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (!roomId || !isMountedRef.current) return;

    // Do not reconnect if already open or connecting (Fixes Bug 4 infinite loop)
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
    }

    setStatus("connecting");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/room/${encodeURIComponent(roomId)}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      reconnectAttemptsRef.current = 0;
      setStatus("connected");

      // Send join event with user profile
      try {
        const hasFocus = typeof document !== "undefined" && !document.hidden && document.hasFocus();
        ws.send(
          JSON.stringify({
            type: "join",
            user: {
              ...currentUserRef.current,
              isFocused: hasFocus,
              lastActiveAt: Date.now(),
              isOnline: true,
            },
          })
        );
      } catch {}

      // Flush any queued offline messages
      if (pendingOutboxRef.current.length > 0) {
        const outbox = [...pendingOutboxRef.current];
        pendingOutboxRef.current = [];
        for (const pkt of outbox) {
          try {
            ws.send(JSON.stringify(pkt));
          } catch {
            pendingOutboxRef.current.push(pkt);
          }
        }
      }

      // Start keep-alive ping heartbeat every 10 seconds to prevent edge proxy timeouts
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: "ping" }));
          } catch {}
        }
      }, 10000);
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const data = JSON.parse(event.data) as ServerMessage;

        switch (data.type) {
          case "pong":
            break;

          case "name_taken": {
            setNameConflict({
              name: data.name,
              suggestedName: data.suggestedName || `${data.name}-${Math.floor(10 + Math.random() * 90)}`,
              message: data.message,
            });
            break;
          }

          case "init": {
            setNameConflict(null);
            const initialMsgs = (data.messages || []).filter(
              (m: Message) => !(m.isSystem && m.text === `${currentUser.name} joined the room`)
            );
            setMessages(initialMsgs);
            const userMap = new Map<string, User>();
            for (const u of data.users || []) {
              if (u && u.id) userMap.set(u.id, u);
            }
            setUsers(Array.from(userMap.values()));
            break;
          }

          case "users_sync": {
            const userMap = new Map<string, User>();
            for (const u of data.users || []) {
              if (u && u.id) userMap.set(u.id, u);
            }
            setUsers(Array.from(userMap.values()));
            break;
          }

          case "user_joined": {
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === data.user.id);
              if (exists) {
                return prev.map((u) =>
                  u.id === data.user.id ? { ...u, ...data.user, isOnline: true } : u
                );
              }
              return [...prev, { ...data.user, isOnline: true }];
            });
            break;
          }

          case "user_left": {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === data.userId
                  ? { ...u, isOnline: false, isFocused: false, lastActiveAt: Date.now() }
                  : u
              )
            );
            setTypingUsers((prev) => prev.filter((u) => u.id !== data.userId));
            break;
          }

          case "user_updated": {
            setUsers((prev) =>
              prev.map((u) => (u.id === data.user.id ? { ...u, ...data.user } : u))
            );
            setMessages((prev) =>
              prev.map((m) =>
                m.userId === data.user.id
                  ? {
                      ...m,
                      userName: data.user.name,
                      userColor: data.user.color,
                    }
                  : m
              )
            );
            break;
          }

          case "user_focus_changed": {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === data.userId
                  ? { ...u, isFocused: data.isFocused, lastActiveAt: data.lastActiveAt }
                  : u
              )
            );
            break;
          }

          case "new_message": {
            setMessages((prev) => {
              if (data.clientTempId && prev.some((m) => m.id === data.clientTempId)) {
                return prev.map((m) => (m.id === data.clientTempId ? data.message : m));
              }
              if (prev.some((m) => m.id === data.message.id)) {
                return prev.map((m) => (m.id === data.message.id ? data.message : m));
              }
              return [...prev, data.message];
            });

            if (onNewMessageRef.current && data.message.userId !== currentUserRef.current.id) {
              onNewMessageRef.current(data.message);
            }
            break;
          }

          case "messages_read": {
            setMessages((prev) =>
              prev.map((m) => {
                if (data.messageIds.includes(m.id)) {
                  const existingReadBy = m.readBy || [m.userId];
                  const newReadBy = existingReadBy.includes(data.userId)
                    ? existingReadBy
                    : [...existingReadBy, data.userId];
                  return {
                    ...m,
                    readBy: newReadBy,
                    status: newReadBy.some((id) => id !== m.userId) ? "read" : m.status,
                  };
                }
                return m;
              })
            );
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
            const others = data.typingUsers.filter(
              (u) => u.id !== currentUserRef.current.id
            );
            setTypingUsers(others);
            break;
          }
        }
      } catch {}
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      setStatus("disconnected");
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      // Exponential backoff with jitter to prevent reconnect storms
      const attempt = reconnectAttemptsRef.current;
      const baseDelay = Math.min(8000, 1000 * Math.pow(1.5, attempt));
      const jitter = Math.random() * 500;
      const delay = Math.round(baseDelay + jitter);
      reconnectAttemptsRef.current = attempt + 1;

      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, delay);
    };

    ws.onerror = () => {
      if (!isMountedRef.current) return;
      setStatus("disconnected");
    };
  }, [roomId]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    const handleBeforeUnload = () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    const handleOnline = () => {
      reconnectAttemptsRef.current = 0;
      if (socketRef.current?.readyState !== WebSocket.OPEN) {
        connect();
      }
    };
    window.addEventListener("online", handleOnline);

    const updateFocusState = () => {
      const isFocused = typeof document !== "undefined" && !document.hidden && document.hasFocus();
      sendPacket({
        type: "focus_change",
        isFocused,
        lastActiveAt: Date.now(),
      });
      if (isFocused && socketRef.current?.readyState !== WebSocket.OPEN) {
        connect();
      }
    };

    const handleVisibilityChange = () => {
      updateFocusState();
    };

    const handleFocus = () => {
      updateFocusState();
    };

    const handleBlur = () => {
      updateFocusState();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);

      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {}
      }
    };
  }, [roomId, connect, sendPacket]); // Crucial: NO status in dependencies!

  // Actions
  const sendMessage = useCallback(
    ({
      text,
      imageBase64,
      gifUrl,
      replyTo,
    }: {
      text?: string;
      imageBase64?: string;
      gifUrl?: string;
      replyTo?: ReplyReference;
    }) => {
      const tempId = crypto.randomUUID();
      const user = currentUserRef.current;

      const optMessage: Message = {
        id: tempId,
        roomId,
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        text,
        imageBase64,
        gifUrl,
        replyTo,
        timestamp: Date.now(),
        reactions: {},
        status: "sending",
        readBy: [user.id],
      };

      setMessages((prev) => [...prev, optMessage]);

      sendPacket({
        type: "send_message",
        id: tempId,
        text,
        imageBase64,
        gifUrl,
        replyTo,
      });
    },
    [roomId, sendPacket]
  );

  const markAsRead = useCallback(
    (messageIds: string[]) => {
      if (!messageIds || messageIds.length === 0) return;
      sendPacket({
        type: "mark_read",
        messageIds,
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
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = { ...(m.reactions || {}) };
          const userList = [...(currentReactions[emoji] || [])];
          const myId = currentUserRef.current.id;
          const idx = userList.indexOf(myId);
          if (idx >= 0) {
            userList.splice(idx, 1);
            if (userList.length === 0) {
              delete currentReactions[emoji];
            } else {
              currentReactions[emoji] = userList;
            }
          } else {
            userList.push(myId);
            currentReactions[emoji] = userList;
          }
          return { ...m, reactions: currentReactions };
        })
      );

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
    (profile: Partial<Pick<User, "name" | "color">>) => {
      sendPacket({
        type: "update_profile",
        ...profile,
      });
    },
    [sendPacket]
  );

  const resolveNameConflict = useCallback(
    (newName: string) => {
      const clean = newName.trim().slice(0, 16);
      if (!clean) return;
      setNameConflict(null);
      currentUserRef.current = { ...currentUserRef.current, name: clean };
      sendPacket({
        type: "join",
        user: {
          ...currentUserRef.current,
          name: clean,
          isFocused: typeof document !== "undefined" && !document.hidden && document.hasFocus(),
          lastActiveAt: Date.now(),
          isOnline: true,
        },
      });
    },
    [sendPacket]
  );

  return {
    messages,
    users,
    status,
    typingUsers,
    nameConflict,
    resolveNameConflict,
    sendMessage,
    editMessage,
    deleteMessage,
    reactMessage,
    markAsRead,
    sendTyping,
    updateProfile,
    reconnect: connect,
  };
}
