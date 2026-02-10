"use client";

import { useEffect, useState } from "react";

type Feed = { id: string; type: string; config: Record<string, unknown> };
type Sub = {
  id: string;
  feedId: string;
  name: string;
  webhookUrl: string | null;
  pullEnabled: boolean;
  enabled: boolean;
  createdAt: string;
};

export default function AdminSubscriptionsPage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ feedId: "", name: "", webhookUrl: "" });
  const [error, setError] = useState<string | null>(null);

  const base = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    Promise.all([fetch(`${base}/api/feeds`).then((r) => r.json()), fetch(`${base}/api/subscriptions`).then((r) => r.json())])
      .then(([feedsData, subsData]) => {
        setFeeds(Array.isArray(feedsData) ? feedsData : []);
        setSubs(Array.isArray(subsData) ? subsData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [base]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.feedId || !form.name.trim()) {
      setError("Feed and name are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${base}/api/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedId: form.feedId,
          name: form.name.trim(),
          webhookUrl: form.webhookUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create subscription");
      setSubs((prev) => [data, ...prev]);
      setForm({ feedId: "", name: "", webhookUrl: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subscription");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Subscriptions</h1>
        <p className="mt-4 text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Subscriptions</h1>
      <p className="mt-1 text-gray-400">Deliver feed events to a webhook URL.</p>

      <form onSubmit={handleCreate} className="mt-8 rounded-xl border border-wakenet-border bg-wakenet-surface/50 p-6">
        <h2 className="font-display text-lg font-semibold text-white">Add subscription</h2>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400">Feed</label>
            <select
              value={form.feedId}
              onChange={(e) => setForm((f) => ({ ...f, feedId: e.target.value }))}
              className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white"
            >
              <option value="">Select a feed</option>
              {feeds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.type} – {f.id.slice(0, 8)}…
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="My agent"
              className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400">Webhook URL</label>
            <input
              type="url"
              value={form.webhookUrl}
              onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
              placeholder="https://your-agent.com/webhook"
              className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-wakenet-accent px-4 py-2 text-sm font-medium text-wakenet-bg hover:bg-wakenet-accent/90 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Add subscription"}
          </button>
        </div>
      </form>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-white">All subscriptions ({subs.length})</h2>
        <div className="mt-4 space-y-3">
          {subs.length === 0 ? (
            <p className="text-gray-500">No subscriptions yet.</p>
          ) : (
            subs.map((sub) => (
              <div
                key={sub.id}
                className="rounded-lg border border-wakenet-border bg-wakenet-surface/30 px-4 py-3"
              >
                <div className="font-medium text-white">{sub.name}</div>
                <div className="mt-1 text-sm text-gray-400">
                  Feed: {sub.feedId.slice(0, 8)}… · Webhook: {sub.webhookUrl || "—"}
                </div>
                <div className="mt-1 text-xs text-gray-500">Created {new Date(sub.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
