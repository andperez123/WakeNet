"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Feed = {
  id: string;
  type: string;
  config: Record<string, unknown>;
  pollIntervalMinutes: number;
  lastPolledAt: string | null;
  enabled: boolean;
  createdAt: string;
};

export default function AdminFeedsPage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    type: "rss",
    url: "",
    owner: "",
    repo: "",
    path: "",
    token: "",
    branch: "",
    pathPrefix: "",
    state: "open" as "open" | "closed" | "all",
    labels: "",
    base: "",
    sitemapMode: "index" as "index" | "urls",
    include: "",
    exclude: "",
    marker: "",
    htmlMode: "both" as "etag" | "hash" | "both",
    pollIntervalMinutes: 15,
  });
  const [error, setError] = useState<string | null>(null);

  const base = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    fetch(`${base}/api/feeds`)
      .then((r) => r.json())
      .then((data) => {
        setFeeds(Array.isArray(data) ? data : []);
      })
      .catch(() => setFeeds([]))
      .finally(() => setLoading(false));
  }, [base]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    let config: Record<string, unknown> = {};
    if (form.type === "rss") {
      if (!form.url.trim()) {
        setError("URL is required");
        setCreating(false);
        return;
      }
      config = { url: form.url.trim() };
    } else if (form.type === "github_releases") {
      if (!form.owner.trim() || !form.repo.trim()) {
        setError("Owner and repo are required");
        setCreating(false);
        return;
      }
      config = { owner: form.owner.trim(), repo: form.repo.trim() };
    } else if (form.type === "http_json") {
      if (!form.url.trim()) {
        setError("URL is required");
        setCreating(false);
        return;
      }
      config = { url: form.url.trim() };
      if (form.path.trim()) config.path = form.path.trim();
    } else if (form.type === "webhook_inbox") {
      if (!form.token.trim()) {
        setError("Token is required");
        setCreating(false);
        return;
      }
      config = { token: form.token.trim() };
    } else if (form.type === "github_commits") {
      if (!form.owner.trim() || !form.repo.trim()) {
        setError("Owner and repo are required");
        setCreating(false);
        return;
      }
      config = { owner: form.owner.trim(), repo: form.repo.trim() };
      if (form.branch.trim()) config.branch = form.branch.trim();
      if (form.pathPrefix.trim()) config.pathPrefix = form.pathPrefix.trim();
    } else if (form.type === "github_pull_requests") {
      if (!form.owner.trim() || !form.repo.trim()) {
        setError("Owner and repo are required");
        setCreating(false);
        return;
      }
      config = { owner: form.owner.trim(), repo: form.repo.trim() };
      if (form.state) config.state = form.state;
      if (form.labels.trim()) config.labels = form.labels.split(",").map((s) => s.trim()).filter(Boolean);
      if (form.base.trim()) config.base = form.base.trim();
    } else if (form.type === "sitemap") {
      if (!form.url.trim()) {
        setError("Sitemap URL is required");
        setCreating(false);
        return;
      }
      config = { url: form.url.trim() };
      if (form.sitemapMode) config.mode = form.sitemapMode;
      if (form.include.trim()) config.include = form.include.split(",").map((s) => s.trim()).filter(Boolean);
      if (form.exclude.trim()) config.exclude = form.exclude.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (form.type === "html_change") {
      if (!form.url.trim()) {
        setError("URL is required");
        setCreating(false);
        return;
      }
      config = { url: form.url.trim() };
      if (form.marker.trim()) config.marker = form.marker.trim();
      if (form.htmlMode) config.mode = form.htmlMode;
    }
    try {
      const res = await fetch(`${base}/api/feeds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          config,
          pollIntervalMinutes: form.pollIntervalMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create feed");
      setFeeds((prev) => [data, ...prev]);
      setForm({
        type: "rss",
        url: "",
        owner: "",
        repo: "",
        path: "",
        token: "",
        branch: "",
        pathPrefix: "",
        state: "open",
        labels: "",
        base: "",
        sitemapMode: "index",
        include: "",
        exclude: "",
        marker: "",
        htmlMode: "both",
        pollIntervalMinutes: 15,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create feed");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Feeds</h1>
        <p className="mt-4 text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Feeds</h1>
      <p className="mt-1 text-gray-400">Add RSS, GitHub releases, or HTTP JSON feeds.</p>

      <form onSubmit={handleCreate} className="mt-8 rounded-xl border border-wakenet-border bg-wakenet-surface/50 p-6">
        <h2 className="font-display text-lg font-semibold text-white">Add feed</h2>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white"
            >
              <option value="rss">RSS / Atom</option>
              <option value="github_releases">GitHub Releases</option>
              <option value="http_json">HTTP JSON</option>
              <option value="webhook_inbox">Webhook Inbox</option>
              <option value="github_commits">GitHub Commits</option>
              <option value="github_pull_requests">GitHub Pull Requests</option>
              <option value="sitemap">Sitemap</option>
              <option value="html_change">HTML Change</option>
            </select>
          </div>
          {form.type === "rss" && (
            <div>
              <label className="block text-sm text-gray-400">Feed URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://example.com/feed.xml"
                className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
              />
            </div>
          )}
          {form.type === "github_releases" && (
            <>
              <div>
                <label className="block text-sm text-gray-400">Owner</label>
                <input
                  type="text"
                  value={form.owner}
                  onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                  placeholder="vercel"
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Repo</label>
                <input
                  type="text"
                  value={form.repo}
                  onChange={(e) => setForm((f) => ({ ...f, repo: e.target.value }))}
                  placeholder="next.js"
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
            </>
          )}
          {form.type === "http_json" && (
            <>
              <div>
                <label className="block text-sm text-gray-400">JSON URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://api.example.com/items"
                  className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Path to array (optional)</label>
                <input
                  type="text"
                  value={form.path}
                  onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
                  placeholder="items"
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
            </>
          )}
          {form.type === "webhook_inbox" && (
            <div>
              <label className="block text-sm text-gray-400">Ingest token (used in POST /api/ingest/webhook/:token)</label>
              <input
                type="text"
                value={form.token}
                onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
                placeholder="my-secret-token"
                className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
              />
            </div>
          )}
          {form.type === "github_commits" && (
            <>
              <div>
                <label className="block text-sm text-gray-400">Owner</label>
                <input
                  type="text"
                  value={form.owner}
                  onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                  placeholder="vercel"
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Repo</label>
                <input
                  type="text"
                  value={form.repo}
                  onChange={(e) => setForm((f) => ({ ...f, repo: e.target.value }))}
                  placeholder="next.js"
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Branch (optional)</label>
                <input
                  type="text"
                  value={form.branch}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  placeholder="main"
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Path prefix filter (optional)</label>
                <input
                  type="text"
                  value={form.pathPrefix}
                  onChange={(e) => setForm((f) => ({ ...f, pathPrefix: e.target.value }))}
                  placeholder="src/"
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
            </>
          )}
          {form.type === "github_pull_requests" && (
            <>
              <div>
                <label className="block text-sm text-gray-400">Owner</label>
                <input
                  type="text"
                  value={form.owner}
                  onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                  placeholder="vercel"
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Repo</label>
                <input
                  type="text"
                  value={form.repo}
                  onChange={(e) => setForm((f) => ({ ...f, repo: e.target.value }))}
                  placeholder="next.js"
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">State</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value as "open" | "closed" | "all" }))}
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white"
                >
                  <option value="open">open</option>
                  <option value="closed">closed</option>
                  <option value="all">all</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400">Labels filter (comma-separated, optional)</label>
                <input
                  type="text"
                  value={form.labels}
                  onChange={(e) => setForm((f) => ({ ...f, labels: e.target.value }))}
                  placeholder="bug,enhancement"
                  className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Base branch (optional)</label>
                <input
                  type="text"
                  value={form.base}
                  onChange={(e) => setForm((f) => ({ ...f, base: e.target.value }))}
                  placeholder="main"
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
            </>
          )}
          {form.type === "sitemap" && (
            <>
              <div>
                <label className="block text-sm text-gray-400">Sitemap URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/sitemap.xml"
                  className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Mode</label>
                <select
                  value={form.sitemapMode}
                  onChange={(e) => setForm((f) => ({ ...f, sitemapMode: e.target.value as "index" | "urls" }))}
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white"
                >
                  <option value="index">index (follow sitemap index)</option>
                  <option value="urls">urls only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400">Include URLs containing (comma, optional)</label>
                <input
                  type="text"
                  value={form.include}
                  onChange={(e) => setForm((f) => ({ ...f, include: e.target.value }))}
                  placeholder="/docs/"
                  className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Exclude URLs containing (comma, optional)</label>
                <input
                  type="text"
                  value={form.exclude}
                  onChange={(e) => setForm((f) => ({ ...f, exclude: e.target.value }))}
                  placeholder="/archive/"
                  className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
            </>
          )}
          {form.type === "html_change" && (
            <>
              <div>
                <label className="block text-sm text-gray-400">Page URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/changelog"
                  className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Marker: substring in HTML to hash (optional, not a CSS selector)</label>
                <input
                  type="text"
                  value={form.marker}
                  onChange={(e) => setForm((f) => ({ ...f, marker: e.target.value }))}
                  placeholder="release-notes"
                  className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Mode</label>
                <select
                  value={form.htmlMode}
                  onChange={(e) => setForm((f) => ({ ...f, htmlMode: e.target.value as "etag" | "hash" | "both" }))}
                  className="mt-1 w-full max-w-xs rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white"
                >
                  <option value="etag">etag only</option>
                  <option value="hash">hash only</option>
                  <option value="both">both</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm text-gray-400">Poll interval (minutes)</label>
            <input
              type="number"
              min={1}
              max={1440}
              value={form.pollIntervalMinutes}
              onChange={(e) => setForm((f) => ({ ...f, pollIntervalMinutes: Number(e.target.value) }))}
              className="mt-1 w-24 rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-wakenet-accent px-4 py-2 text-sm font-medium text-wakenet-bg hover:bg-wakenet-accent/90 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Add feed"}
          </button>
        </div>
      </form>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-white">All feeds ({feeds.length})</h2>
        <div className="mt-4 space-y-3">
          {feeds.length === 0 ? (
            <p className="text-gray-500">No feeds yet. Add one above.</p>
          ) : (
            feeds.map((feed) => (
              <div
                key={feed.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-wakenet-border bg-wakenet-surface/30 px-4 py-3"
              >
                <div>
                  <span className="font-mono text-sm text-wakenet-accent">{feed.type}</span>
                  <span className="ml-2 text-gray-400">
                    {feed.type === "rss" && "url" in feed.config && String(feed.config.url)}
                    {feed.type === "github_releases" &&
                      "owner" in feed.config &&
                      "repo" in feed.config &&
                      `${feed.config.owner}/${feed.config.repo}`}
                    {feed.type === "http_json" && "url" in feed.config && String(feed.config.url)}
                    {feed.type === "webhook_inbox" &&
                      ("token" in feed.config ? `token: ${String(feed.config.token).slice(0, 8)}…` : "secret: …")}
                    {feed.type === "github_commits" &&
                      "owner" in feed.config &&
                      "repo" in feed.config &&
                      `${feed.config.owner}/${feed.config.repo}`}
                    {feed.type === "github_pull_requests" &&
                      "owner" in feed.config &&
                      "repo" in feed.config &&
                      `${feed.config.owner}/${feed.config.repo}`}
                    {feed.type === "sitemap" && "url" in feed.config && String(feed.config.url)}
                    {feed.type === "html_change" && "url" in feed.config && String(feed.config.url)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    Last polled: {feed.lastPolledAt ? new Date(feed.lastPolledAt).toLocaleString() : "Never"}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const r = await fetch(`${base}/api/poll/${feed.id}`, { method: "POST" });
                        const d = await r.json();
                        alert(r.ok ? `Polled: ${d.eventsNew ?? 0} new, ${d.deliveriesCreated ?? 0} delivered` : d.error || "Failed");
                      } catch {
                        alert("Poll failed");
                      }
                    }}
                    className="text-xs text-wakenet-accent hover:underline"
                  >
                    Poll now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
