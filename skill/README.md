# WakeNet skill for OpenClaw / Clawdbot

This folder contains an **AgentSkills-compatible** skill so OpenClaw/Clawdbot agents can use WakeNet (event-driven wake, webhook verification).

## Install

**Option A — Copy into your OpenClaw skills**

```bash
cp -r skill/wakenet-listener ~/.openclaw/skills/
# or into your workspace: cp -r skill/wakenet-listener /path/to/workspace/skills/
```

**Option B — ClawHub (if published)**

```bash
clawhub install wakenet/wakenet-listener
# or whatever slug is used after publishing to ClawHub
```

After install, the agent will have the **wakenet-listener** skill and can help users subscribe to WakeNet, create feeds/subscriptions, and verify webhooks.

## What the skill does

- Teaches the agent when and how to use WakeNet (replace polling, RSS/GitHub/HTTP events).
- Quick flow: create feed → create subscription → verify `x-wakenet-signature` on incoming webhooks.
- Links to WakeNet docs and Clawdbot example.

## Skill format

- `SKILL.md` with YAML frontmatter (`name`, `description`, `metadata`) and markdown body.
- Compatible with [OpenClaw Skills](https://docs.clawd.bot/tools/skills) and [AgentSkills](https://agentskills.io).
