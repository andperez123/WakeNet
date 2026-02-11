import Link from "next/link";

export default function IntegratePage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="font-display text-3xl font-bold text-white">
        Integrate your agent with WakeNet
      </h1>
      <p className="mt-2 text-gray-400">
        WakeNet lets agents wake only when something changes. Instead of polling feeds, rebuilding context, and burning tokens, your agent subscribes to external signals (RSS, GitHub, HTTP) and reacts only to new events.
      </p>
      <p className="mt-2 text-gray-400">
        This guide connects Clawdbot (or any MCP-capable agent) to WakeNet using feeds, subscriptions, and event delivery via pull or webhook.
      </p>

      {/* Why agents use WakeNet */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          Why agents use WakeNet
        </h2>
        <div className="mt-4 space-y-4 text-gray-400">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mt-4">The problem</h3>
            <p className="mt-1">Most agents poll on a timer, re-read the same data, and rebuild context every loop. That means wasted tokens, idle inference, and delayed reactions.</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-300 mt-4">The WakeNet model</h3>
            <p className="mt-1">WakeNet polls upstream sources for you, emits only new events, supports consume-once cursors, and delivers minimal structured payloads. Your agent reasons only when an event happens.</p>
          </div>
        </div>
      </section>

      {/* Token optimization */}
      <section className="mt-10 rounded-xl border border-wakenet-border bg-wakenet-surface/30 p-6">
        <h2 className="font-display text-lg font-semibold text-white">Token optimization (rough math)</h2>
        <p className="mt-2 text-sm text-gray-400">Example: RSS feed with ~50 new items/day, ~300 tokens/item.</p>
        <ul className="mt-3 text-sm text-gray-400 space-y-1 list-disc list-inside">
          <li><strong className="text-gray-300">Without WakeNet:</strong> Poll every 5 min (288 polls/day), ~300 tokens per scan → ~86,000+ tokens/day.</li>
          <li><strong className="text-gray-300">With WakeNet (pull + cursor):</strong> Agent only receives new items → ~15,000 tokens/day.</li>
        </ul>
        <p className="mt-2 text-sm text-gray-400">That’s ~80%+ token reduction, with faster reaction time and cleaner logic.</p>
      </section>

      {/* Prerequisites */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          Prerequisites
        </h2>
        <ul className="mt-4 list-disc list-inside text-gray-400 space-y-1">
          <li>Clawdbot or OpenClaw installed (e.g. skills dir <code className="rounded bg-wakenet-border px-1">~/clawd/Skills</code>).</li>
          <li>WakeNet repo on your machine (for MCP server and examples).</li>
          <li>WakeNet API key if your server enforces one.</li>
        </ul>
      </section>

      {/* Step 1 */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          1. Install the WakeNet skill
        </h2>
        <p className="mt-4 text-gray-400">Option A — one command (ClawHub):</p>
        <pre className="mt-2 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono">
          clawhub install wakenet-listener
        </pre>
        <p className="mt-4 text-gray-400">Option B — copy from repo (from WakeNet repo root):</p>
        <pre className="mt-2 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono">
          cp -r skill/wakenet-listener ~/clawd/Skills/
        </pre>
        <p className="mt-2 text-gray-500 text-sm">Restart your agent, then run <code className="rounded bg-wakenet-border px-1">clawdbot skills list</code> — you should see <strong>wakenet-listener</strong>.</p>
      </section>

      {/* Step 2 */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          2. Set environment variables
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm text-gray-400 border border-wakenet-border rounded-lg">
            <thead>
              <tr className="border-b border-wakenet-border">
                <th className="text-left py-2 px-3">Variable</th>
                <th className="text-left py-2 px-3">When</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 px-3 font-mono">WAKENET_BASE_URL</td><td className="py-2 px-3">Optional (default: https://wake-net.vercel.app)</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 px-3 font-mono">WAKENET_API_KEY</td><td className="py-2 px-3">Required if API key is enforced</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 px-3 font-mono">WAKENET_SUBSCRIPTION_ID</td><td className="py-2 px-3">Pull mode only</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 px-3 font-mono">WAKENET_SUBSCRIPTION_SECRET</td><td className="py-2 px-3">Webhook mode only (shown once)</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-gray-500 text-sm">Set these in your MCP config, agent runtime env, or <code className="rounded bg-wakenet-border px-1">.env</code> if supported.</p>
      </section>

      {/* Step 3 */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          3. Add the WakeNet MCP server
        </h2>
        <p className="mt-4 text-gray-400">In your MCP config (e.g. <code className="rounded bg-wakenet-border px-1">~/clawd/mcp.json</code>):</p>
        <pre className="mt-2 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">
{`{
  "mcpServers": {
    "wakenet": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/WakeNet/mcp-server/index.ts"],
      "env": {
        "WAKENET_BASE_URL": "https://wake-net.vercel.app",
        "WAKENET_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}`}
        </pre>
        <p className="mt-2 text-gray-500 text-sm">Restart your agent so it loads the MCP server.</p>
        <p className="mt-2 text-gray-500 text-sm">Available tools: <code className="rounded bg-wakenet-border px-1">wakenet_health</code>, <code className="rounded bg-wakenet-border px-1">wakenet_smoketest</code>, <code className="rounded bg-wakenet-border px-1">wakenet_create_feed</code>, <code className="rounded bg-wakenet-border px-1">wakenet_ensure_subscription</code>, <code className="rounded bg-wakenet-border px-1">wakenet_poll_feed</code>, <code className="rounded bg-wakenet-border px-1">wakenet_pull_events</code>.</p>
      </section>

      {/* Step 4 */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          4. Create a feed and subscription
        </h2>
        <p className="mt-4 text-gray-400"><strong className="text-gray-300">Option A — Admin UI:</strong> Go to <a href="https://wake-net.vercel.app/admin" className="text-wakenet-accent hover:underline">wake-net.vercel.app/admin</a>. Create a feed, then a subscription (webhook or pull-only). Save the <strong>secret</strong> (webhook) or <strong>subscription ID</strong> (pull).</p>
        <p className="mt-4 text-gray-400"><strong className="text-gray-300">Option B — MCP (recommended):</strong> Run <code className="rounded bg-wakenet-border px-1">wakenet_smoketest</code>, then <code className="rounded bg-wakenet-border px-1">wakenet_create_feed</code> and <code className="rounded bg-wakenet-border px-1">wakenet_ensure_subscription</code>. This avoids duplicates and returns existing subscriptions when re-run.</p>
      </section>

      {/* Step 5 */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          5. Receive events (choose one)
        </h2>
        <div className="mt-4 space-y-4 text-gray-400">
          <div>
            <h3 className="text-sm font-medium text-gray-300">Webhook mode</h3>
            <p className="mt-1">Expose a POST endpoint. Verify <code className="rounded bg-wakenet-border px-1">x-wakenet-signature</code>: raw body → HMAC-SHA256, compare with <code className="rounded bg-wakenet-border px-1">WAKENET_SUBSCRIPTION_SECRET</code>. Parse JSON and act. See the <Link href="/docs/clawdbot-example" className="text-wakenet-accent hover:underline">Clawdbot example</Link> for a working verifier.</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-300">Pull mode (consume-once)</h3>
            <p className="mt-1">Set <code className="rounded bg-wakenet-border px-1">WAKENET_SUBSCRIPTION_ID</code> and call <code className="rounded bg-wakenet-border px-1">wakenet_pull_events</code>. WakeNet returns:</p>
            <pre className="mt-2 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">
{`{
  "items": [...],
  "nextCursor": "2026-02-11T00:13:32.048Z"
}`}
            </pre>
            <p className="mt-2">Send <code className="rounded bg-wakenet-border px-1">?after=nextCursor</code> on the next call to receive only new events. Clean, deterministic consume-once behavior with no deduping logic.</p>
          </div>
        </div>
      </section>

      {/* Step 6 */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          6. Verify end-to-end
        </h2>
        <ul className="mt-4 list-disc list-inside text-gray-400 space-y-1">
          <li><code className="rounded bg-wakenet-border px-1">clawdbot skills list</code> → shows wakenet-listener.</li>
          <li>Run <code className="rounded bg-wakenet-border px-1">wakenet_health</code> and <code className="rounded bg-wakenet-border px-1">wakenet_smoketest</code>.</li>
          <li>Poll or trigger a feed; confirm your agent reacts.</li>
        </ul>
      </section>

      {/* Why RSS + event triggers matter */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          Why RSS + event triggers matter for agents
        </h2>
        <p className="mt-4 text-gray-400">WakeNet turns RSS into decision triggers, not content blobs.</p>
        <p className="mt-2 text-gray-400">Common patterns: research agents wake on new papers; dev agents on GitHub releases; market agents on policy/news; content agents on new posts. Instead of “check everything every N minutes,” you get “wake me when something changes.”</p>
      </section>

      {/* Quick reference */}
      <section className="mt-10 rounded-xl border border-wakenet-border bg-wakenet-surface/30 p-6">
        <h2 className="font-display text-lg font-semibold text-white">Quick reference</h2>
        <ul className="mt-2 text-sm text-gray-400 space-y-1">
          <li><strong className="text-gray-300">Install:</strong> <code className="rounded bg-wakenet-border px-1">clawhub install wakenet-listener</code> or copy <code className="rounded bg-wakenet-border px-1">skill/wakenet-listener</code>.</li>
          <li><strong className="text-gray-300">Env:</strong> WAKENET_BASE_URL, WAKENET_API_KEY, WAKENET_SUBSCRIPTION_ID (pull), WAKENET_SUBSCRIPTION_SECRET (webhook).</li>
          <li><strong className="text-gray-300">Create:</strong> Feed = type + config.url. Subscription = feedId, name, pullEnabled (top-level).</li>
          <li><strong className="text-gray-300">Receive:</strong> Webhook (signature verify) or pull (<code className="rounded bg-wakenet-border px-1">wakenet_pull_events</code>, cursor-based).</li>
        </ul>
      </section>

      <p className="mt-10">
        <Link href="/docs" className="text-wakenet-accent hover:underline">← Back to Docs</Link>
      </p>
    </article>
  );
}
