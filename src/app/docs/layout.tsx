import Link from "next/link";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-wakenet-bg text-gray-200">
      <header className="sticky top-0 z-50 border-b border-wakenet-border bg-wakenet-bg/95 backdrop-blur">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-display text-lg font-semibold text-white hover:text-wakenet-accent transition"
          >
            WakeNet
          </Link>
          <div className="flex gap-6">
            <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition">
              Docs
            </Link>
            <Link href="/docs/integrate" className="text-sm text-gray-400 hover:text-white transition">
              Integrate
            </Link>
            <Link href="/docs/feed-types" className="text-sm text-gray-400 hover:text-white transition">
              Feed types
            </Link>
            <Link href="/docs/clawdbot-example" className="text-sm text-gray-400 hover:text-white transition">
              Clawdbot Example
            </Link>
            <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition">
              Admin
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
