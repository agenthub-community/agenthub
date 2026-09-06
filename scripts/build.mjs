// scripts/build.mjs
// Compile registry/ + site/ into dist/ — a static site that is at once the
// human catalog and the machine feed agentLauncher reads (build once, consume
// twice). No dependencies beyond Node >= 18.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync, cpSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { makeZip } from "./zip.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const REGISTRY = join(ROOT, "registry");
const SITE = join(ROOT, "site");
const DIST = join(ROOT, "dist");

// Must match agentLauncher's recipe::FORMAT_VERSION.
const RECIPE_FORMAT_VERSION = 1;

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`${relative(ROOT, path)}: ${e.message}`);
  }
}

function listDir(path) {
  return existsSync(path) ? readdirSync(path, { withFileTypes: true }) : [];
}

// Depth-first files under `dir`, as "/"-separated relative paths. Skips
// symlinks — the launcher rejects them on import, so never ship one.
function walkFiles(dir, rel = "", out = []) {
  for (const e of listDir(join(dir, rel))) {
    if (e.isSymbolicLink()) continue;
    const child = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walkFiles(dir, child, out);
    else if (e.isFile()) out.push(child);
  }
  return out;
}

// ---- market items ---------------------------------------------------------

function buildFeed() {
  const items = [];
  for (const e of listDir(join(REGISTRY, "items"))) {
    if (!e.isFile() || !e.name.endsWith(".json")) continue;
    const item = readJSON(join(REGISTRY, "items", e.name));
    if (!item.id && !item.name) throw new Error(`items/${e.name}: needs an id or name`);
    items.push(item);
  }
  items.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
  return items;
}

// ---- recipes --------------------------------------------------------------

function buildRecipe(id) {
  const dir = join(REGISTRY, "recipes", id);
  const meta = existsSync(join(dir, "recipe.json")) ? readJSON(join(dir, "recipe.json")) : {};
  if (!existsSync(join(dir, "instance.json"))) throw new Error(`recipes/${id}: missing instance.json`);
  const instance = readJSON(join(dir, "instance.json"));
  // Optional human README rendered on the site's recipe page; never shipped in
  // the recipe zip (the launcher neither expects nor reads it).
  const readme = existsSync(join(dir, "README.md")) ? readFileSync(join(dir, "README.md"), "utf8") : "";

  // Synthesized exactly as agentLauncher's export.rs does — derived from the
  // instance, not stored twice, so the two can never drift.
  const manifest = {
    format_version: RECIPE_FORMAT_VERSION,
    engine: instance.runtime?.engine || "",
    provider: instance.provider || "",
    model: instance.model || "",
    created_at: instance.created_at || new Date().toISOString(),
  };

  const entries = [];
  const add = (name, buf) => entries.push({ name, data: buf });
  add("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));
  add("instance.json", Buffer.from(JSON.stringify(instance, null, 2) + "\n"));

  const hasAgents = existsSync(join(dir, "AGENTS.md"));
  if (hasAgents) add("AGENTS.md", readFileSync(join(dir, "AGENTS.md")));
  const hasMcp = existsSync(join(dir, "mcp.json"));
  if (hasMcp) add("mcp.json", readFileSync(join(dir, "mcp.json")));

  const skillFiles = walkFiles(join(dir, "skills")).sort();
  for (const rel of skillFiles) add(`skills/${rel}`, readFileSync(join(dir, "skills", rel)));
  const skills = [...new Set(skillFiles.map((p) => p.split("/")[0]))].sort();

  const zip = makeZip(entries);
  mkdirSync(join(DIST, "recipes"), { recursive: true });
  writeFileSync(join(DIST, "recipes", `${id}.recipe.zip`), zip);

  // Release assets: the whole recipe, plus each self-contained piece exported on
  // its own (a GitHub-style release — "导出配方", and the独立 mcp / skill within).
  const assetDir = join(DIST, "recipes", id);
  mkdirSync(assetDir, { recursive: true });
  const files = entries.map((e) => ({ path: e.name, bytes: e.data.length }));
  const assets = [{ name: `${id}.recipe.zip`, path: `recipes/${id}.recipe.zip`, bytes: zip.length, kind: "recipe", label: "整包配方 · instance + AGENTS + mcp + skills" }];
  if (hasMcp) {
    const mcpBuf = readFileSync(join(dir, "mcp.json"));
    writeFileSync(join(assetDir, "mcp.json"), mcpBuf);
    assets.push({ name: "mcp.json", path: `recipes/${id}/mcp.json`, bytes: mcpBuf.length, kind: "mcp", label: "MCP 配置" });
  }
  for (const s of skills) {
    const sZip = makeZip(skillFiles.filter((p) => p.split("/")[0] === s).map((rel) => ({ name: `skills/${rel}`, data: readFileSync(join(dir, "skills", rel)) })));
    writeFileSync(join(assetDir, `skill-${s}.zip`), sZip);
    assets.push({ name: `skill-${s}.zip`, path: `recipes/${id}/skill-${s}.zip`, bytes: sZip.length, kind: "skill", label: `技能 · ${s}` });
  }
  const release = { name: "Latest", tag: "v1", date: manifest.created_at, assets };

  return {
    id,
    name: meta.name || instance.name || id,
    author: meta.author || "",
    description: meta.description || instance.description || "",
    readme,
    tags: meta.tags || [],
    icon: meta.icon || instance.icon || "package",
    homepage: meta.homepage || "",
    engine: manifest.engine,
    provider: manifest.provider,
    model: manifest.model,
    created_at: manifest.created_at,
    zip: `recipes/${id}.recipe.zip`,
    bytes: zip.length,
    sha256: createHash("sha256").update(zip).digest("hex"),
    has_agents: hasAgents,
    has_mcp: hasMcp,
    skills,
    files,
    release,
  };
}

function buildRecipes() {
  const out = [];
  for (const e of listDir(join(REGISTRY, "recipes"))) if (e.isDirectory()) out.push(buildRecipe(e.name));
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// ---- main -----------------------------------------------------------------

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const items = buildFeed();
writeFileSync(join(DIST, "feed.json"), JSON.stringify({ items }, null, 2) + "\n");

const recipes = buildRecipes();
mkdirSync(join(DIST, "recipes"), { recursive: true });
writeFileSync(join(DIST, "recipes", "index.json"), JSON.stringify({ recipes }, null, 2) + "\n");

// Static shell copied last; it has no feed.json/recipes/ so it never clobbers.
cpSync(SITE, DIST, { recursive: true });

console.log(`openagenthub: ${items.length} item(s) -> feed.json`);
for (const r of recipes) console.log(`  recipe ${r.id}: ${r.bytes} B  sha256:${r.sha256.slice(0, 12)}…`);
console.log(`built ${recipes.length} recipe(s) -> dist/`);
