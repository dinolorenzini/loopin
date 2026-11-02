import { DurableObject } from "cloudflare:workers";
import type { ClientMessage, Message, MessageReaction, ServerMessage, User } from "./types";
import { TokenBucketRateLimiter } from "./rateLimiter";

interface SocketAttachment {
  userId: string;
  roomId: string;
}

export class RoomDurableObject extends DurableObject {
  private roomId: string = "";
  private messages: Message[] = [];
  private users: Map<string, User> = new Map();
  private userSockets: Map<string, Set<WebSocket>> = new Map();
  private typingUsers: Map<string, number> = new Map();
  private userLimiters: Map<string, TokenBucketRateLimiter> = new Map();
  private dbInitialized: boolean = false;
  private ownerId: string | null = null;
  private isLocked: boolean = false;
  private pendingRequests: Map<string, { user: User; ws: WebSocket; requestedAt: number }> = new Map();

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.initDb();
  }

  private initDb(): void {
    if (this.dbInitialized) return;
    try {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          roomId TEXT,
          userId TEXT,
          userName TEXT,
          userColor TEXT,
          text TEXT,
          imageBase64 TEXT,
          gifUrl TEXT,
          replyToJson TEXT,
          timestamp INTEGER,
          editedAt INTEGER,
          reactionsJson TEXT,
          readByJson TEXT,
          isSystem INTEGER
        );
      `);

      try {
        this.ctx.storage.sql.exec("ALTER TABLE messages ADD COLUMN replyToJson TEXT;");
      } catch {}

      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT,
          color TEXT,
          joinedAt INTEGER,
          isFocused INTEGER,
          lastActiveAt INTEGER
        );
      `);

      // Restore messages from SQLite if available
      const msgRows = this.ctx.storage.sql.exec<any>("SELECT * FROM messages ORDER BY timestamp ASC").toArray();
      this.messages = msgRows.map((r) => this.rowToMessage(r));

      // Restore users from SQLite if available
      const userRows = this.ctx.storage.sql.exec<any>("SELECT * FROM users").toArray();
      for (const u of userRows) {
        this.users.set(u.id as string, {
          id: u.id as string,
          name: u.name as string,
          color: (u.color as string) || "#facc15",
          joinedAt: Number(u.joinedAt),
          isFocused: Boolean(u.isFocused),
          lastActiveAt: Number(u.lastActiveAt) || Date.now(),
          isOnline: false,
        });
      }

      this.dbInitialized = true;
    } catch {
      // Fallback if SQL is not supported in current environment
      this.dbInitialized = true;
    }
  }

  private rowToMessage(row: any): Message {
    let reactions: MessageReaction | undefined;
    let readBy: string[] | undefined;
    let replyTo: any | undefined;
    try {
      if (row.reactionsJson) reactions = JSON.parse(row.reactionsJson as string);
    } catch {}
    try {
      if (row.readByJson) readBy = JSON.parse(row.readByJson as string);
    } catch {}
    try {
      if (row.replyToJson) replyTo = JSON.parse(row.replyToJson as string);
    } catch {}

    return {
      id: row.id as string,
      roomId: row.roomId as string,
      userId: row.userId as string,
      userName: row.userName as string,
      userColor: (row.userColor as string) || "#facc15",
      text: (row.text as string) || undefined,
      imageBase64: (row.imageBase64 as string) || undefined,
      gifUrl: (row.gifUrl as string) || undefined,
      replyTo,
      timestamp: Number(row.timestamp),
      editedAt: row.editedAt ? Number(row.editedAt) : undefined,
      reactions,
      readBy,
      status: "delivered",
      isSystem: Boolean(row.isSystem),
    };
  }

  private getPendingRequestsList() {
    return Array.from(this.pendingRequests.values()).map((p) => ({
      id: p.user.id,
      name: p.user.name,
      color: p.user.color,
      timestamp: p.requestedAt,
    }));
  }

  private sendToOwner(message: ServerMessage): void {
    if (!this.ownerId) return;
    const sockets = this.userSockets.get(this.ownerId);
    if (sockets) {
      for (const ws of sockets) {
        this.sendTo(ws, message);
      }
    }
  }

  private completeUserJoin(ws: WebSocket, user: User): void {
    user.isOnline = true;
    user.lastActiveAt = Date.now();
    user.isOwner = (user.id === this.ownerId);

    const attachment: SocketAttachment = {
      userId: user.id,
      roomId: this.roomId,
    };
    ws.serializeAttachment(attachment);

    let sockets = this.userSockets.get(user.id);
    const wasAlreadyOnline = Boolean(sockets && sockets.size > 0 && this.users.get(user.id)?.isOnline);
    if (!sockets) {
      sockets = new Set();
      this.userSockets.set(user.id, sockets);
    }
    sockets.add(ws);

    this.users.set(user.id, user);

    try {
      this.ctx.storage.sql.exec(
        `INSERT INTO users (id, name, color, joinedAt, isFocused, lastActiveAt) 
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET 
           name=excluded.name, 
           color=excluded.color, 
           isFocused=excluded.isFocused, 
           lastActiveAt=excluded.lastActiveAt`,
        user.id,
        user.name,
        user.color || "#facc15",
        user.joinedAt || Date.now(),
        1,
        user.lastActiveAt
      );
    } catch {}

    let joinMsg: Message | undefined;
    if (!wasAlreadyOnline) {
      joinMsg = {
        id: crypto.randomUUID(),
        roomId: this.roomId,
        userId: "system",
        userName: "System",
        userColor: "#facc15",
        text: user.isOwner ? `👑 ${user.name} joined as host` : `${user.name} joined the room`,
        timestamp: Date.now(),
        isSystem: true,
        status: "delivered",
      };
      this.messages.push(joinMsg);

      try {
        this.ctx.storage.sql.exec(
          `INSERT INTO messages (id, roomId, userId, userName, userColor, text, timestamp, isSystem) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          joinMsg.id,
          joinMsg.roomId,
          joinMsg.userId,
          joinMsg.userName,
          joinMsg.userColor,
          joinMsg.text || "",
          joinMsg.timestamp
        );
      } catch {}
    }

    const activeUsers = this.getActiveUsersList();

    this.sendTo(ws, {
      type: "init",
      roomId: this.roomId,
      messages: joinMsg ? this.messages.filter((m) => m.id !== joinMsg.id) : this.messages,
      users: activeUsers,
      selfId: user.id,
      isOwner: user.id === this.ownerId,
      ownerId: this.ownerId,
      isLocked: this.isLocked,
      pendingRequests: user.id === this.ownerId ? this.getPendingRequestsList() : undefined,
    });

    if (!wasAlreadyOnline) {
      this.broadcast(
        {
          type: "user_joined",
          user,
        },
        ws
      );

      if (joinMsg) {
        this.broadcast(
          {
            type: "new_message",
            message: joinMsg,
          },
          ws
        );
      }
    } else {
      this.broadcast(
        {
          type: "user_updated",
          user,
        },
        ws
      );
    }

    this.broadcast({
      type: "users_sync",
      users: activeUsers,
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const roomParam = url.searchParams.get("room")?.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);
    if (roomParam) {
      this.roomId = roomParam;
    } else if (!this.roomId) {
      this.roomId = "general";
    }

    if (url.pathname.endsWith("/ws")) {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      // Cloudflare Hibernation API
      this.ctx.acceptWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    if (url.pathname.endsWith("/stats") || url.pathname.endsWith("/check")) {
      const activeSockets = this.ctx.getWebSockets().filter((s) => s.readyState === WebSocket.OPEN);
      return Response.json({
        room: this.roomId,
        onlineCount: activeSockets.length,
        messageCount: this.messages.length,
        taken: activeSockets.length > 0 || this.messages.length > 0,
      });
    }

    return new Response("Not found", { status: 404 });
  }

  private checkRateLimit(userId: string, tokens = 1): boolean {
    let limiter = this.userLimiters.get(userId);
    if (!limiter) {
      limiter = new TokenBucketRateLimiter(8, 2);
      this.userLimiters.set(userId, limiter);
    }
    return limiter.tryConsume(tokens);
  }

  async webSocketMessage(ws: WebSocket, rawMessage: string | ArrayBuffer): Promise<void> {
    try {
      if (typeof rawMessage !== "string") return;
      const data = JSON.parse(rawMessage) as ClientMessage;

      switch (data.type) {
        case "ping": {
          this.sendTo(ws, { type: "pong" });
          break;
        }

        case "join": {
          const user = data.user;
          if (!user?.id || !user?.name) return;

          // Sanitize user name and attributes (Max 16 chars as requested)
          const cleanName = user.name.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 16);
          if (!cleanName) return;

          // Check if another active user in the room already has this name (case-insensitive)
          const lowerName = cleanName.toLowerCase();
          let conflictUser: User | null = null;
          for (const [existingId, existingUser] of this.users.entries()) {
            if (existingId === user.id) continue; // Same user reconnecting or multi-tab
            if (existingUser.name && existingUser.name.trim().toLowerCase() === lowerName) {
              if (this.isUserOnline(existingId)) {
                conflictUser = existingUser;
                break;
              }
            }
          }

          if (conflictUser) {
            const randSuffix = Math.floor(10 + Math.random() * 90);
            const basePrefix = cleanName.slice(0, 13);
            const suggested = `${basePrefix}-${randSuffix}`;
            this.sendTo(ws, {
              type: "name_taken",
              name: cleanName,
              suggestedName: suggested,
              message: `The name "${cleanName}" is already taken by another active user in this room. Please choose a different name.`,
            });
            return;
          }

          user.name = cleanName;
          user.color = typeof user.color === "string" && /^#[0-9a-fA-F]{3,8}$/.test(user.color) ? user.color : "#facc15";
          user.isFocused = Boolean(data.user.isFocused);

          // Establish or confirm Room Ownership
          if (!this.ownerId || !this.users.has(this.ownerId) || !this.isUserOnline(this.ownerId)) {
            this.ownerId = user.id;
          }
          user.isOwner = (user.id === this.ownerId);

          // If Room is Locked and user is NOT the owner and not already admitted/online
          const isAlreadyOnline = Boolean(this.users.has(user.id) && this.users.get(user.id)?.isOnline);
          if (this.isLocked && user.id !== this.ownerId && !isAlreadyOnline) {
            this.pendingRequests.set(user.id, { user, ws, requestedAt: Date.now() });
            const attachment: SocketAttachment = {
              userId: user.id,
              roomId: this.roomId,
            };
            ws.serializeAttachment(attachment);

            this.sendTo(ws, {
              type: "join_requested",
              message: "This room is locked by the host. Waiting for host approval...",
            });

            this.sendToOwner({
              type: "knock_request",
              request: {
                id: user.id,
                name: user.name,
                color: user.color,
                timestamp: Date.now(),
              },
            });
            return;
          }

          this.completeUserJoin(ws, user);
          break;
        }

        case "focus_change": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;

          const user = this.users.get(attachment.userId);
          if (!user) return;

          const isFocused = Boolean(data.isFocused);
          const lastActiveAt = data.lastActiveAt || Date.now();

          user.isFocused = isFocused;
          user.lastActiveAt = lastActiveAt;
          this.users.set(user.id, user);

          try {
            this.ctx.storage.sql.exec(
              "UPDATE users SET isFocused = ?, lastActiveAt = ? WHERE id = ?",
              isFocused ? 1 : 0,
              lastActiveAt,
              user.id
            );
          } catch {}

          this.broadcast({
            type: "user_focus_changed",
            userId: user.id,
            isFocused,
            lastActiveAt,
          });
          break;
        }

        case "send_message": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;

          const user = this.users.get(attachment.userId);
          if (!user) return;

          // COPPA Under-13 Child Account Safeguard
          if (user.complianceRole === "child") {
            if (data.imageBase64) {
              this.sendTo(ws, {
                type: "error",
                message: "Image uploads are restricted for child accounts under COPPA 16 CFR § 312.",
              });
              return;
            }
            if (data.gifUrl) {
              this.sendTo(ws, {
                type: "error",
                message: "External media queries are restricted for child accounts under COPPA 16 CFR § 312.",
              });
              return;
            }
          }

          // Token Bucket Rate Limiting (max 8 burst, 2 msgs/sec steady state)
          if (!this.checkRateLimit(attachment.userId, 1)) {
            this.sendTo(ws, {
              type: "error",
              message: "You are sending messages too quickly. Please wait a moment.",
            });
            return;
          }

          let text = data.text?.trim();
          const imageBase64 = data.imageBase64;
          let gifUrl = data.gifUrl;

          if (!text && !imageBase64 && !gifUrl) return;

          if (text) {
            text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 2000);
            if (!text) return;
          }

          if (imageBase64) {
            const isSafeImage = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(imageBase64);
            if (!isSafeImage || imageBase64.length > 5000000) {
              this.sendTo(ws, {
                type: "error",
                message: "Invalid image format. Only PNG, JPEG, WebP, and GIF under 5MB are allowed.",
              });
              return;
            }
          }

          if (gifUrl) {
            try {
              const parsed = new URL(gifUrl);
              if (parsed.protocol !== "https:") return;
            } catch {
              return;
            }
          }

          let replyTo = data.replyTo;
          if (replyTo && (!replyTo.id || !replyTo.userName)) {
            replyTo = undefined;
          }
          if (replyTo) {
            let safeReplyGifUrl: string | undefined;
            if (replyTo.gifUrl) {
              try {
                const parsed = new URL(replyTo.gifUrl);
                if (parsed.protocol === "https:") safeReplyGifUrl = parsed.toString();
              } catch {}
            }

            replyTo = {
              id: String(replyTo.id).slice(0, 64),
              userId: String(replyTo.userId).slice(0, 64),
              userName: String(replyTo.userName).replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 16),
              userColor: replyTo.userColor && /^#[0-9a-fA-F]{3,8}$/.test(replyTo.userColor) ? replyTo.userColor : undefined,
              text: replyTo.text ? String(replyTo.text).slice(0, 300) : undefined,
              imageBase64: replyTo.imageBase64 ? "attached" : undefined,
              gifUrl: safeReplyGifUrl,
            };
          }

          // Authoritative message ID (validate format and guarantee uniqueness)
          const isValidClientTempId = typeof data.id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(data.id);
          const clientTempId = isValidClientTempId ? data.id : undefined;
          const messageId = (clientTempId && !this.messages.some((m) => m.id === clientTempId))
            ? clientTempId
            : crypto.randomUUID();
          const message: Message = {
            id: messageId,
            roomId: this.roomId,
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            text: text || undefined,
            imageBase64: imageBase64 || undefined,
            gifUrl: gifUrl || undefined,
            replyTo,
            timestamp: Date.now(),
            reactions: {},
            status: "delivered",
            readBy: [user.id],
          };

          this.messages.push(message);

          // Save message to SQLite
          try {
            this.ctx.storage.sql.exec(
              `INSERT INTO messages (id, roomId, userId, userName, userColor, text, imageBase64, gifUrl, replyToJson, timestamp, reactionsJson, readByJson, isSystem) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
              message.id,
              message.roomId,
              message.userId,
              message.userName,
              message.userColor,
              message.text || null,
              message.imageBase64 || null,
              message.gifUrl || null,
              message.replyTo ? JSON.stringify(message.replyTo) : null,
              message.timestamp,
              JSON.stringify(message.reactions || {}),
              JSON.stringify(message.readBy || [])
            );
          } catch {}

          // Clear user's typing status when sending
          this.typingUsers.delete(user.id);
          this.broadcastTypingStatus();

          this.broadcast({
            type: "new_message",
            message,
            clientTempId: data.id,
          });
          break;
        }

        case "edit_message": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;

          if (!this.checkRateLimit(attachment.userId, 1)) {
            this.sendTo(ws, {
              type: "error",
              message: "You are editing messages too quickly. Please wait a moment.",
            });
            return;
          }

          const messageIndex = this.messages.findIndex((m) => m.id === data.id);
          if (messageIndex === -1) return;

          const msg = this.messages[messageIndex];
          if (msg.userId !== attachment.userId) return;

          const newText = data.text?.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 2000);
          if (!newText) return;

          msg.text = newText;
          msg.editedAt = Date.now();

          try {
            this.ctx.storage.sql.exec(
              "UPDATE messages SET text = ?, editedAt = ? WHERE id = ?",
              msg.text,
              msg.editedAt,
              msg.id
            );
          } catch {}

          this.broadcast({
            type: "message_edited",
            message: msg,
          });
          break;
        }

        case "delete_message": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;

          if (!this.checkRateLimit(attachment.userId, 1)) {
            this.sendTo(ws, {
              type: "error",
              message: "You are deleting messages too quickly. Please wait a moment.",
            });
            return;
          }

          const messageIndex = this.messages.findIndex((m) => m.id === data.id);
          if (messageIndex === -1) return;

          const msg = this.messages[messageIndex];
          if (msg.userId !== attachment.userId) return;

          this.messages.splice(messageIndex, 1);

          try {
            this.ctx.storage.sql.exec("DELETE FROM messages WHERE id = ?", data.id);
          } catch {}

          this.broadcast({
            type: "message_deleted",
            id: data.id,
          });
          break;
        }

        case "react_message": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;

          if (!this.checkRateLimit(attachment.userId, 1)) {
            return;
          }

          let message = this.messages.find((m) => m.id === data.messageId);
          if (!message) {
            try {
              const rows = this.ctx.storage.sql.exec<any>("SELECT * FROM messages WHERE id = ?", data.messageId).toArray();
              if (rows.length > 0) {
                message = this.rowToMessage(rows[0]);
                this.messages.push(message);
              }
            } catch {}
          }
          if (!message) return;

          const emoji = typeof data.emoji === "string" ? data.emoji.trim() : "";
          if (!emoji || emoji.length > 10) return;

          if (!message.reactions) {
            message.reactions = {};
          }

          const userList = message.reactions[emoji] || [];
          const existingIndex = userList.indexOf(attachment.userId);

          if (existingIndex >= 0) {
            userList.splice(existingIndex, 1);
            if (userList.length === 0) {
              delete message.reactions[emoji];
            } else {
              message.reactions[emoji] = userList;
            }
          } else {
            // Cap distinct reaction emojis to 24 per message to prevent payload exhaustion
            if (!message.reactions[emoji] && Object.keys(message.reactions).length >= 24) {
              return;
            }
            if (userList.length < 100) {
              userList.push(attachment.userId);
              message.reactions[emoji] = userList;
            }
          }

          try {
            this.ctx.storage.sql.exec(
              "UPDATE messages SET reactionsJson = ? WHERE id = ?",
              JSON.stringify(message.reactions),
              message.id
            );
          } catch {}

          this.broadcast({
            type: "message_reacted",
            messageId: message.id,
            reactions: message.reactions,
          });
          break;
        }

        case "mark_read": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;

          const updatedIds: string[] = [];
          for (const mid of data.messageIds) {
            const msg = this.messages.find((m) => m.id === mid);
            if (msg) {
              // Senders cannot mark their own messages as read receipts
              if (msg.userId === attachment.userId) {
                continue;
              }
              if (!msg.readBy) msg.readBy = [msg.userId];
              if (!msg.readBy.includes(attachment.userId)) {
                msg.readBy.push(attachment.userId);
                msg.status = "read";
                updatedIds.push(mid);
                try {
                  this.ctx.storage.sql.exec(
                    "UPDATE messages SET readByJson = ? WHERE id = ?",
                    JSON.stringify(msg.readBy),
                    msg.id
                  );
                } catch {}
              }
            }
          }

          if (updatedIds.length > 0) {
            this.broadcast({
              type: "messages_read",
              messageIds: updatedIds,
              userId: attachment.userId,
            });
          }
          break;
        }

        case "typing": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;

          if (data.isTyping) {
            this.typingUsers.set(attachment.userId, Date.now() + 4000);
          } else {
            this.typingUsers.delete(attachment.userId);
          }
          this.broadcastTypingStatus();
          break;
        }

        case "update_profile": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;

          if (!this.checkRateLimit(attachment.userId, 1)) {
            ws.send(JSON.stringify({ type: "rate_limited", retryAfter: 2000 }));
            return;
          }

          const user = this.users.get(attachment.userId);
          if (!user) return;

          if (data.name && typeof data.name === "string" && data.name.trim()) {
            const nextName = data.name.trim().slice(0, 16);
            const lowerNext = nextName.toLowerCase();
            let conflictUser: User | null = null;
            for (const [existingId, existingUser] of this.users.entries()) {
              if (existingId === user.id) continue;
              if (existingUser.name && existingUser.name.trim().toLowerCase() === lowerNext) {
                if (this.isUserOnline(existingId)) {
                  conflictUser = existingUser;
                  break;
                }
              }
            }

            if (conflictUser) {
              const randSuffix = Math.floor(10 + Math.random() * 90);
              const basePrefix = nextName.slice(0, 13);
              const suggested = `${basePrefix}-${randSuffix}`;
              this.sendTo(ws, {
                type: "name_taken",
                name: nextName,
                suggestedName: suggested,
                message: `The name "${nextName}" is already taken by another active user in this room. Please choose a different name.`,
              });
              return;
            }

            user.name = nextName;
          }
          if (data.color && typeof data.color === "string" && /^#[0-9a-fA-F]{3,8}$/.test(data.color)) {
            user.color = data.color;
          }

          this.users.set(user.id, user);

          try {
            this.ctx.storage.sql.exec(
              "UPDATE users SET name = ?, color = ? WHERE id = ?",
              user.name,
              user.color,
              user.id
            );
          } catch {}

          this.broadcast({
            type: "user_updated",
            user,
          });
          this.broadcast({
            type: "users_sync",
            users: this.getActiveUsersList(),
          });
          break;
        }

        case "report_content": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;
          const msg = this.messages.find((m) => m.id === data.messageId);
          if (msg) {
            msg.isReported = true;
          }
          break;
        }

        case "set_room_lock": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId || attachment.userId !== this.ownerId) return;

          this.isLocked = Boolean(data.locked);
          this.broadcast({
            type: "room_lock_changed",
            locked: this.isLocked,
            ownerId: this.ownerId,
          });

          const lockNotice: Message = {
            id: crypto.randomUUID(),
            roomId: this.roomId,
            userId: "system",
            userName: "System",
            userColor: "#facc15",
            text: this.isLocked
              ? "🔒 Host has locked the room. New members must request permission to enter."
              : "🔓 Host has unlocked the room. Anyone with the link can join freely.",
            timestamp: Date.now(),
            isSystem: true,
            status: "delivered",
          };
          this.messages.push(lockNotice);
          this.broadcast({
            type: "new_message",
            message: lockNotice,
          });
          break;
        }

        case "approve_join": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId || attachment.userId !== this.ownerId) return;

          const pending = this.pendingRequests.get(data.userId);
          if (!pending) return;

          this.pendingRequests.delete(data.userId);

          // Complete the join process for the approved user
          this.completeUserJoin(pending.ws, pending.user);

          this.sendToOwner({
            type: "knock_resolved",
            userId: data.userId,
            approved: true,
          });
          break;
        }

        case "deny_join": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId || attachment.userId !== this.ownerId) return;

          const pending = this.pendingRequests.get(data.userId);
          if (pending) {
            this.sendTo(pending.ws, {
              type: "join_denied",
              message: "The host has declined your request to join this room.",
            });
            this.pendingRequests.delete(data.userId);
          }

          this.sendToOwner({
            type: "knock_resolved",
            userId: data.userId,
            approved: false,
          });
          break;
        }

        case "kick_user": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId || attachment.userId !== this.ownerId) return;
          if (data.userId === this.ownerId) return;

          const targetUser = this.users.get(data.userId);
          if (targetUser) {
            const sockets = this.userSockets.get(data.userId);
            if (sockets) {
              for (const s of sockets) {
                this.sendTo(s, {
                  type: "kicked",
                  message: "You were removed from the room by the host.",
                });
                try {
                  s.close(1008, "Removed by host");
                } catch {}
              }
            }

            const kickNotice: Message = {
              id: crypto.randomUUID(),
              roomId: this.roomId,
              userId: "system",
              userName: "System",
              userColor: "#facc15",
              text: `🚪 ${targetUser.name} was removed from the room by the host`,
              timestamp: Date.now(),
              isSystem: true,
              status: "delivered",
            };
            this.messages.push(kickNotice);
            this.broadcast({
              type: "new_message",
              message: kickNotice,
            });
          }
          break;
        }
      }
    } catch {
      // Privacy: silent ignore invalid packets, zero server trace logging
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.handleDisconnect(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.handleDisconnect(ws);
  }

  private async handleDisconnect(ws: WebSocket): Promise<void> {
    const attachment = ws.deserializeAttachment() as SocketAttachment | null;
    if (attachment?.userId) {
      const userId = attachment.userId;
      this.pendingRequests.delete(userId);

      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(ws);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          const user = this.users.get(userId);
          this.typingUsers.delete(userId);
          this.broadcastTypingStatus();

          if (user) {
            // Keep user in memory and DB but mark as offline
            user.isOnline = false;
            user.isFocused = false;
            user.lastActiveAt = Date.now();
            this.users.set(userId, user);

            try {
              this.ctx.storage.sql.exec(
                "UPDATE users SET isFocused = 0, lastActiveAt = ? WHERE id = ?",
                user.lastActiveAt,
                userId
              );
            } catch {}

            this.broadcast({
              type: "user_left",
              userId: user.id,
              userName: user.name,
            });

            // System Announcement for user going offline
            const leaveMsg: Message = {
              id: crypto.randomUUID(),
              roomId: this.roomId,
              userId: "system",
              userName: "System",
              userColor: "#facc15",
              text: `${user.name} went offline`,
              timestamp: Date.now(),
              isSystem: true,
              status: "delivered",
            };
            this.messages.push(leaveMsg);
            this.broadcast({
              type: "new_message",
              message: leaveMsg,
            });

            // If the user who went offline was the owner, transfer ownership to the next active user
            if (user.id === this.ownerId) {
              const activeRemaining = this.getActiveUsersList().filter((u) => u.id !== user.id);
              if (activeRemaining.length > 0) {
                const nextOwner = activeRemaining[0];
                this.ownerId = nextOwner.id;
                nextOwner.isOwner = true;
                this.users.set(nextOwner.id, nextOwner);
                this.broadcast({
                  type: "owner_changed",
                  ownerId: this.ownerId,
                });
                const transferMsg: Message = {
                  id: crypto.randomUUID(),
                  roomId: this.roomId,
                  userId: "system",
                  userName: "System",
                  userColor: "#facc15",
                  text: `👑 ${nextOwner.name} is now the host of this room`,
                  timestamp: Date.now(),
                  isSystem: true,
                  status: "delivered",
                };
                this.messages.push(transferMsg);
                this.broadcast({
                  type: "new_message",
                  message: transferMsg,
                });
              } else {
                this.ownerId = null;
              }
            }

            this.broadcast({
              type: "users_sync",
              users: this.getActiveUsersList(),
            });
          }
        }
      }
    }

    // Check remaining connected open sockets in this room
    const activeSockets = this.ctx
      .getWebSockets()
      .filter((s) => s !== ws && s.readyState === WebSocket.OPEN);

    // Ephemeral auto-wipe when all users disconnect from the room
    if (activeSockets.length === 0) {
      this.messages = [];
      this.users.clear();
      this.userSockets.clear();
      this.typingUsers.clear();
      this.userLimiters.clear();
      this.ownerId = null;
      this.isLocked = false;
      this.pendingRequests.clear();
      try {
        this.ctx.storage.sql.exec("DELETE FROM messages;");
        this.ctx.storage.sql.exec("DELETE FROM users;");
      } catch {}
      await this.ctx.storage.deleteAll();
    }
  }

  private broadcastTypingStatus(): void {
    const now = Date.now();
    const activeTyping: { id: string; name: string }[] = [];

    for (const [userId, expiry] of this.typingUsers.entries()) {
      if (expiry > now) {
        const user = this.users.get(userId);
        if (user) {
          activeTyping.push({ id: user.id, name: user.name });
        }
      } else {
        this.typingUsers.delete(userId);
      }
    }

    this.broadcast({
      type: "typing_status",
      typingUsers: activeTyping,
    });
  }

  private isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return false;

    // Prune dead/closed sockets from Hibernation API
    const activeSockets = new Set(this.ctx.getWebSockets());
    for (const s of [...sockets]) {
      if (!activeSockets.has(s) || s.readyState !== WebSocket.OPEN) {
        sockets.delete(s);
      }
    }

    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      const user = this.users.get(userId);
      if (user) user.isOnline = false;
      return false;
    }
    return true;
  }

  private getActiveUsersList(): User[] {
    const list: User[] = [];
    const seenNames = new Set<string>();

    // 1. Add all online users first
    for (const [userId, user] of this.users.entries()) {
      const isOnline = this.isUserOnline(userId);
      if (isOnline) {
        seenNames.add(user.name.toLowerCase());
        list.push({ ...user, isOnline: true });
      }
    }

    // 2. Add offline users only if their name is not already online
    for (const [userId, user] of this.users.entries()) {
      const isOnline = this.isUserOnline(userId);
      if (!isOnline) {
        const lower = user.name.toLowerCase();
        if (!seenNames.has(lower)) {
          seenNames.add(lower);
          list.push({ ...user, isOnline: false });
        }
      }
    }

    return list;
  }

  private sendTo(ws: WebSocket, message: ServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch {}
  }

  private broadcast(message: ServerMessage, excludeWs?: WebSocket): void {
    const sockets = this.ctx.getWebSockets();
    const payload = JSON.stringify(message);

    for (const ws of sockets) {
      if (excludeWs && ws === excludeWs) continue;
      try {
        ws.send(payload);
      } catch {}
    }
  }
}
