#!/usr/bin/env npx tsx
/**
 * WakeNet MCP Server
 *
 * Exposes WakeNet operations as MCP tools so any MCP-aware agent
 * (Claude, Cursor, OpenClaw, etc.) can create feeds, manage subscriptions,
 * browse events, and trigger polls — all without knowing curl commands.
 *
 * Environment variables:
 *   WAKENET_URL      — Base URL of your WakeNet instance (default: https://wake-net.vercel.app)
 *   WAKENET_API_KEY  — Bearer token for authenticated endpoints (optional if WakeNet is open)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const WAKENET_URL = (process.env.WAKENET_URL || "https://wake-net.vercel.app").replace(
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

  const res = await fetch(`${WAKENET_URL}${path}`, {
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
  "Pull delivered events for a pull-enabled subscription (no webhook needed)",
  {
    subscriptionId: z.string().uuid().describe("ID of the pull-enabled subscription"),
  },
  async ({ subscriptionId }) => {
    const { data } = await wakenetFetch(
      `/api/subscriptions/${subscriptionId}/pull`
    );
    return textResult(data);
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
  console.error(`WakeNet MCP Server running on stdio (${WAKENET_URL})`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
