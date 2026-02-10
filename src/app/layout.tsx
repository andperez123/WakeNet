import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WakeNet — Event-Driven Wake Infrastructure for AI Agents",
  description:
    "Replace cron and polling with push-based signals. Wake your agents only when something worth acting on happens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-wakenet-bg text-gray-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}
