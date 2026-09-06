// site/recipe.js — recipe pages styled like a GitHub repository: a file list of
// the bundle's contents with the README rendered below it, an About sidebar with
// a Releases section (and no "Languages"), plus a release page whose assets are
// the whole exported recipe AND its self-contained pieces (mcp / skill).

import { el, pills, absUrl, fmtBytes, fmtDate } from "./dom.js";
import { actionRow, readmeBox, aboutBox, titleRow } from "./detail.js";

const PROTOCOL = "agentlauncher";
const importHref = (url) => `${PROTOCOL}://import-recipe?url=${encodeURIComponent(url)}`;
// Friendly one-liners for the file-list's middle column (GitHub shows the last
// commit message there; a recipe has no commits, so we describe the file).
const FILE_DESC = { "manifest.json": "配方清单 (format v1)", "instance.json": "agent 实例配置", "AGENTS.md": "system prompt / 规则", "mcp.json": "MCP servers" };
const ASSET_ICON = { recipe: "📦", mcp: "🧩", skill: "✨" };

function fileRow(icon, name, desc, size) {
  return el("div", { class: "file-row" }, [
    el("span", { class: "file-name" }, [el("span", { class: "file-ico", text: icon }), el("span", { text: name })]),
    el("span", { class: "file-desc", text: desc }),
    el("span", { class: "file-size", text: size }),
  ]);
}

// The bundle's contents as a GitHub file list: folders first (skills/ collapsed
// to one row with its aggregate size), then top-level files, both sorted.
function fileListBox(rec) {
  const dirs = new Map();
  const files = [];
  for (const f of rec.files || []) {
    const i = f.path.indexOf("/");
    if (i >= 0) dirs.set(f.path.slice(0, i), (dirs.get(f.path.slice(0, i)) || 0) + f.bytes);
    else files.push(f);
  }
  const rows = [];
  for (const [d, bytes] of [...dirs].sort()) rows.push(fileRow("📁", `${d}/`, "", fmtBytes(bytes)));
  for (const f of files.sort((a, b) => a.path.localeCompare(b.path))) rows.push(fileRow("📄", f.path, FILE_DESC[f.path] || "", fmtBytes(f.bytes)));
  return el("div", { class: "box" }, [
    el("div", { class: "box-head file-head" }, [
      el("span", { text: `${rec.author || "openagenthub"} · 更新于 ${fmtDate(rec.created_at)}` }),
      el("span", { class: "muted", text: `${(rec.files || []).length} 个文件` }),
    ]),
    ...rows,
  ]);
}

// The About-sidebar Releases block, linking through to the release page.
function releasesBlock(rec) {
  if (!rec.release) return null;
  return el("div", { class: "about-sec" }, [
    el("h2", { class: "about-title" }, [el("a", { href: `#/release/${rec.id}`, text: "Releases" }), el("span", { class: "counter", text: "1" })]),
    el("a", { class: "rel-latest", href: `#/release/${rec.id}` }, [
      el("span", { class: "rel-name", text: `🏷 ${rec.release.name}` }),
      el("span", { class: "rel-badge", text: "Latest" }),
    ]),
    el("div", { class: "rel-date", text: `导出于 ${fmtDate(rec.release.date)}` }),
  ]);
}

export function recipeDetail(rec) {
  const zip = absUrl(rec.zip);
  const carries = [rec.has_agents ? "AGENTS.md" : null, rec.has_mcp ? "mcp.json" : null, rec.skills?.length ? `skills(${rec.skills.length})` : null].filter(Boolean).join(" · ") || "instance.json";
  return el("section", { class: "repo" }, [
    el("a", { class: "back", href: "#/recipes", text: "← Recipes" }),
    titleRow(rec.author || "openagenthub", rec.name, rec.engine || "recipe"),
    rec.description ? el("p", { class: "repo-lead", text: rec.description }) : null,
    pills(rec.tags),
    el("div", { class: "repo-bar" }, [actionRow([
      { label: "⭳ 一键导入", href: importHref(zip), primary: true },
      { label: "下载 .zip", href: zip, download: true },
      { label: "复制地址", copy: zip },
    ])]),
    el("p", { class: "hint", text: "「一键导入」需已注册 agentlauncher:// 协议;否则「下载 .zip」后在启动器「导入配方」。单独的 MCP / 技能可在 Releases 里取。" }),
    el("div", { class: "repo-cols" }, [
      el("div", { class: "repo-main" }, [fileListBox(rec), readmeBox(rec.readme || `# ${rec.name}\n\n${rec.description || ""}`)]),
      aboutBox([
        rec.homepage ? { label: "Homepage", link: rec.homepage } : null,
        { label: "Engine", value: rec.engine || "—" },
        rec.model ? { label: "Model", value: rec.model } : null,
        { label: "包含", value: carries },
        { label: "大小", value: fmtBytes(rec.bytes) },
        { label: "sha256", value: (rec.sha256 || "").slice(0, 12) + "…", mono: true },
      ], rec.tags, releasesBlock(rec)),
    ]),
  ]);
}

// The release page: assets are the whole recipe zip plus each independent piece,
// each downloadable on its own; the recipe zip also offers one-click import.
export function releasePage(rec) {
  const rel = rec.release;
  const back = el("a", { class: "back", href: `#/recipe/${rec.id}`, text: `← ${rec.name}` });
  if (!rel) return el("section", { class: "repo" }, [back, el("h2", { text: "无发布" })]);
  const assets = (rel.assets || []).map((a) => {
    const url = absUrl(a.path);
    const acts = a.kind === "recipe"
      ? [{ label: "⭳ 一键导入", href: importHref(url), primary: true }, { label: "下载", href: url, download: true }]
      : [{ label: "下载", href: url, download: true }];
    return el("div", { class: "asset-row" }, [
      el("span", { class: "file-name" }, [el("span", { class: "file-ico", text: ASSET_ICON[a.kind] || "📦" }), el("a", { href: url, download: "", text: a.name })]),
      el("span", { class: "file-desc", text: a.label || "" }),
      el("span", { class: "file-size", text: fmtBytes(a.bytes) }),
      actionRow(acts),
    ]);
  });
  return el("section", { class: "repo" }, [
    back,
    el("div", { class: "page-head" }, [el("h2", { text: "Releases" }), el("span", { class: "counter", text: "1" })]),
    el("div", { class: "box" }, [
      el("div", { class: "box-head" }, [el("span", { class: "rel-badge", text: "Latest" }), el("span", { class: "rel-tagname", text: `${rec.name} · ${rel.tag}` })]),
      el("div", { class: "box-pad" }, [
        el("p", { class: "muted", text: `导出于 ${fmtDate(rel.date)} · agentLauncher 配方 (format v1)。可整包导入,也可单独下载其中的 MCP / 技能。` }),
        el("div", { class: "assets" }, assets),
      ]),
    ]),
  ]);
}
