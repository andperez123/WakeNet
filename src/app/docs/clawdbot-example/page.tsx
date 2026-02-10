import Link from "next/link";

export default function ClawdbotExamplePage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="font-display text-3xl font-bold text-white">
        Clawdbot example: receive webhook + verify HMAC
      </h1>
      <p className="mt-2 text-gray-400">
        Use this in your Clawdbot (or any agent) to receive WakeNet events and verify they’re authentic.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          What WakeNet sends
        </h2>
        <ul className="mt-4 list-disc list-inside text-gray-400 space-y-1">
          <li><strong>POST</strong> to your webhook URL</li>
          <li><strong>Body:</strong> JSON with <code className="rounded bg-wakenet-border px-1">id</code>, <code className="rounded bg-wakenet-border px-1">feedId</code>, <code className="rounded bg-wakenet-border px-1">event</code>, <code className="rounded bg-wakenet-border px-1">deliveredAt</code></li>
          <li><strong>Header:</strong> <code className="rounded bg-wakenet-border px-1">x-wakenet-signature</code> = HMAC-SHA256 of the <em>raw request body</em> using your subscription secret</li>
        </ul>
        <p className="mt-4 text-gray-400">
          You get the <strong>secret</strong> once when you create the subscription via <code className="rounded bg-wakenet-border px-1">POST /api/subscriptions</code>. Store it (e.g. <code className="rounded bg-wakenet-border px-1">WAKENET_SUBSCRIPTION_SECRET</code>) and use it only for verification.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          Node.js (Express)
        </h2>
        <p className="mt-4 text-gray-400">
          You must use the <strong>raw body</strong> for verification. If you parse JSON first, the signature will not match.
        </p>
        <pre className="mt-4 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm overflow-x-auto text-gray-300 font-mono whitespace-pre">
{`const express = require("express");
const crypto = require("crypto");

function verifyWakeNetWebhook(rawBody, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expected, "utf8")
  );
}

// Use express.raw so req.body is the raw Buffer (do NOT use express.json() for this route)
app.post(
  "/webhook/wakenet",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-wakenet-signature"];
    const secret = process.env.WAKENET_SUBSCRIPTION_SECRET;

    if (!signature || !secret) {
      return res.status(401).json({ error: "Missing signature or secret" });
    }
    const rawBody = req.body.toString();
    if (!verifyWakeNetWebhook(rawBody, signature, secret)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = JSON.parse(rawBody);
    const { id, feedId, event, deliveredAt } = payload;
    // event: { id, source, title, link, published, body, metadata }
    // Trigger your Clawdbot / agent here with event
    console.log("WakeNet event:", event.title, event.link);
    res.status(200).send("OK");
  }
);`}
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          Next.js API route (App Router)
        </h2>
        <p className="mt-4 text-gray-400">
          Read the raw body with <code className="rounded bg-wakenet-border px-1">req.text()</code> before verifying.
        </p>
        <pre className="mt-4 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm overflow-x-auto text-gray-300 font-mono whitespace-pre">
{`// app/api/webhook/wakenet/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

function verifyWakeNetWebhook(rawBody: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expected, "utf8")
  );
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-wakenet-signature");
  const secret = process.env.WAKENET_SUBSCRIPTION_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 401 });
  }
  const rawBody = await req.text();
  if (!verifyWakeNetWebhook(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const payload = JSON.parse(rawBody);
  const { event } = payload;
  // Trigger your agent with event
  return new Response("OK", { status: 200 });
}`}
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          Checklist
        </h2>
        <ul className="mt-4 list-disc list-inside text-gray-400 space-y-1">
          <li>Create a subscription in WakeNet and save the returned <code className="rounded bg-wakenet-border px-1">secret</code>.</li>
          <li>Set <code className="rounded bg-wakenet-border px-1">WAKENET_SUBSCRIPTION_SECRET</code> in your app env.</li>
          <li>Use the <strong>raw</strong> request body for HMAC verification, then parse JSON.</li>
          <li>Respond with 2xx so WakeNet marks the delivery as sent.</li>
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-wakenet-border bg-wakenet-surface/30 p-4">
        <h2 className="font-display text-lg font-semibold text-white">OpenClaw / Clawdbot skill</h2>
        <p className="mt-2 text-sm text-gray-400">
          The repo includes an AgentSkills-compatible skill so OpenClaw/Clawdbot agents can use WakeNet. Copy <code className="rounded bg-wakenet-border px-1">skill/wakenet-listener</code> into <code className="rounded bg-wakenet-border px-1">~/.openclaw/skills/</code> or your workspace <code className="rounded bg-wakenet-border px-1">skills/</code>. See the repo <a href="https://github.com/andperez123/WakeNet" className="text-wakenet-accent hover:underline">WakeNet on GitHub</a>.
        </p>
      </section>

      <p className="mt-10">
        <Link href="/docs" className="text-wakenet-accent hover:underline">← Back to Docs</Link>
      </p>
    </article>
  );
}
