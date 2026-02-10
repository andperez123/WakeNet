# WakeNet skill for OpenClaw / Clawdbot

This folder contains an **AgentSkills-compatible** skill so OpenClaw/Clawdbot agents can use WakeNet (event-driven wake, webhook verification, MCP integration).

The skill includes:
- **SKILL.md** — instructions and docs (YAML frontmatter + markdown).
- **action.json** — Clawdbot skill manifest (required for Clawdbot to list and load the skill).

## Install

**Option A — Clawdbot (skills dir with manifest)**

Copy the **entire** `wakenet-listener` folder so both `SKILL.md` and `action.json` are present:

```bash
mkdir -p ~/clawd/Skills/wakenet-listener
cp -r skill/wakenet-listener/* ~/clawd/Skills/wakenet-listener/
# or, from repo root: cp -r skill/wakenet-listener ~/clawd/Skills/
```

Then restart Clawdbot and verify:

```bash
clawdbot skills list
# Expect: wakenet-listener appears
```

**Option B — OpenClaw (e.g. ~/.openclaw/skills)**

```bash
cp -r skill/wakenet-listener ~/.openclaw/skills/
```

**Option C — ClawHub (if published)**

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

- **SKILL.md** — YAML frontmatter (`name`, `description`, `metadata`) and markdown body.
- **action.json** — Clawdbot manifest (`name`, `description`, `version`, `instructionsFile`). Clawdbot won’t list the skill without it.
- Compatible with [OpenClaw Skills](https://docs.clawd.bot/tools/skills), [AgentSkills](https://agentskills.io), and Clawdbot.
