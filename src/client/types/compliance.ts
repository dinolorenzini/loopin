export type AgeBracket = "under13" | "13-15" | "16+";

export type ComplianceMode = "standard" | "coppa_child" | "ferpa_edu";

export interface ConsentPreferences {
  necessary: true; // Strictly necessary session and WebSocket storage
  preferences: boolean; // UI customizations, themes, audio, shaders
  history: boolean; // Recent rooms memory
  timestamp: number;
  version: string;
}

export const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  preferences: true,
  history: true,
  timestamp: 0,
  version: "2026.1",
};

export type AbuseReportCategory =
  | "harassment"
  | "illegal_content"
  | "hate_speech"
  | "child_safety"
  | "pii_leak"
  | "copyright_dmca"
  | "other";

export interface AbuseReport {
  id: string;
  category: AbuseReportCategory;
  roomId: string;
  messageId: string;
  reportedUserId: string;
  reportedUserName: string;
  messageSnippet: string;
  details?: string;
  timestamp: number;
}
