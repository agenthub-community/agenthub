# OpenAgentHub

A distribution hub for AI agent bundles — the "source registry" half of the
[agentLauncher](https://github.com/lildengzi/agentLauncher) ecosystem. Think
GitHub-for-agents: you publish agents here, people run them there.

OpenAgentHub does **not** invent a format. It emits exactly what agentLauncher
already consumes, in two layers:

| Layer | Output | agentLauncher consumes it as |
|---|---|---|
| **Market items** (plugin / skill / mcp) | `feed.json` (`{items:[…]}`) | a market **source** (adapter `agentlauncher`) |
| **Recipes** (整合包 — a whole packaged instance) | `recipes/index.json` + `recipes/*.recipe.zip` | an **imported instance** (`inspect`/`import` recipe) |

## Source of truth → build → publish

Everything you edit lives under `registry/`. The build compiles it into a static
site under `dist/` that is both machine-readable and human-browsable — build
once, consume twice.

```
registry/
  items/*.json                       # one market item each (canonical shape)
  recipes/<id>/
    recipe.json                      # catalog metadata (name, tags, icon…)
    instance.json                    # the agentLauncher Instance
    AGENTS.md  mcp.json  skills/**    # optional payload
```

```bash
node scripts/build.mjs   # registry/ + site/ -> dist/
node scripts/serve.mjs   # preview dist/ at http://localhost:8787/openagenthub/
```

The build has **no dependencies** — just Node ≥ 18. Recipe zips are assembled
from the plaintext dirs above (STORED entries), so nothing binary is committed
and the launcher's `zip` reader accepts them.

## One-click import

The site offers, per recipe/source, a deep link the desktop app can answer:

- `agentlauncher://import-recipe?url=<zip url>` — import a recipe
- `agentlauncher://add-source?url=<feed url>&label=OpenAgentHub` — add the item source

Until agentLauncher registers that URL scheme, the site falls back to
**download `.zip` → import file** and **copy source URL**, which work today.

## Publishing

CI (`.github/workflows/deploy.yml`) builds and deploys `dist/` to GitHub Pages
at `https://lildengzi.github.io/openagenthub/`.

## License

[MIT](LICENSE) © 2026 lildengzi
