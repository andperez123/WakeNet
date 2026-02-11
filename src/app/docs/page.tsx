import Link from "next/link";

export default function DocsPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="font-display text-3xl font-bold text-white">Documentation</h1>
      <p className="mt-2 text-gray-400">
        Get WakeNet running and deliver events to your agents.
      </p>
      <p className="mt-2 text-gray-400">
        WakeNet works out of the box with no API key. For a one-command agent path (install skill + smoke test, no UI, no keys), see <Link href="/docs/integrate" className="text-wakenet-accent hover:underline">Integrate</Link>. For all feed types (GitHub commits, PRs, webhook inbox, sitemap, HTML change) with copy-paste examples, see <Link href="/docs/feed-types" className="text-wakenet-accent hover:underline">Feed types</Link>.
      </p>

      <section id="quick-start" className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          Quick start (API)
        </h2>
        <ol className="mt-4 list-decimal list-inside space-y-2 text-gray-300">
          <li>
            <strong>Create a feed</strong> — RSS, GitHub releases, or HTTP JSON:
            <pre className="mt-2 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm overflow-x-auto">
{`POST /api/feeds
Content-Type: application/json

{ "type": "rss", "config": { "url": "https://hnrss.org/frontpage" } }`}
            </pre>
          </li>
          <li>
            <strong>Create a subscription</strong> — webhook URL + optional filters. Save the returned <code className="rounded bg-wakenet-border px-1">secret</code> for signature verification.
            <pre className="mt-2 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm overflow-x-auto">
{`POST /api/subscriptions
Content-Type: application/json

{ "feedId": "<feed-id>", "name": "My agent", "webhookUrl": "https://your-agent.com/webhook" }`}
            </pre>
          </li>
          <li>
            <strong>Poll</strong> — manually with <code className="rounded bg-wakenet-border px-1">POST /api/poll/[feedId]</code>, or let Inngest run every 5 minutes automatically.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          API reference
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="border-b border-wakenet-border text-left">
                <th className="py-2 pr-4">Method</th>
                <th className="py-2 pr-4">Path</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 pr-4">GET</td><td className="py-2 pr-4 font-mono">/api/feeds</td><td className="py-2">List feeds</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 pr-4">POST</td><td className="py-2 pr-4 font-mono">/api/feeds</td><td className="py-2">Create feed (type, config, pollIntervalMinutes)</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 pr-4">GET</td><td className="py-2 pr-4 font-mono">/api/feeds/[id]</td><td className="py-2">Get one feed</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 pr-4">GET</td><td className="py-2 pr-4 font-mono">/api/subscriptions</td><td className="py-2">List subscriptions</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 pr-4">POST</td><td className="py-2 pr-4 font-mono">/api/subscriptions</td><td className="py-2">Create subscription (feedId, name, webhookUrl, filters)</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 pr-4">GET</td><td className="py-2 pr-4 font-mono">/api/subscriptions/[id]/pull</td><td className="py-2">Pull delivery (when pullEnabled)</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 pr-4">GET</td><td className="py-2 pr-4 font-mono">/api/events</td><td className="py-2">List events (?feedId=, ?limit=)</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 pr-4">POST</td><td className="py-2 pr-4 font-mono">/api/poll/[feedId]</td><td className="py-2">Trigger poll for a feed</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          Webhook payload
        </h2>
        <p className="mt-4 text-gray-400">
          WakeNet POSTs to your webhook URL with a JSON body and <code className="rounded bg-wakenet-border px-1">x-wakenet-signature</code> (HMAC-SHA256 of the raw body using your subscription secret). Verify the signature before trusting the event.
        </p>
        <pre className="mt-2 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm overflow-x-auto text-gray-300">
{`{
  "id": "<delivery-id>",
  "feedId": "<feed-uuid>",
  "event": {
    "id": "<external-id>",
    "source": "...",
    "title": "...",
    "link": "...",
    "published": "...",
    "body": "...",
    "metadata": { ... }
  },
  "deliveredAt": "2026-02-10T..."
}`}
        </pre>
        <p className="mt-4 text-gray-400">
          See <Link href="/docs/clawdbot-example" className="text-wakenet-accent hover:underline">Clawdbot Example</Link> for copy-paste verification code.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          Admin &amp; Inngest
        </h2>
        <p className="mt-4 text-gray-400">
          <Link href="/admin" className="text-wakenet-accent hover:underline">/admin</Link> — dashboard, feeds, subscriptions, events. No auth in MVP.
        </p>
        <p className="mt-2 text-gray-400">
          Automatic polling runs every 5 minutes when Inngest is connected to your Vercel project. Sync your app at <code className="rounded bg-wakenet-border px-1">https://wake-net.vercel.app/api/inngest</code> and set <code className="rounded bg-wakenet-border px-1">INNGEST_SIGNING_KEY</code> in Vercel.
        </p>
      </section>
    </article>
  );
}
