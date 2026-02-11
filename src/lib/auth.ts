import { NextResponse } from "next/server";

/**
 * Validate bearer token from Authorization header.
 * If WAKENET_API_KEY is not set, all requests are allowed (open mode).
 * Also accepts requests from the admin UI (wakenet_admin cookie).
 * Returns null if authorized, or a NextResponse 401 if not.
 */
export function requireApiKey(req: Request): NextResponse | null {
  const apiKey = process.env.WAKENET_API_KEY;
  if (!apiKey) return null; // open mode — no key required

  // Allow admin UI requests (already gated by ADMIN_SECRET cookie)
  const cookies = req.headers.get("cookie") ?? "";
  if (cookies.includes("wakenet_admin=1")) return null;

  const header = req.headers.get("authorization");
  if (!header) {
    return NextResponse.json(
      { error: "This server requires an API key. Send it in the Authorization header as Bearer <key>." },
      { status: 401 }
    );
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || token !== apiKey) {
    return NextResponse.json(
      { error: "This server requires an API key. The provided key is invalid." },
      { status: 401 }
    );
  }

  return null; // authorized
}
