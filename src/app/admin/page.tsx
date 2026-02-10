import Link from "next/link";
import { db } from "@/lib/db";
import { feeds, subscriptions, events } from "@/lib/db/schema";

async function getCounts() {
  if (!db) return { feeds: 0, subscriptions: 0, eventsCount: 0 };
  try {
    const [feedsList, subsList, eventsList] = await Promise.all([
      db.select({ id: feeds.id }).from(feeds),
      db.select({ id: subscriptions.id }).from(subscriptions),
      db.select({ id: events.id }).from(events),
    ]);
    return {
      feeds: feedsList.length,
      subscriptions: subsList.length,
      eventsCount: eventsList.length,
    };
  } catch {
    return { feeds: 0, subscriptions: 0, eventsCount: 0 };
  }
}

export default async function AdminDashboard() {
  const counts = await getCounts();
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-1 text-gray-400">Overview of your WakeNet instance.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/feeds"
          className="rounded-xl border border-wakenet-border bg-wakenet-surface/50 p-6 transition hover:border-wakenet-accent/40"
        >
          <div className="text-3xl font-bold text-wakenet-accent">
            {counts.feeds}
          </div>
          <div className="mt-1 text-sm text-gray-400">Feeds</div>
        </Link>
        <Link
          href="/admin/subscriptions"
          className="rounded-xl border border-wakenet-border bg-wakenet-surface/50 p-6 transition hover:border-wakenet-accent/40"
        >
          <div className="text-3xl font-bold text-wakenet-accent">
            {counts.subscriptions}
          </div>
          <div className="mt-1 text-sm text-gray-400">Subscriptions</div>
        </Link>
        <Link
          href="/admin/events"
          className="rounded-xl border border-wakenet-border bg-wakenet-surface/50 p-6 transition hover:border-wakenet-accent/40"
        >
          <div className="text-3xl font-bold text-wakenet-accent">{counts.eventsCount}</div>
          <div className="mt-1 text-sm text-gray-400">Events</div>
        </Link>
      </div>
      <div className="mt-10 rounded-xl border border-wakenet-border bg-wakenet-surface/30 p-6">
        <h2 className="font-display text-lg font-semibold text-white">
          Quick actions
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-400">
          <li>
            <Link href="/admin/feeds" className="text-wakenet-accent hover:underline">
              Add a feed
            </Link>{" "}
            (RSS, GitHub releases, or HTTP JSON)
          </li>
          <li>
            <Link href="/admin/subscriptions" className="text-wakenet-accent hover:underline">
              Add a subscription
            </Link>{" "}
            (webhook URL + optional filters)
          </li>
          <li>
            Polling runs automatically every 5 min via Inngest (when configured).
            Or trigger manually with{" "}
            <code className="rounded bg-wakenet-border px-1 py-0.5 font-mono text-xs">
              POST /api/poll/[feedId]
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
}
