import { RoomDurableObject } from "./room";
import { searchGifs } from "./gifs";

export { RoomDurableObject };

interface Env {
  ROOMS: DurableObjectNamespace<RoomDurableObject>;
  ASSETS: Fetcher;
  GIPHY_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. WebSocket endpoint: /api/room/:roomId/ws
    if (url.pathname.startsWith("/api/room/")) {
      const parts = url.pathname.split("/").filter(Boolean); // ["api", "room", ":roomId", "ws"]
      if (parts.length >= 4 && parts[3] === "ws") {
        const rawRoomId = parts[2].toLowerCase();
        // Sanitize roomId (alphanumeric, hyphens, underscores)
        const roomId = rawRoomId.replace(/[^a-z0-9_-]/g, "").slice(0, 64) || "general";

        const id = env.ROOMS.idFromName(roomId);
        const stub = env.ROOMS.get(id);

        const newUrl = new URL(request.url);
        newUrl.searchParams.set("room", roomId);
        const roomReq = new Request(newUrl.toString(), request);

        return stub.fetch(roomReq);
      }

      if (parts.length >= 4 && parts[3] === "stats") {
        const rawRoomId = parts[2].toLowerCase();
        const roomId = rawRoomId.replace(/[^a-z0-9_-]/g, "").slice(0, 64) || "general";

        const id = env.ROOMS.idFromName(roomId);
        const stub = env.ROOMS.get(id);
        return stub.fetch(request);
      }
    }

    // 2. GIF proxy endpoint: /api/gifs?q=...
    if (url.pathname === "/api/gifs") {
      const q = url.searchParams.get("q") || "";
      const results = await searchGifs(q, env.GIPHY_API_KEY);

      return new Response(JSON.stringify(results), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 3. Static assets served by Cloudflare Workers Assets
    try {
      const assetResponse = await env.ASSETS.fetch(request);
      // Append security headers to the static asset response
      const headers = new Headers(assetResponse.headers);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-Frame-Options", "DENY");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers,
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  },
};
