# Loopin ⚡

> **Ultra-fast, ephemeral real-time chat powered 100% by Cloudflare Workers & Durable Objects.**
> Zero-data logging. Ephemeral in-memory state. When all users leave, all messages vanish forever.

---

## 🌟 Overview & Key Features

Loopin is a privacy-first, real-time collaboration and chat room platform built entirely for Cloudflare's serverless edge ecosystem:

- **⚡ Instant Ephemeral Rooms**: Spin up a private room in milliseconds (`/swift-fox-42`) or choose your own custom name.
- **🔒 True Ephemeral Architecture**: Built with Cloudflare Durable Objects. When all participants disconnect from a room, every single message, image, reaction, and state object is immediately purged from memory and storage.
- **🛡️ Zero-Data Logging & Good Privacy**: No IP tracking, no persistent database entries, zero telemetry.
- **👤 Live Presence & Custom Identity**: Customize your display name, pick an avatar emoji, choose a badge color, and see real-time active indicators for all connected users in the room.
- **✍️ Message Editing**: In-place editing with live updates and `(edited)` indicator.
- **🗑️ Message Deletion**: Instant deletion with real-time room-wide sync.
- **🖼️ Base64 Image Uploads**: Drag-and-drop images, paste directly from clipboard (`Ctrl+V`), or upload files. Images are automatically client-optimized and stored in message payloads as Base64. Includes full lightbox modal view.
- **😀 Emoji Picker**: Searchable native emoji picker with category tabs and quick message reaction pills.
- **🎬 GIF Picker**: Search trending and categorized reaction GIFs proxied through the Cloudflare Worker edge (strips user IPs and protects client privacy).
- **🔔 Live Notifications & Dynamic `<title>`**: Real-time `<title>` unread badge updating `(2) Loopin • #room`, Web Notification API opt-in, and Web Audio API synthesized notification chimes.

---

## 🏗️ Architecture

Loopin is engineered to run **exclusively** on Cloudflare Workers without external servers or databases:

1. **Edge Router (`src/server/index.ts`)**:
   - Upgrades WebSocket connections at `/api/room/:roomId/ws` and forwards to Durable Objects.
   - Proxies and caches GIF queries at `/api/gifs` without leaking client IP addresses.
   - Serves Single Page Application assets via **Cloudflare Workers Static Assets** (`dist/`).
   - Injects security headers: Content Security Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`.

2. **Durable Object Room (`src/server/room.ts`)**:
   - Manages state using the **Cloudflare WebSockets Hibernation API**.
   - Maintains real-time user presence, typing status, and message history in ephemeral memory.
   - **Automatic Room Wiping**: Detects when all sockets disconnect and purges all data (`this.messages = []; this.users.clear(); await this.ctx.storage.deleteAll()`).

3. **Modern Frontend (`src/client/`)**:
   - React 18 + TypeScript + Vite.
   - Custom dark obsidian design system inspired by modern aesthetics.
   - Native `<dialog>` elements for accessible modals (Profile, Share, Lightbox) with `closedby="any"` and `overscroll-behavior: contain`.
   - Web Audio API synthesizer for zero-dependency sound chimes.

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- Node.js >= 20
- npm >= 10
- Cloudflare Wrangler CLI (bundled in devDependencies)

### 2. Install Dependencies
```bash
npm install
```

### 3. Build & Run Locally
```bash
# Build the client and start local Cloudflare Workers dev server
npm run dev
```
The app will be available at `http://localhost:8787`.

### 4. Run Automated E2E Verification Test
```bash
# Verify WebSockets, messaging, editing, deleting, image upload, and ephemeral auto-wipe
node test/ws-test.mjs
```

### 5. Deploy to Cloudflare Workers
```bash
npm run deploy
```

---

## 📂 Project Structure

```
Loopin/
├── public/
│   └── favicon.svg           # Glowing Loopin brand icon
├── src/
│   ├── client/
│   │   ├── components/
│   │   │   ├── ChatInput.tsx       # Message input, image paste, emoji/gif triggers
│   │   │   ├── EmojiPicker.tsx     # Categorized emoji picker with search
│   │   │   ├── GifPicker.tsx       # Edge-proxied GIF picker & trending tags
│   │   │   ├── HomePage.tsx        # Landing hero, instant room generator, recents
│   │   │   ├── ImageLightbox.tsx   # Lightbox modal for full-size images
│   │   │   ├── MessageItem.tsx     # Individual message bubble, editing, reactions
│   │   │   ├── ProfileModal.tsx    # Accessible name & avatar modal
│   │   │   ├── RoomHeader.tsx      # Header with room info, share, audio, notifications
│   │   │   ├── RoomView.tsx        # Room layout, drag-and-drop zone, typing bar
│   │   │   ├── ShareModal.tsx      # QR code generator & 1-click room link copy
│   │   │   └── UsersSidebar.tsx    # Slide-out drawer with active online members
│   │   ├── hooks/
│   │   │   ├── useChatRoom.ts      # WebSocket connection & protocol state
│   │   │   ├── useNotifications.ts # <title> updates, Web Notifications, chime
│   │   │   └── useUser.ts          # Identity, avatar, and color customizer
│   │   ├── styles/
│   │   │   └── index.css           # Modern dark-mode styling & responsive layout
│   │   ├── utils/
│   │   │   ├── image.ts            # Client-side image resize & Base64 encoder
│   │   │   ├── qr.ts               # Local canvas QR code generator
│   │   │   └── sound.ts            # Web Audio API marimba synthesizer chime
│   │   ├── App.tsx                 # Root SPA router
│   │   └── main.tsx                # Client entrypoint
│   └── server/
│       ├── gifs.ts                 # Curated GIF library & search proxy
│       ├── index.ts                # Cloudflare Worker router & static assets handler
│       ├── room.ts                 # Room Durable Object (WebSocket Hibernation & Wiping)
│       └── types.ts                # Shared client-server message protocol
├── test/
│   └── ws-test.mjs                 # Comprehensive E2E automated test suite
├── index.html                      # HTML template
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # Strict TypeScript configuration
├── vite.config.ts                  # Vite client build configuration
└── wrangler.jsonc                  # Cloudflare Workers & Durable Objects manifest
```

---

## 🔒 Privacy Guarantee

Loopin does not use analytics, tracking cookies, or third-party ad networks. Rooms exist only in Cloudflare Durable Object memory while users are connected. Once the last user disconnects, all data is completely wiped.
