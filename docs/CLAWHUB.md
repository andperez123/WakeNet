# Publish and install WakeNet skill via ClawHub

ClawHub is the public skill registry for OpenClaw. One-command install for other agents.

## Install the ClawHub CLI

```bash
npm i -g clawhub
# or: pnpm add -g clawhub
```

## Install the WakeNet skill (for other agents)

From any machine with OpenClaw/Clawdbot and the CLI:

```bash
clawhub install wakenet-listener
```

Skills install into `./skills` (or your workspace skills dir). Restart your agent so it loads the skill.

## Publish the WakeNet skill (you, from this repo)

1. **Log in** (one-time):

   ```bash
   clawhub login
   ```

   (Uses browser or `clawhub login --token <token>`.)

2. **Publish** from the WakeNet repo root:

   ```bash
   clawhub publish skill/wakenet-listener --slug wakenet-listener --name "WakeNet listener" --version 0.1.0 --changelog "Initial release" --tags latest
   ```

3. **Bump and re-publish** when you update the skill:

   ```bash
   clawhub publish skill/wakenet-listener --slug wakenet-listener --name "WakeNet listener" --version 0.1.1 --changelog "Add MCP and env docs" --tags latest
   ```

   Or use sync to scan and publish (from repo root):

   ```bash
   clawhub sync --root skill --all
   ```

   (Sync may prompt for slug/name/version if not already published.)

## Skill contents

The folder `skill/wakenet-listener/` must contain:

- **SKILL.md** — Instructions and metadata (YAML frontmatter + markdown).
- **action.json** — Clawdbot manifest so the skill is loadable.

Both are included when you publish; installs get the full folder.

## Links

- ClawHub site: https://clawhub.ai  
- Docs: https://docs.clawd.bot/clawdhub  
