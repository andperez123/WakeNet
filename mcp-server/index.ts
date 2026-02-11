#!/usr/bin/env npx tsx
/**
 * WakeNet MCP Server
 *
 * Exposes WakeNet operations as MCP tools so any MCP-aware agent
 * (Claude, Cursor, OpenClaw, etc.) can create feeds, manage subscriptions,
 * browse events, and trigger polls — all without knowing curl commands.
 *
 * Environment variables:
 *   WAKENET_BASE_URL — Base URL of your WakeNet instance (default: https://wake-net.vercel.app)
 *   WAKENET_API_KEY  — Bearer token for authenticated endpoints (optional if WakeNet is open)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const WAKENET_BASE_URL = (process.env.WAKENET_BASE_URL || "https://wake-net.vercel.app").replace(
  /\/$/,
  ""
);
const WAKENET_API_KEY = process.env.WAKENET_API_KEY || "";

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function wakenetFetch(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (WAKENET_API_KEY) {
    headers["Authorization"] = `Bearer ${WAKENET_API_KEY}`;
  }

  const res = await fetch(`${WAKENET_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = { raw: await res.text() };
  }

  return { ok: res.ok, status: res.status, data };
}

function textResult(obj: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }],
  };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "wakenet",
  version: "1.0.0",
});

// ----- List feeds ----------------------------------------------------------

server.tool(
  "wakenet_list_feeds",
  "List all WakeNet feeds (RSS, GitHub Releases, HTTP JSON)",
  {},
  async () => {
    const { data } = await wakenetFetch("/api/feeds");
    return textResult(data);
  }
);

// ----- Create feed ---------------------------------------------------------

server.tool(
  "wakenet_create_feed",
  "Create a new WakeNet feed. Type must be rss, github_releases, or http_json.",
  {
    type: z
      .enum(["rss", "github_releases", "http_json"])
      .describe("Feed type"),
    url: z
      .string()
      .optional()
      .describe("Feed URL (required for rss and http_json)"),
    owner: z
      .string()
      .optional()
      .describe("GitHub owner (required for github_releases)"),
    repo: z
      .string()
      .optional()
      .describe("GitHub repo (required for github_releases)"),
    pollIntervalMinutes: z
      .number()
      .int()
      .min(1)
      .max(1440)
      .optional()
      .describe("Poll interval in minutes (default 15)"),
  },
  async ({ type, url, owner, repo, pollIntervalMinutes }) => {
    let config: Record<string, unknown> = {};
    if (type === "rss" || type === "http_json") {
      if (!url) return textResult({ error: "url is required for rss / http_json" });
      config = { url };
    } else if (type === "github_releases") {
      if (!owner || !repo)
        return textResult({ error: "owner and repo are required for github_releases" });
      config = { owner, repo };
    }

    const { data } = await wakenetFetch("/api/feeds", {
      method: "POST",
      body: { type, config, pollIntervalMinutes: pollIntervalMinutes ?? 15 },
    });
    return textResult(data);
  }
);

// ----- List subscriptions --------------------------------------------------

server.tool(
  "wakenet_list_subscriptions",
  "List all WakeNet subscriptions",
  {},
  async () => {
    const { data } = await wakenetFetch("/api/subscriptions");
    return textResult(data);
  }
);

// ----- Create subscription -------------------------------------------------

server.tool(
  "wakenet_create_subscription",
  "Create a subscription to receive events from a feed via webhook or pull. Returns a secret — store it for webhook verification.",
  {
    feedId: z.string().uuid().describe("ID of the feed to subscribe to"),
    name: z.string().min(1).describe("Human-readable subscription name"),
    webhookUrl: z
      .string()
      .url()
      .optional()
      .describe("Webhook URL to receive events (omit for pull-only)"),
    pullEnabled: z
      .boolean()
      .optional()
      .describe("Enable pull-based event retrieval (default false)"),
    outputFormat: z
      .enum(["default", "promoter"])
      .optional()
      .describe("Payload format: default or promoter"),
    deliveryMode: z
      .enum(["immediate", "daily_digest"])
      .optional()
      .describe("Delivery mode: immediate or daily_digest"),
    deliveryRateLimitMinutes: z
      .number()
      .int()
      .min(0)
      .max(1440)
      .optional()
      .describe("Min minutes between deliveries (0 = no limit)"),
    digestScheduleTime: z
      .string()
      .optional()
      .describe("UTC time for daily digest, e.g. '09:00'"),
    includeKeywords: z
      .array(z.string())
      .optional()
      .describe("Keywords to match in event title/body"),
    minScore: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Minimum event score for delivery"),
  },
  async (params) => {
    const filters: Record<string, unknown> = {};
    if (params.includeKeywords?.length) filters.includeKeywords = params.includeKeywords;
    if (params.minScore != null) filters.minScore = params.minScore;

    const body: Record<string, unknown> = {
      feedId: params.feedId,
      name: params.name,
    };
    if (params.webhookUrl) body.webhookUrl = params.webhookUrl;
    if (params.pullEnabled) body.pullEnabled = params.pullEnabled;
    if (params.outputFormat) body.outputFormat = params.outputFormat;
    if (params.deliveryMode) body.deliveryMode = params.deliveryMode;
    if (params.deliveryRateLimitMinutes != null)
      body.deliveryRateLimitMinutes = params.deliveryRateLimitMinutes;
    if (params.digestScheduleTime) body.digestScheduleTime = params.digestScheduleTime;
    if (Object.keys(filters).length > 0) body.filters = filters;

    const { data } = await wakenetFetch("/api/subscriptions", {
      method: "POST",
      body,
    });
    return textResult(data);
  }
);

// ----- List events ---------------------------------------------------------

server.tool(
  "wakenet_list_events",
  "List recent events, optionally filtered by feed ID",
  {
    feedId: z
      .string()
      .uuid()
      .optional()
      .describe("Filter events to a specific feed"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Max events to return (default 20)"),
  },
  async ({ feedId, limit }) => {
    const params = new URLSearchParams();
    if (feedId) params.set("feedId", feedId);
    params.set("limit", String(limit ?? 20));
    const { data } = await wakenetFetch(`/api/events?${params.toString()}`);
    return textResult(data);
  }
);

// ----- Poll feed -----------------------------------------------------------

server.tool(
  "wakenet_poll_feed",
  "Trigger an immediate poll for a specific feed. Returns count of new events and deliveries.",
  {
    feedId: z.string().uuid().describe("ID of the feed to poll"),
  },
  async ({ feedId }) => {
    const { data } = await wakenetFetch(`/api/poll/${feedId}`, {
      method: "POST",
    });
    return textResult(data);
  }
);

// ----- Pull events (webhook-less) ------------------------------------------

server.tool(
  "wakenet_pull_events",
  "Pull delivered events for a pull-enabled subscription (no webhook). Pass after (cursor from previous response) to get only new events (consume-once).",
  {
    subscriptionId: z.string().uuid().describe("ID of the pull-enabled subscription"),
    after: z.string().optional().describe("Cursor from previous response nextCursor (ISO timestamp); omit for first call"),
  },
  async ({ subscriptionId, after }) => {
    const path = after
      ? `/api/subscriptions/${subscriptionId}/pull?after=${encodeURIComponent(after)}`
      : `/api/subscriptions/${subscriptionId}/pull`;
    const { data } = await wakenetFetch(path);
    return textResult(data);
  }
);

// ----- Ensure subscription (idempotent) ------------------------------------

server.tool(
  "wakenet_ensure_subscription",
  "Find a subscription by name and feedId; create it if missing. Avoids duplicate subscriptions when re-running setup.",
  {
    feedId: z.string().uuid().describe("ID of the feed"),
    name: z.string().min(1).describe("Subscription name (used to find or create)"),
    webhookUrl: z.string().url().optional().describe("Webhook URL (omit for pull-only)"),
    pullEnabled: z.boolean().optional().describe("Enable pull (default true if no webhookUrl)"),
    outputFormat: z.enum(["default", "promoter"]).optional(),
    includeKeywords: z.array(z.string()).optional(),
    minScore: z.number().int().min(0).optional(),
  },
  async (params) => {
    const { data: list } = await wakenetFetch("/api/subscriptions");
    const subs = Array.isArray(list) ? list : [];
    const matches = (subs as { id?: string; feedId?: string; name?: string; createdAt?: string }[]).filter(
      (s) => s.feedId === params.feedId && s.name === params.name
    );
    if (matches.length > 0) {
      const newest = matches.sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      )[0];
      return textResult({
        found: true,
        subscription: newest,
        message: "Subscription already exists (uniqueness: feedId + name).",
        warning: matches.length > 1 ? `Multiple subscriptions matched; returned newest (${matches.length} total).` : undefined,
      });
    }
    const body: Record<string, unknown> = {
      feedId: params.feedId,
      name: params.name,
      pullEnabled: params.pullEnabled ?? !params.webhookUrl,
    };
    if (params.webhookUrl) body.webhookUrl = params.webhookUrl;
    if (params.outputFormat) body.outputFormat = params.outputFormat;
    const filters: Record<string, unknown> = {};
    if (params.includeKeywords?.length) filters.includeKeywords = params.includeKeywords;
    if (params.minScore != null) filters.minScore = params.minScore;
    if (Object.keys(filters).length > 0) body.filters = filters;

    const { data: created } = await wakenetFetch("/api/subscriptions", {
      method: "POST",
      body,
    });
    return textResult({ found: false, subscription: created, message: "Subscription created." });
  }
);

// ----- Smoke test ----------------------------------------------------------

server.tool(
  "wakenet_smoketest",
  "Run a full smoke test: create a test feed, pull subscription, poll, pull events. Reports success or failure with remediation. Does not delete the test feed/sub (you can remove in Admin).",
  {},
  async () => {
    const steps: { step: string; ok: boolean; detail?: string }[] = [];
    let feedId: string | null = null;
    let subId: string | null = null;

    const { ok: healthOk, data: healthData } = await wakenetFetch("/api/health");
    steps.push({
      step: "health",
      ok: healthOk,
      detail: healthOk ? "WakeNet and DB OK" : String((healthData as { error?: string })?.error ?? healthData),
    });
    if (!healthOk) {
      return textResult({
        ok: false,
        steps,
        remediation: "Check WAKENET_BASE_URL and that the WakeNet instance is up. If using API key, set WAKENET_API_KEY.",
      });
    }

    const nameSuffix = Date.now();
    const { ok: feedOk, data: feedData } = await wakenetFetch("/api/feeds", {
      method: "POST",
      body: {
        type: "rss",
        config: { url: "https://hnrss.org/frontpage" },
        pollIntervalMinutes: 60,
      },
    });
    const feed = feedOk && feedData && typeof feedData === "object" && "id" in feedData ? (feedData as { id: string }) : null;
    feedId = feed?.id ?? null;
    steps.push({
      step: "create_feed",
      ok: feedOk && !!feedId,
      detail: feedOk ? `Feed ${feedId}` : String((feedData as { error?: string })?.error ?? feedData),
    });
    if (!feedId) {
      return textResult({
        ok: false,
        steps,
        remediation: "Create feed failed. If 401: set WAKENET_API_KEY. If 503: check WakeNet DB.",
      });
    }

    const { ok: subOk, data: subData } = await wakenetFetch("/api/subscriptions", {
      method: "POST",
      body: { feedId, name: `SmokeTest-${nameSuffix}`, pullEnabled: true },
    });
    const sub = subOk && subData && typeof subData === "object" && "id" in subData ? (subData as { id: string }) : null;
    subId = sub?.id ?? null;
    steps.push({
      step: "create_subscription",
      ok: subOk && !!subId,
      detail: subOk ? `Subscription ${subId}` : String((subData as { error?: string })?.error ?? subData),
    });
    if (!subId) {
      return textResult({ ok: false, steps, remediation: "Create subscription failed. Check API key and feed ID." });
    }

    const { ok: pollOk, data: pollData } = await wakenetFetch(`/api/poll/${feedId}`, { method: "POST" });
    steps.push({
      step: "poll_feed",
      ok: pollOk,
      detail: pollOk ? String(JSON.stringify(pollData)) : String((pollData as { error?: string })?.error ?? pollData),
    });

    const { ok: pullOk, data: pullData } = await wakenetFetch(`/api/subscriptions/${subId}/pull`);
    const items = pullData && typeof pullData === "object" && "items" in pullData ? (pullData as { items: unknown[] }).items : [];
    steps.push({
      step: "pull_events",
      ok: pullOk,
      detail: pullOk ? `Got ${items.length} event(s) (empty array is OK)` : String(pullData),
    });

    const allOk = steps.every((s) => s.ok);
    return textResult({
      ok: allOk,
      steps,
      testFeedId: feedId,
      testSubscriptionId: subId,
      warning: allOk && items.length === 0 ? "No events yet (first poll or empty feed is normal; not a failure)." : undefined,
      remediation: allOk
        ? undefined
        : "Fix the first failing step. Common: 401 = add WAKENET_API_KEY; 503 = WakeNet DB down.",
    });
  }
);

// ----- Health check --------------------------------------------------------

server.tool(
  "wakenet_health",
  "Check WakeNet instance health and database connectivity",
  {},
  async () => {
    const { data } = await wakenetFetch("/api/health");
    return textResult(data);
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`WakeNet MCP Server running on stdio (${WAKENET_BASE_URL})`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
