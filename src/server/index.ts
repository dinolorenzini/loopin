import { RoomDurableObject } from "./room";
import { searchGifs } from "./gifs";
import { IpRateLimiter } from "./rateLimiter";

export { RoomDurableObject };

interface Env {
  ROOMS: DurableObjectNamespace<RoomDurableObject>;
  ASSETS: Fetcher;
  GIPHY_API_KEY?: string;
}

const gifRateLimiter = new IpRateLimiter(30, 2); // 30 burst, 2 requests/sec steady state

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. WebSocket endpoint: /api/room/:roomId/ws
    if (url.pathname.startsWith("/api/room/")) {
      const parts = url.pathname.split("/").filter(Boolean); // ["api", "room", ":roomId", "ws"]
      if (parts.length >= 4 && parts[3] === "ws") {
        const rawRoomId = parts[2].toLowerCase();
        // Sanitize roomId (strictly alphanumeric, hyphens, underscores)
        const roomId = rawRoomId.replace(/[^a-z0-9_-]/g, "").slice(0, 64) || "general";

        const id = env.ROOMS.idFromName(roomId);
        const stub = env.ROOMS.get(id);

        const newUrl = new URL(request.url);
        newUrl.searchParams.set("room", roomId);
        const roomReq = new Request(newUrl.toString(), request);

        return stub.fetch(roomReq);
      }

      if (parts.length >= 4 && (parts[3] === "stats" || parts[3] === "check")) {
        const rawRoomId = parts[2].toLowerCase();
        const roomId = rawRoomId.replace(/[^a-z0-9_-]/g, "").slice(0, 64) || "general";

        const id = env.ROOMS.idFromName(roomId);
        const stub = env.ROOMS.get(id);
        const newUrl = new URL(request.url);
        newUrl.searchParams.set("room", roomId);
        const roomReq = new Request(newUrl.toString(), request);
        return stub.fetch(roomReq);
      }
    }

    // 2. GIF proxy endpoint: /api/gifs?q=... with IP rate limiting
    if (url.pathname === "/api/gifs") {
      const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1";
      if (!gifRateLimiter.check(clientIp)) {
        return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "5",
          },
        });
      }

      const q = url.searchParams.get("q") || "";
      const sanitizedQ = q.slice(0, 60);
      const results = await searchGifs(sanitizedQ, env.GIPHY_API_KEY);

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
      let assetResponse = await env.ASSETS.fetch(request);

      // SPA fallback: if asset 404s on a GET request that is not a static file path, serve /index.html
      const isFileAsset = url.pathname.split("/").pop()?.includes(".");
      if (assetResponse.status === 404 && request.method === "GET" && !isFileAsset) {
        const indexUrl = new URL("/index.html", request.url);
        assetResponse = await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
      }

      // Modern Web Security Headers
      const headers = new Headers(assetResponse.headers);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-Frame-Options", "DENY");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
      headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://media.giphy.com https://*.giphy.com; connect-src 'self' wss: ws: https:; object-src 'none'; base-uri 'self';"
      );

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
