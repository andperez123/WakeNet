# WakeNet MCP Server

An [MCP](https://modelcontextprotocol.io/) server that exposes WakeNet as callable tools for any MCP-aware agent (Claude Desktop, Cursor, OpenClaw, etc.).

## Tools

| Tool | Description |
|------|-------------|
| `wakenet_list_feeds` | List all feeds |
| `wakenet_create_feed` | Create a new feed (RSS, GitHub Releases, HTTP JSON) |
| `wakenet_list_subscriptions` | List all subscriptions |
| `wakenet_create_subscription` | Create a subscription with webhook/pull config |
| `wakenet_list_events` | Browse recent events, filter by feed |
| `wakenet_poll_feed` | Trigger an immediate poll |
| `wakenet_pull_events` | Pull events for a pull-enabled subscription |
| `wakenet_health` | Check WakeNet health + DB status |

## Setup

### 1. Clone the repo (if you haven't)

```bash
git clone https://github.com/andperez123/WakeNet.git
cd WakeNet
npm install
```

### 2. Configure environment

Set these env vars (or pass them in the MCP config):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WAKENET_URL` | No | `https://wake-net.vercel.app` | Base URL of your WakeNet instance |
| `WAKENET_API_KEY` | No | — | Bearer token (if `WAKENET_API_KEY` is set on the server) |

### 3. Add to your MCP client

#### Cursor (`.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally)

```json
{
  "mcpServers": {
    "wakenet": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/WakeNet/mcp-server/index.ts"],
      "env": {
        "WAKENET_URL": "https://wake-net.vercel.app",
        "WAKENET_API_KEY": "your-api-key"
      }
    }
  }
}
```

#### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "wakenet": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/WakeNet/mcp-server/index.ts"],
      "env": {
        "WAKENET_URL": "https://wake-net.vercel.app",
        "WAKENET_API_KEY": "your-api-key"
      }
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/WakeNet` with the actual path on your machine.

### 4. Test

Once configured, your agent should see WakeNet tools. Try asking:

- "List my WakeNet feeds"
- "Create an RSS feed for the OpenAI blog"
- "Poll all my feeds"
- "Show me recent WakeNet events"

## Example: agent creates a feed + subscription

```
Agent: I'll set up a WakeNet feed for Vercel's Next.js releases.

[calls wakenet_create_feed with type="github_releases", owner="vercel", repo="next.js"]
→ Feed created: c19bcf49-...

[calls wakenet_create_subscription with feedId="c19bcf49-...", name="Next.js watcher", webhookUrl="https://my-agent.com/webhook"]
→ Subscription created, secret: 2c90b49b... (store this!)

[calls wakenet_poll_feed with feedId="c19bcf49-..."]
→ 30 events found, 13 delivered
```

## Running standalone (for testing)

```bash
WAKENET_URL=https://wake-net.vercel.app npx tsx mcp-server/index.ts
```

The server communicates via stdio (JSON-RPC). It will wait for MCP messages on stdin.
