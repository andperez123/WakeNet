"use client";

import { useState } from "react";

export default function AdminGate() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid key");
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-wakenet-border bg-wakenet-surface/50 p-8">
        <h2 className="font-display text-lg font-semibold text-white">Admin</h2>
        <p className="mt-1 text-sm text-gray-400">Enter the admin key to continue.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            className="w-full rounded-lg border border-wakenet-border bg-wakenet-bg px-3 py-2 text-white placeholder-gray-500"
            autoFocus
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-wakenet-accent py-2 text-sm font-medium text-wakenet-bg hover:bg-wakenet-accent/90 disabled:opacity-50"
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
