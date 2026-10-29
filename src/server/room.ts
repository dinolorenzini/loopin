import { DurableObject } from "cloudflare:workers";
import type { ClientMessage, Message, MessageReaction, ServerMessage, User } from "./types";

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

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
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

    if (url.pathname.endsWith("/stats")) {
      // Ephemeral room stats without disclosing message contents or user info
      return Response.json({
        room: this.roomId,
        onlineCount: this.ctx.getWebSockets().length,
        messageCount: this.messages.length,
      });
    }

    return new Response("Not found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, rawMessage: string | ArrayBuffer): Promise<void> {
    try {
      if (typeof rawMessage !== "string") return;
      const data = JSON.parse(rawMessage) as ClientMessage;

      switch (data.type) {
        case "join": {
          const user = data.user;
          if (!user?.id || !user?.name) return;

          // If room has 0 active users, guarantee fresh ephemeral room
          if (this.users.size === 0) {
            this.messages = [];
            this.typingUsers.clear();
          }

          const attachment: SocketAttachment = {
            userId: user.id,
            roomId: this.roomId,
          };
          ws.serializeAttachment(attachment);

          this.users.set(user.id, user);

          let sockets = this.userSockets.get(user.id);
          if (!sockets) {
            sockets = new Set();
            this.userSockets.set(user.id, sockets);
          }
          sockets.add(ws);

          // Send initialization data to the newly joined client
          this.sendTo(ws, {
            type: "init",
            roomId: this.roomId,
            messages: this.messages,
            users: Array.from(this.users.values()),
            selfId: user.id,
          });

          // Broadcast user_joined to all other clients
          this.broadcast(
            {
              type: "user_joined",
              user,
            },
            ws
          );
          break;
        }

        case "send_message": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;

          const user = this.users.get(attachment.userId);
          if (!user) return;

          const text = data.text?.trim();
          const imageBase64 = data.imageBase64;
          const gifUrl = data.gifUrl;

          // Message must contain at least text, image, or gif
          if (!text && !imageBase64 && !gifUrl) return;

          // Enforce reasonable limits (text max 10k chars, imageBase64 max 7MB)
          if (text && text.length > 10000) return;
          if (imageBase64 && imageBase64.length > 7000000) return;

          const messageId = data.id || crypto.randomUUID();
          const message: Message = {
            id: messageId,
            roomId: this.roomId,
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            userAvatar: user.avatar,
            text: text || undefined,
            imageBase64: imageBase64 || undefined,
            gifUrl: gifUrl || undefined,
            timestamp: Date.now(),
            reactions: {},
            status: "delivered",
            readBy: [user.id],
          };

          this.messages.push(message);

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
          // Only message author can edit
          if (msg.userId !== attachment.userId) return;

          const newText = data.text?.trim();
          if (!newText || newText.length > 10000) return;

          msg.text = newText;
          msg.editedAt = Date.now();

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
          // Author or anyone in the ephemeral room can delete if allowed, but author is strictly verified
          if (msg.userId !== attachment.userId) return;

          this.messages.splice(messageIndex, 1);

          this.broadcast({
            type: "message_deleted",
            id: data.id,
          });
          break;
        }

        case "react_message": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId) return;

          const message = this.messages.find((m) => m.id === data.messageId);
          if (!message) return;

          const emoji = data.emoji;
          if (!emoji || emoji.length > 10) return;

          if (!message.reactions) {
            message.reactions = {};
          }

          const userList = message.reactions[emoji] || [];
          const existingIndex = userList.indexOf(attachment.userId);

          if (existingIndex >= 0) {
            // Toggle off
            userList.splice(existingIndex, 1);
            if (userList.length === 0) {
              delete message.reactions[emoji];
            } else {
              message.reactions[emoji] = userList;
            }
          } else {
            // Toggle on
            userList.push(attachment.userId);
            message.reactions[emoji] = userList;
          }

          this.broadcast({
            type: "message_reacted",
            messageId: message.id,
            reactions: message.reactions,
          });
          break;
        }

        case "mark_read": {
          const attachment = ws.deserializeAttachment() as SocketAttachment | null;
          if (!attachment?.userId || !Array.isArray(data.messageIds)) return;

          const updatedIds: string[] = [];
          for (const mid of data.messageIds) {
            const msg = this.messages.find((m) => m.id === mid);
            if (msg) {
              if (!msg.readBy) msg.readBy = [msg.userId];
              if (!msg.readBy.includes(attachment.userId)) {
                msg.readBy.push(attachment.userId);
                msg.status = "read";
                updatedIds.push(mid);
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

          if (data.name && data.name.trim()) user.name = data.name.trim().slice(0, 32);
          if (data.color) user.color = data.color;
          if (data.avatar) user.avatar = data.avatar;

          this.users.set(user.id, user);

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
          this.users.delete(userId);
          this.typingUsers.delete(userId);

          if (user) {
            this.broadcast({
              type: "user_left",
              userId: user.id,
              userName: user.name,
            });
          }
        }
      }
    }

    // Check remaining connected open sockets in this room (excluding the closing socket)
    const activeSockets = this.ctx
      .getWebSockets()
      .filter((s) => s !== ws && s.readyState === WebSocket.OPEN);

    // CRITICAL REQUIREMENT:
    // "when all users leave a room/disconnect, it deletes all messages"
    if (activeSockets.length === 0 || this.users.size === 0) {
      this.messages = [];
      this.users.clear();
      this.userSockets.clear();
      this.typingUsers.clear();
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

  private broadcast(message: ServerMessage, excludeWs?: WebSocket): void {
    const payload = JSON.stringify(message);
    const sockets = this.ctx.getWebSockets();

    for (const socket of sockets) {
      if (socket !== excludeWs && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(payload);
        } catch {
          // Socket write failed, will be pruned
        }
      }
    }
  }

  private sendTo(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch {
        // Socket write failed
      }
    }
  }
}
