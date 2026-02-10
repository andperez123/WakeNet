import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-wakenet-bg text-gray-200">
      <header className="sticky top-0 z-50 border-b border-wakenet-border bg-wakenet-bg/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-display text-lg font-semibold text-white hover:text-wakenet-accent transition"
            >
              WakeNet
            </Link>
            <div className="flex gap-4">
              <Link
                href="/admin"
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/feeds"
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Feeds
              </Link>
              <Link
                href="/admin/subscriptions"
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Subscriptions
              </Link>
              <Link
                href="/admin/events"
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Events
              </Link>
            </div>
          </div>
          <span className="text-xs text-gray-500">Admin</span>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
