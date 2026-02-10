import Link from "next/link";

export default function Home() {
  return (
    <div className="relative bg-grid min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-wakenet-border/80 bg-wakenet-bg/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-display text-xl font-semibold tracking-tight text-white">
            WakeNet
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="#how-it-works"
              className="text-sm text-gray-400 transition hover:text-wakenet-accent"
            >
              How it works
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-gray-400 transition hover:text-wakenet-accent"
            >
              Pricing
            </Link>
            <Link
              href="#cta"
              className="rounded-lg bg-wakenet-accent px-4 py-2 text-sm font-medium text-wakenet-bg transition hover:bg-wakenet-accent/90"
            >
              Install WakeNet
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative px-6 pt-20 pb-28 md:pt-28 md:pb-36 overflow-hidden">
          <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34, 211, 238, 0.12), transparent 70%)",
              }}
            />
          <div className="mx-auto max-w-4xl text-center relative">
            <div className="stagger">
              <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                <span className="text-gradient">WakeNet</span>
              </h1>
              <p className="mt-4 text-xl text-wakenet-accent md:text-2xl">
                Event-Driven Wake Infrastructure for AI Agents
              </p>
              <p className="mt-8 text-lg leading-relaxed text-gray-400 max-w-2xl mx-auto">
                Agents shouldn&apos;t poll.
                <br />
                <span className="text-white font-medium">
                  Agents should sleep until woken.
                </span>
              </p>
              <p className="mt-6 text-gray-500 max-w-xl mx-auto">
                WakeNet replaces cron jobs and polling loops with push-based
                signals that wake your agents only when something worth acting on
                happens.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="#cta"
                  className="inline-flex items-center gap-2 rounded-lg bg-wakenet-accent px-5 py-3 text-sm font-semibold text-wakenet-bg transition hover:bg-wakenet-accent/90 glow-accent"
                >
                  Install WakeNet
                  <span className="text-wakenet-bg">→</span>
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-wakenet-border bg-wakenet-surface/50 px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-wakenet-accent/50 hover:text-white"
                >
                  How it works
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section
          id="problem"
          className="border-y border-wakenet-border/60 bg-wakenet-surface/30 px-6 py-20"
        >
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              The Problem
            </h2>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Most AI agents waste time and tokens doing nothing.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-wakenet-border bg-wakenet-bg/80 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-wakenet-muted">
                  They do
                </h3>
                <ul className="mt-3 space-y-2 text-gray-400">
                  <li>• Poll APIs on a schedule</li>
                  <li>• Scrape feeds that haven&apos;t changed</li>
                  <li>• Re-run logic just to decide &quot;no action&quot;</li>
                </ul>
              </div>
              <div className="rounded-xl border border-wakenet-border bg-wakenet-bg/80 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-wakenet-muted">
                  This leads to
                </h3>
                <ul className="mt-3 space-y-2 text-gray-400">
                  <li>• Runaway token costs</li>
                  <li>• Delayed reactions</li>
                  <li>• Brittle, duplicated logic</li>
                </ul>
              </div>
            </div>
            <p className="mt-8 text-center font-mono text-lg text-wakenet-accent">
              Polling is the bottleneck.
            </p>
          </div>
        </section>

        {/* The WakeNet Solution */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              The WakeNet Solution
            </h2>
            <p className="mt-4 text-lg text-gray-400 leading-relaxed">
              WakeNet is a push-based signal layer for AI agents.
            </p>
            <p className="mt-2 text-gray-400 leading-relaxed">
              It continuously monitors sources, filters noise, and delivers
              structured events directly to your agent when action is required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-wakenet-accent/30 bg-wakenet-accent/10 px-4 py-2 font-mono text-sm text-wakenet-accent">
                No polling
              </span>
              <span className="rounded-full border border-wakenet-accent/30 bg-wakenet-accent/10 px-4 py-2 font-mono text-sm text-wakenet-accent">
                No cron
              </span>
              <span className="rounded-full border border-wakenet-accent/30 bg-wakenet-accent/10 px-4 py-2 font-mono text-sm text-wakenet-accent">
                No wasted execution
              </span>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="border-y border-wakenet-border/60 bg-wakenet-surface/30 px-6 py-20"
        >
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              How It Works
            </h2>
            <div className="mt-10 space-y-8">
              <div className="flex gap-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wakenet-accent/20 font-mono text-sm font-bold text-wakenet-accent">
                  1
                </span>
                <div>
                  <h3 className="font-semibold text-white">
                    WakeNet watches sources
                  </h3>
                  <p className="mt-1 text-gray-400">
                    RSS, GitHub releases, APIs, onchain events (MVP scope)
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wakenet-accent/20 font-mono text-sm font-bold text-wakenet-accent">
                  2
                </span>
                <div>
                  <h3 className="font-semibold text-white">
                    Signals are normalized
                  </h3>
                  <p className="mt-1 text-gray-400">
                    Deduplicated • Filtered • Scored for relevance
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wakenet-accent/20 font-mono text-sm font-bold text-wakenet-accent">
                  3
                </span>
                <div>
                  <h3 className="font-semibold text-white">
                    Agents are woken
                  </h3>
                  <p className="mt-1 text-gray-400">
                    Event pushed to your Clawdbot • Agent runs exactly once
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wakenet-accent/20 font-mono text-sm font-bold text-wakenet-accent">
                  4
                </span>
                <div>
                  <h3 className="font-semibold text-white">Agent sleeps again</h3>
                </div>
              </div>
            </div>
            <p className="mt-12 text-center font-mono text-lg text-wakenet-accent">
              Wake → Act → Sleep.
            </p>
          </div>
        </section>

        {/* Why Clawdbots Use WakeNet */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              Why Clawdbots Use WakeNet
            </h2>
            <p className="mt-4 text-gray-400 leading-relaxed">
              WakeNet maps cleanly to how Clawdbots are built: session-based,
              trigger-driven, long-running.
            </p>
            <p className="mt-2 text-gray-400 leading-relaxed">
              It acts as a drop-in replacement for cron + polling, without
              changing your agent logic.
            </p>
          </div>
        </section>

        {/* Measurable Benefits */}
        <section className="border-y border-wakenet-border/60 bg-wakenet-surface/30 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              Measurable Benefits
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "80–95% fewer agent invocations",
                "Order-of-magnitude token savings",
                "Faster reaction times",
                "Fewer false triggers",
                "Lower infrastructure cost",
                "Centralized monitoring across agents",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-wakenet-border/60 bg-wakenet-bg/60 px-4 py-3 text-gray-300"
                >
                  <span className="text-wakenet-green">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-center text-wakenet-accent">
              One agent&apos;s savings can cover the entire system.
            </p>
          </div>
        </section>

        {/* Example Use Cases */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              Example Use Cases
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: "Dev agents",
                  desc: "React to GitHub releases, detect breaking changes or security patches",
                },
                {
                  title: "Onchain agents",
                  desc: "Wake on contract events, monitor liquidity or price thresholds",
                },
                {
                  title: "Ops agents",
                  desc: "React to incidents or status changes",
                },
                {
                  title: "Growth agents",
                  desc: "Wake on mentions, launches, or keyword triggers",
                },
              ].map((useCase) => (
                <div
                  key={useCase.title}
                  className="rounded-xl border border-wakenet-border bg-wakenet-surface/50 p-6"
                >
                  <h3 className="font-semibold text-white">{useCase.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{useCase.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why WakeNet Isn't "Just Feeds" */}
        <section className="border-y border-wakenet-border/60 bg-wakenet-surface/30 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              Why WakeNet Isn&apos;t &quot;Just Feeds&quot;
            </h2>
            <p className="mt-4 text-gray-400">
              Feeds deliver raw data. WakeNet delivers decisions.
            </p>
            <ul className="mt-6 space-y-2 text-gray-300">
              <li>• Deterministic schemas</li>
              <li>• Deduplication guarantees</li>
              <li>• Agent-ready payloads</li>
              <li>• Push-based delivery</li>
            </ul>
            <p className="mt-8 font-mono text-wakenet-accent">
              Agents don&apos;t parse noise. They act on signals.
            </p>
          </div>
        </section>

        {/* Built for Scale */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              Built for Scale
            </h2>
            <ul className="mt-4 space-y-2 text-gray-400">
              <li>• No LLM inference</li>
              <li>• No embeddings</li>
              <li>• No polling storms</li>
              <li>• Shared monitoring across agents</li>
            </ul>
            <p className="mt-6 text-gray-400">
              Scales to: tens of thousands of feeds, hundreds of thousands of
              events/day, predictable linear infrastructure costs.
            </p>
          </div>
        </section>

        {/* Integration */}
        <section className="border-y border-wakenet-border/60 bg-wakenet-surface/30 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              Integration
            </h2>
            <ul className="mt-6 space-y-2 text-gray-300">
              <li>• Webhook delivery (push)</li>
              <li>• Pull-based queues (fallback)</li>
              <li>• Deterministic schemas</li>
              <li>• HMAC-signed payloads</li>
              <li>• Clawdbot example skill included</li>
            </ul>
            <p className="mt-8 font-mono text-wakenet-accent">
              Install once. Reuse everywhere.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              Pricing (Early)
            </h2>
            <ul className="mt-6 space-y-2 text-gray-300">
              <li>• Free tier for limited feeds</li>
              <li>• Usage-based pricing as you scale</li>
              <li>• No per-agent tax</li>
              <li>• No token usage</li>
            </ul>
            <p className="mt-8 text-wakenet-accent">
              You pay for signals — not wasted thought.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section
          id="cta"
          className="border-t border-wakenet-border bg-wakenet-surface/50 px-6 py-24"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              Wake your agent.
            </h2>
            <p className="mt-2 text-gray-400">
              Replace polling. Let it sleep until it matters.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-lg bg-wakenet-accent px-5 py-3 text-sm font-semibold text-wakenet-bg transition hover:bg-wakenet-accent/90"
              >
                Install WakeNet
                <span>→</span>
              </Link>
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-wakenet-border px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-wakenet-accent/50 hover:text-white"
              >
                View Docs
              </Link>
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-wakenet-border px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-wakenet-accent/50 hover:text-white"
              >
                See Clawdbot Example
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-wakenet-border px-6 py-8">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <span className="font-display text-sm font-medium text-gray-500">
            WakeNet
          </span>
          <span className="text-sm text-gray-600">
            Event-driven wake infrastructure for AI agents
          </span>
        </div>
      </footer>
    </div>
  );
}
