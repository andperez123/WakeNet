import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Admin auth not configured" }, { status: 501 });
  }
  let body: { key?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const key = body.key?.trim();
  if (!key || key !== secret) {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("wakenet_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
