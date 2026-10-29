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

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/ws")) {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }

      this.roomId = url.searchParams.get("room") || "general";
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
          user.name = cleanName;
          user.isFocused = true;
          user.isOnline = true;
          user.lastActiveAt = Date.now();

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

          // Save user to SQLite
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

          // Only generate announcement and broadcast join if the user was NOT already online in the room
          // (Deduplication prevents clone entries and duplicate join announcements across reconnects & multiple tabs)
          if (!wasAlreadyOnline) {
            joinMsg = {
              id: crypto.randomUUID(),
              roomId: this.roomId,
              userId: "system",
              userName: "System",
              userColor: "#facc15",
              text: `${user.name} joined the room`,
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

          // Send initialization data to the newly joined client
          this.sendTo(ws, {
            type: "init",
            roomId: this.roomId,
            messages: this.messages,
            users: Array.from(this.users.values()),
            selfId: user.id,
          });

          // Broadcast user_joined or user_updated to all other clients
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

          // Token Bucket Rate Limiting (max 6 burst, 2 msgs/sec steady state)
          let limiter = this.userLimiters.get(attachment.userId);
          if (!limiter) {
            limiter = new TokenBucketRateLimiter(6, 2);
            this.userLimiters.set(attachment.userId, limiter);
          }
          if (!limiter.tryConsume(1)) {
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
            replyTo = {
              id: String(replyTo.id).slice(0, 64),
              userId: String(replyTo.userId).slice(0, 64),
              userName: String(replyTo.userName).slice(0, 16),
              userColor: replyTo.userColor ? String(replyTo.userColor).slice(0, 32) : undefined,
              text: replyTo.text ? String(replyTo.text).slice(0, 300) : undefined,
              imageBase64: replyTo.imageBase64 ? "attached" : undefined,
              gifUrl: replyTo.gifUrl,
            };
          }

          const messageId = data.id || crypto.randomUUID();
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

          const emoji = data.emoji;
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
            userList.push(attachment.userId);
            message.reactions[emoji] = userList;
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

          const user = this.users.get(attachment.userId);
          if (!user) return;

          if (data.name && data.name.trim()) user.name = data.name.trim().slice(0, 16);
          if (data.color) user.color = data.color;

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
