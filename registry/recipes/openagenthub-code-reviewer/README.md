# Code Reviewer

A Claude Code agent tuned for thorough, **security-aware** code review. Import
it into agentLauncher and point it at a repository — it reads the diff and
reports real defects grouped by severity, instead of restating your code.

## What's inside

- `AGENTS.md` — the review rubric the agent follows (how to review, what to look
  for, what to leave alone).
- `mcp.json` — a filesystem MCP server (`filesystem`) so the agent can read the
  files under review.
- `skills/code-review/` — a reusable review skill.
- `instance.json` — the agentLauncher instance config (engine `claude`,
  headless profile).

## Import

Click **一键导入** above, or download the `.zip` and use **导入配方** inside
agentLauncher. One-click needs the `agentlauncher://` scheme registered on your
machine; the download path always works.

## Configuration

Bring your own key on import — set `ANTHROPIC_API_KEY` in the instance's
environment. The recipe ships **no secrets**: provider snapshots and `.env` are
stripped at export, and nothing here carries a key value.

## Default task

> Review the staged changes and report issues grouped by severity.

Change it per run from the launcher.
