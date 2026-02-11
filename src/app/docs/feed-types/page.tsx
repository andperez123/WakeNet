import Link from "next/link";

export default function FeedTypesPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="font-display text-3xl font-bold text-white">
        Feed types
      </h1>
      <p className="mt-2 text-gray-400">
        WakeNet supports eight feed types. The first three (RSS, GitHub Releases, HTTP JSON) are in the <Link href="/docs#quick-start" className="text-wakenet-accent hover:underline">Quick start</Link>. Below: copy-paste config examples and agent patterns for the rest.
      </p>

      {/* github_commits */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          github_commits
        </h2>
        <p className="mt-4 text-gray-400">
          Wake on new commits (not just releases). Optional <code className="rounded bg-wakenet-border px-1">branch</code> (defaults to repo default) and <code className="rounded bg-wakenet-border px-1">pathPrefix</code> to only include commits touching a directory.
        </p>
        <pre className="mt-4 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`POST /api/feeds
{ "type": "github_commits", "config": { "owner": "vercel", "repo": "next.js", "branch": "canary", "pathPrefix": "packages/" }, "pollIntervalMinutes": 30 }`}
        </pre>
        <p className="mt-3 text-sm font-medium text-gray-300">Agent patterns</p>
        <ul className="mt-1 text-gray-400 text-sm space-y-1 list-disc list-inside">
          <li><strong>CI/CD</strong> — Wake when something lands on main; run tests or deploy.</li>
          <li><strong>Dependency monitoring</strong> — Watch a vendor repo; wake when <code className="rounded bg-wakenet-border px-1">pathPrefix: "src/"</code> changes.</li>
        </ul>
      </section>

      {/* github_pull_requests */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          github_pull_requests
        </h2>
        <p className="mt-4 text-gray-400">
          Wake on PR lifecycle: opened, updated, merged, closed. Filter by <code className="rounded bg-wakenet-border px-1">state</code> (open | closed | all), <code className="rounded bg-wakenet-border px-1">labels</code>, and <code className="rounded bg-wakenet-border px-1">base</code> branch.
        </p>
        <pre className="mt-4 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`POST /api/feeds
{ "type": "github_pull_requests", "config": { "owner": "vercel", "repo": "next.js", "state": "open", "labels": ["needs-review"], "base": "main" }, "pollIntervalMinutes": 15 }`}
        </pre>
        <p className="mt-3 text-sm font-medium text-gray-300">Agent patterns</p>
        <ul className="mt-1 text-gray-400 text-sm space-y-1 list-disc list-inside">
          <li><strong>Review bots</strong> — Wake on PRs labeled <code className="rounded bg-wakenet-border px-1">needs-review</code>; summarize or triage.</li>
          <li><strong>Release prep / changelog</strong> — Wake on merged PRs to main; draft release notes or update changelog.</li>
        </ul>
      </section>

      {/* webhook_inbox */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          webhook_inbox
        </h2>
        <p className="mt-4 text-gray-400">
          No polling. Events arrive via <code className="rounded bg-wakenet-border px-1">POST /api/ingest/webhook/:token</code>. Use a unique <code className="rounded bg-wakenet-border px-1">token</code> per feed so WakeNet can route to the right subscriptions.
        </p>
        <pre className="mt-4 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`# Create the feed (token must be unique across webhook_inbox feeds)
POST /api/feeds
{ "type": "webhook_inbox", "config": { "token": "my-stripe-events" } }

# Send events (no API key; token in path is the only auth)
POST /api/ingest/webhook/my-stripe-events
Content-Type: application/json
{ "id": "ev_123", "source": "stripe", "title": "Payment received", "link": "https://...", "metadata": { "amount": 1000 } }

# Or an array of events
[{ "id": "ev_1", "source": "zapier", "title": "New lead" }, { "id": "ev_2", ... }]`}
        </pre>
        <p className="mt-3 text-sm font-medium text-gray-300">Agent patterns</p>
        <ul className="mt-1 text-gray-400 text-sm space-y-1 list-disc list-inside">
          <li><strong>Stripe / payments</strong> — Forward webhooks to WakeNet; agent wakes on payment or subscription events.</li>
          <li><strong>Universal wake bus</strong> — Zapier, internal services, or any producer POST to WakeNet; one place for agents to subscribe.</li>
        </ul>
      </section>

      {/* sitemap */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          sitemap
        </h2>
        <p className="mt-4 text-gray-400">
          Detect new or changed pages from a sitemap XML. Supports sitemap index (follows child sitemaps). Optional <code className="rounded bg-wakenet-border px-1">include</code> / <code className="rounded bg-wakenet-border px-1">exclude</code> (substring match on URL). <code className="rounded bg-wakenet-border px-1">lastmod</code> is used when present so “page changed” triggers.
        </p>
        <pre className="mt-4 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`POST /api/feeds
{ "type": "sitemap", "config": { "url": "https://docs.example.com/sitemap.xml", "mode": "index", "include": ["/docs/"], "exclude": ["/archive/"] }, "pollIntervalMinutes": 60 }`}
        </pre>
        <p className="mt-3 text-sm font-medium text-gray-300">Agent patterns</p>
        <ul className="mt-1 text-gray-400 text-sm space-y-1 list-disc list-inside">
          <li><strong>Docs changed</strong> — Wake when docs or changelog URLs appear or change; sync internal KB or notify writers.</li>
          <li><strong>Knowledge updates</strong> — Watch a product sitemap; agent re-indexes or answers from updated pages.</li>
        </ul>
      </section>

      {/* html_change */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          html_change
        </h2>
        <p className="mt-4 text-gray-400">
          Detect meaningful change on a single page when there’s no RSS or JSON. Uses ETag / Last-Modified and optionally a content hash. <code className="rounded bg-wakenet-border px-1">mode</code>: <code className="rounded bg-wakenet-border px-1">etag</code> | <code className="rounded bg-wakenet-border px-1">hash</code> | <code className="rounded bg-wakenet-border px-1">both</code>. Optional <code className="rounded bg-wakenet-border px-1">marker</code>: a substring in the HTML to hash (e.g. a section), not a CSS selector.
        </p>
        <pre className="mt-4 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`POST /api/feeds
{ "type": "html_change", "config": { "url": "https://example.com/changelog", "marker": "release-notes", "mode": "both" }, "pollIntervalMinutes": 60 }`}
        </pre>
        <p className="mt-3 text-sm font-medium text-gray-300">Agent patterns</p>
        <ul className="mt-1 text-gray-400 text-sm space-y-1 list-disc list-inside">
          <li><strong>Changelog / release notes</strong> — Wake when the page (or a marked section) changes; parse and summarize.</li>
          <li><strong>Arbitrary page</strong> — Turn any “random web page” into a wake trigger when no feed or API exists.</li>
        </ul>
      </section>

      <p className="mt-10">
        <Link href="/docs" className="text-wakenet-accent hover:underline">← Back to Docs</Link>
      </p>
    </article>
  );
}
