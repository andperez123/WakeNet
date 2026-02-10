"use client";

import { useEffect, useState } from "react";

type EventRow = {
  id: string;
  feedId: string;
  externalId: string;
  contentHash: string;
  normalized: { title?: string; source?: string; link?: string };
  score: number;
  createdAt: string;
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedId, setFeedId] = useState("");

  const base = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    const url = feedId ? `${base}/api/events?feedId=${feedId}&limit=50` : `${base}/api/events?limit=50`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [base, feedId]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Events</h1>
      <p className="mt-1 text-gray-400">Recent normalized events (deduplicated).</p>

      <div className="mt-6">
        <label className="block text-sm text-gray-400">Filter by feed ID (optional)</label>
        <input
          type="text"
          value={feedId}
          onChange={(e) => setFeedId(e.target.value)}
          placeholder="Leave empty for all"
          className="mt-1 w-full max-w-md rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
        />
      </div>

      {loading ? (
        <p className="mt-8 text-gray-400">Loading…</p>
      ) : events.length === 0 ? (
        <p className="mt-8 text-gray-500">No events yet. Add a feed and run a poll.</p>
      ) : (
        <div className="mt-8 space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-lg border border-wakenet-border bg-wakenet-surface/30 px-4 py-3"
            >
              <div className="font-medium text-white">{ev.normalized?.title ?? ev.externalId}</div>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-400">
                <span>Source: {ev.normalized?.source ?? "—"}</span>
                {ev.normalized?.link && (
                  <a href={ev.normalized.link} target="_blank" rel="noopener noreferrer" className="text-wakenet-accent hover:underline">
                    Link
                  </a>
                )}
                <span>{new Date(ev.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1 font-mono text-xs text-gray-500">ID: {ev.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
