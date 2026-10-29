export interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  joinedAt: number;
}

export interface MessageReaction {
  [emoji: string]: string[]; // array of userIds
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
  userAvatar?: string;
  text?: string;
  imageBase64?: string; // stored directly in message payload as requested
  gifUrl?: string;
  timestamp: number;
  editedAt?: number;
  reactions?: MessageReaction;
  status?: "sending" | "delivered" | "read";
  readBy?: string[]; // userIds of users who have read this message
}

export type ClientMessage =
  | { type: "join"; user: User }
  | { type: "send_message"; id?: string; text?: string; imageBase64?: string; gifUrl?: string }
  | { type: "edit_message"; id: string; text: string }
  | { type: "delete_message"; id: string }
  | { type: "react_message"; messageId: string; emoji: string }
  | { type: "mark_read"; messageIds: string[] }
  | { type: "typing"; isTyping: boolean }
  | { type: "update_profile"; name?: string; color?: string; avatar?: string };

export type ServerMessage =
  | { type: "init"; roomId: string; messages: Message[]; users: User[]; selfId: string }
  | { type: "user_joined"; user: User }
  | { type: "user_left"; userId: string; userName: string }
  | { type: "user_updated"; user: User }
  | { type: "new_message"; message: Message; clientTempId?: string }
  | { type: "message_edited"; message: Message }
  | { type: "message_deleted"; id: string }
  | { type: "message_reacted"; messageId: string; reactions: MessageReaction }
  | { type: "messages_read"; messageIds: string[]; userId: string }
  | { type: "typing_status"; typingUsers: { id: string; name: string }[] }
  | { type: "error"; message: string };
