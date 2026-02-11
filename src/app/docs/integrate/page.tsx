import Link from "next/link";

export default function IntegratePage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="font-display text-3xl font-bold text-white">
        Integrate your agent with WakeNet
      </h1>
      <p className="mt-2 text-gray-400">
        Step-by-step so your Clawdbot (or any agent) can use WakeNet: feeds, subscriptions, events via webhook or pull.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          Prerequisites
        </h2>
        <ul className="mt-4 list-disc list-inside text-gray-400 space-y-1">
          <li>Clawdbot or OpenClaw installed (e.g. skills dir <code className="rounded bg-wakenet-border px-1">~/clawd/Skills</code>).</li>
          <li>WakeNet repo on your machine so you can run the MCP server and copy the skill.</li>
          <li>If the WakeNet server has an API key set, you need that key for creating feeds/subscriptions and polling.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          1. Install the WakeNet skill
        </h2>
        <p className="mt-4 text-gray-400">
          One-command install via ClawHub (if published):
        </p>
        <pre className="mt-2 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono">
          clawhub install wakenet-listener
        </pre>
        <p className="mt-4 text-gray-400">
          Or copy from the repo (from WakeNet repo root):
        </p>
        <pre className="mt-2 rounded-lg border border-wakenet-border bg-wakenet-surface/50 p-4 text-sm text-gray-300 font-mono">
          cp -r skill/wakenet-listener ~/clawd/Skills/
        </pre>
        <p className="mt-2 text-gray-500 text-sm">
          Restart your agent, then run <code className="rounded bg-wakenet-border px-1">clawdbot skills list</code> — you should see <strong>wakenet-listener</strong>.
        </p>
      </section>

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
              <tr className="border-b border-wakenet-border/60"><td className="py-2 px-3 font-mono">WAKENET_API_KEY</td><td className="py-2 px-3">If server enforces API key</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 px-3 font-mono">WAKENET_SUBSCRIPTION_ID</td><td className="py-2 px-3">Pull mode only (after creating pull subscription)</td></tr>
              <tr className="border-b border-wakenet-border/60"><td className="py-2 px-3 font-mono">WAKENET_SUBSCRIPTION_SECRET</td><td className="py-2 px-3">Webhook mode only (from create-subscription, shown once)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          3. Add the WakeNet MCP server
        </h2>
        <p className="mt-4 text-gray-400">
          In your MCP config (e.g. <code className="rounded bg-wakenet-border px-1">~/clawd/mcp.json</code>):
        </p>
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
        <p className="mt-2 text-gray-500 text-sm">
          Replace the path and API key. Restart your agent so it loads the MCP server. You can then use <code className="rounded bg-wakenet-border px-1">wakenet_health</code>, <code className="rounded bg-wakenet-border px-1">wakenet_smoketest</code>, <code className="rounded bg-wakenet-border px-1">wakenet_create_feed</code>, <code className="rounded bg-wakenet-border px-1">wakenet_ensure_subscription</code>, <code className="rounded bg-wakenet-border px-1">wakenet_poll_feed</code>, <code className="rounded bg-wakenet-border px-1">wakenet_pull_events</code>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          4. Create a feed and subscription
        </h2>
        <p className="mt-4 text-gray-400">
          <strong>Admin:</strong> <a href="https://wake-net.vercel.app/admin" className="text-wakenet-accent hover:underline">wake-net.vercel.app/admin</a> — add a feed, then a subscription (webhook URL or pull-only). Save the <strong>secret</strong> (webhook) or <strong>subscription ID</strong> (pull).
        </p>
        <p className="mt-4 text-gray-400">
          <strong>MCP:</strong> Run <code className="rounded bg-wakenet-border px-1">wakenet_smoketest</code> to verify, then <code className="rounded bg-wakenet-border px-1">wakenet_create_feed</code> and <code className="rounded bg-wakenet-border px-1">wakenet_ensure_subscription</code> (or <code className="rounded bg-wakenet-border px-1">wakenet_create_subscription</code>). Use the returned <code className="rounded bg-wakenet-border px-1">id</code> and, for webhook, <code className="rounded bg-wakenet-border px-1">secret</code>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          5. Receive events
        </h2>
        <p className="mt-4 text-gray-400">
          <strong>Webhook:</strong> Expose a POST endpoint; verify <code className="rounded bg-wakenet-border px-1">x-wakenet-signature</code> with <code className="rounded bg-wakenet-border px-1">WAKENET_SUBSCRIPTION_SECRET</code> (raw body → HMAC-SHA256); then parse JSON. See <Link href="/docs/clawdbot-example" className="text-wakenet-accent hover:underline">Clawdbot example</Link>.
        </p>
        <p className="mt-4 text-gray-400">
          <strong>Pull:</strong> Set <code className="rounded bg-wakenet-border px-1">WAKENET_SUBSCRIPTION_ID</code> and call <code className="rounded bg-wakenet-border px-1">wakenet_pull_events</code> (or run <code className="rounded bg-wakenet-border px-1">npx tsx examples/pull-loop.ts</code> from the WakeNet repo). Use <code className="rounded bg-wakenet-border px-1">?after=nextCursor</code> for consume-once (only new events).
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-white border-b border-wakenet-border pb-2">
          6. Verify
        </h2>
        <ul className="mt-4 list-disc list-inside text-gray-400 space-y-1">
          <li><code className="rounded bg-wakenet-border px-1">clawdbot skills list</code> shows wakenet-listener.</li>
          <li>Run <code className="rounded bg-wakenet-border px-1">wakenet_health</code> and <code className="rounded bg-wakenet-border px-1">wakenet_smoketest</code>.</li>
          <li>Poll a feed and pull (or send a test webhook) to confirm events flow.</li>
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-wakenet-border bg-wakenet-surface/30 p-6">
        <h2 className="font-display text-lg font-semibold text-white">Quick reference</h2>
        <ul className="mt-2 text-sm text-gray-400 space-y-1">
          <li><strong>Install skill:</strong> <code className="rounded bg-wakenet-border px-1">clawhub install wakenet-listener</code> or copy <code className="rounded bg-wakenet-border px-1">skill/wakenet-listener</code> into your skills dir.</li>
          <li><strong>Env:</strong> WAKENET_BASE_URL, WAKENET_API_KEY, WAKENET_SUBSCRIPTION_ID (pull), WAKENET_SUBSCRIPTION_SECRET (webhook).</li>
          <li><strong>Create feed:</strong> Admin or <code className="rounded bg-wakenet-border px-1">wakenet_create_feed</code> (payload: type + config.url for RSS).</li>
          <li><strong>Create subscription:</strong> Admin or <code className="rounded bg-wakenet-border px-1">wakenet_ensure_subscription</code> / <code className="rounded bg-wakenet-border px-1">wakenet_create_subscription</code> (feedId, name, pullEnabled top-level).</li>
          <li><strong>Receive:</strong> Webhook (verify signature) or pull (<code className="rounded bg-wakenet-border px-1">/api/subscriptions/:id/pull</code> or <code className="rounded bg-wakenet-border px-1">wakenet_pull_events</code>).</li>
        </ul>
      </section>

      <p className="mt-10">
        <Link href="/docs" className="text-wakenet-accent hover:underline">← Back to Docs</Link>
      </p>
    </article>
  );
}
