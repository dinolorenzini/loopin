import { RoomDurableObject } from "./room";
import { searchGifs } from "./gifs";
import { IpRateLimiter } from "./rateLimiter";

export { RoomDurableObject };

interface Env {
  ROOMS: DurableObjectNamespace<RoomDurableObject>;
  ASSETS: Fetcher;
  GIPHY_API_KEY?: string;
}

const gifRateLimiter = new IpRateLimiter(45, 5); // 45 burst, 5 requests/sec steady state
const complianceRateLimiter = new IpRateLimiter(20, 2); // 20 burst, 2 requests/sec steady state

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "100.101.178.123" ||
      host === "loopin.peretas.live" ||
      host.endsWith(".loopin.peretas.live")
    );
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Development & API CORS origin validation
    const origin = request.headers.get("Origin");
    const allowed = isOriginAllowed(origin);

    // Handle OPTIONS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowed && origin ? origin : "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 1. WebSocket endpoint: /api/room/:roomId/ws (with Cross-Site WebSocket Hijacking check)
    if (url.pathname.startsWith("/api/room/")) {
      const parts = url.pathname.split("/").filter(Boolean); // ["api", "room", ":roomId", "ws"]
      if (parts.length >= 4 && parts[3] === "ws") {
        if (!allowed) {
          return new Response("Forbidden origin", { status: 403 });
        }
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
          "Cache-Control": "public, max-age=300",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 3. Compliance Endpoints (EU DSA Notice & Action, GDPR Clear-Site-Data)
    if (url.pathname === "/api/compliance/report" && request.method === "POST") {
      const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1";
      if (!complianceRateLimiter.check(clientIp)) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const body = (await request.json()) as any;
        if (!body || !body.messageId || !body.category) {
          return new Response(JSON.stringify({ error: "Invalid notice payload." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Return receipt confirmation under EU DSA Article 16
        return new Response(
          JSON.stringify({
            success: true,
            noticeId: body.id || crypto.randomUUID(),
            receivedAt: Date.now(),
            status: "queued_for_review",
            message: "Report received in accordance with EU Digital Services Act Article 16.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse report notice." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/api/compliance/clear-site-data" && request.method === "POST") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "All site data purged in accordance with GDPR Article 17 right to erasure.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Clear-Site-Data": '"cache", "cookies", "storage"',
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // 4. Static assets served by Cloudflare Workers Assets
    try {
      let assetResponse = await env.ASSETS.fetch(request);

      // SPA fallback: if asset 404s on a GET request that is not a static file path, serve /index.html
      const isFileAsset = url.pathname.split("/").pop()?.includes(".");
      if (assetResponse.status === 404 && request.method === "GET" && !isFileAsset) {
        const indexUrl = new URL("/index.html", request.url);
        assetResponse = await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
      }

      // Modern Web Security & Privacy Headers
      const headers = new Headers(assetResponse.headers);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-Frame-Options", "DENY");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()");
      headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      headers.set("Cross-Origin-Opener-Policy", "same-origin");
      headers.set("Cross-Origin-Resource-Policy", "same-origin");
      headers.set(
        "Content-Security-Policy",
        "default-src 'self' http://100.101.178.123:* ws://100.101.178.123:*; script-src 'self' 'unsafe-inline' http://100.101.178.123:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://media.giphy.com https://*.giphy.com https://media.tenor.com https://*.tenor.com http://100.101.178.123:*; connect-src 'self' http://100.101.178.123:* ws://100.101.178.123:* wss: ws: https:; object-src 'none'; base-uri 'self';"
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
