# WakeNet skill for OpenClaw / Clawdbot

This folder contains an **AgentSkills-compatible** skill so OpenClaw/Clawdbot agents can use WakeNet (event-driven wake, webhook verification, MCP integration).

## Install

**Option A — Copy into your OpenClaw skills**

```bash
cp -r skill/wakenet-listener ~/.openclaw/skills/
# or into your workspace: cp -r skill/wakenet-listener /path/to/workspace/skills/
```

**Option B — ClawHub (if published)**

```bash
clawhub install wakenet/wakenet-listener
```

After install, the agent will have the **wakenet-listener** skill and can help users subscribe to WakeNet, create feeds/subscriptions, verify webhooks, and configure MCP tools.

## What the skill does

- Teaches the agent when and how to use WakeNet (replace polling, RSS/GitHub/HTTP events).
- **MCP integration** — instructs agents to use `wakenet_*` tools if the MCP server is configured.
- **Promoter mode** — explains the promoter payload format for agents that post/promote events.
- Quick flow: create feed → create subscription → verify `x-wakenet-signature` on incoming webhooks.
- Links to WakeNet docs, MCP server, and Clawdbot example.

## Also available: MCP server

For deeper agent integration, configure the WakeNet MCP server:

```json
{
  "mcpServers": {
    "wakenet": {
      "command": "npx",
      "args": ["tsx", "/path/to/WakeNet/mcp-server/index.ts"],
      "env": {
        "WAKENET_URL": "https://wake-net.vercel.app",
        "WAKENET_API_KEY": "your-api-key"
      }
    }
  }
}
```

See [mcp-server/README.md](../mcp-server/README.md) for full setup.

## Skill format

- `SKILL.md` with YAML frontmatter (`name`, `description`, `metadata`) and markdown body.
- Compatible with [OpenClaw Skills](https://docs.clawd.bot/tools/skills) and [AgentSkills](https://agentskills.io).
