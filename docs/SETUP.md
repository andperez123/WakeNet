# WakeNet setup

## Admin UI

- **URL:** `https://wake-net.vercel.app/admin` (or your deployment URL + `/admin`)
- **Protection:** If `ADMIN_SECRET` is set in Vercel (or `.env`), visiting `/admin` shows an unlock form; enter the secret to get a cookie and access the dashboard.
- **Dashboard:** Counts for feeds, subscriptions, events; deliveries in the last 24h (sent / failed / queued)
- **Feeds:** Add RSS, GitHub Releases, or HTTP JSON feeds; trigger manual poll
- **Subscriptions:** Add webhook subscriptions per feed
- **Events:** Browse recent normalized events

No auth in MVP — keep `/admin` unlisted or add auth later.

---

## Inngest (automatic polling)

Feeds are polled every 5 minutes when Inngest is configured.

### What you need to do

1. **Sign up:** [inngest.com](https://inngest.com) → create an account and a new app.
2. **Connect Vercel:** In Inngest dashboard, connect your Vercel account and select the WakeNet project (or add the app URL so Inngest can reach it).
3. **Get the signing key:** Inngest → your app → **Signing key** (or **Keys**). Copy the **Signing key**.
4. **Add env in Vercel:** Project → Settings → Environment Variables:
   - **Name:** `INNGEST_SIGNING_KEY`
   - **Value:** (paste the signing key)
   - **Environment:** Production (and Preview if you use it)
5. **Redeploy** so the new variable is applied.

After that, Inngest will call `/api/inngest` and run the `poll-feeds` cron every 5 minutes. No code changes needed.

---

## Clawdbot: verifying webhooks

WakeNet sends a POST to your webhook URL with:

- **Body:** JSON `{ "id", "feedId", "event": { "id", "source", "title", "link", "published", "body", "metadata" }, "deliveredAt" }`
- **Header:** `x-wakenet-signature` = HMAC-SHA256 of the **raw request body** using your subscription **secret** (returned only when you create the subscription).

### Verify in Node.js

```js
const crypto = require("crypto");

function verifyWakeNetWebhook(rawBody, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expected, "utf8")
  );
}

// In your webhook handler (e.g. Express):
app.post("/webhook/wakenet", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-wakenet-signature"];
  const secret = process.env.WAKENET_SUBSCRIPTION_SECRET; // the one from create subscription
  if (!verifyWakeNetWebhook(req.body.toString(), signature, secret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }
  const payload = JSON.parse(req.body.toString());
  // payload.event has: id, source, title, link, published, body, metadata
  // Trigger your agent here.
  res.status(200).send("OK");
});
```

Use **raw body** for verification (before JSON parsing), or the signature will not match.

### Secret storage

Store the subscription `secret` securely (e.g. env var per subscription or in your DB). It is only returned once when you create the subscription via `POST /api/subscriptions`.
