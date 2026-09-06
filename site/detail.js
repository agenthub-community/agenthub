// site/detail.js — shared repo-page helpers (action bar, README box, About
// sidebar, title row) plus the Item detail page. Recipe pages live in recipe.js.

import { el, pills, copy } from "./dom.js";
import { renderMarkdown } from "./md.js";

// A button group. Each spec: {label, href?, download?, copy?, primary?}.
export function actionRow(specs) {
  return el("div", { class: "btn-group" }, specs.filter(Boolean).map((s) => {
    if (s.copy) {
      const b = el("button", { class: s.primary ? "btn btn-primary" : "btn", text: s.label });
      b.addEventListener("click", async () => { b.textContent = (await copy(s.copy)) ? "已复制 ✓" : s.label; });
      return b;
    }
    return el("a", { class: s.primary ? "btn btn-primary" : "btn", href: s.href, download: s.download || null, text: s.label });
  }));
}

export function readmeBox(md) {
  return el("div", { class: "box" }, [
    el("div", { class: "box-head", text: "README.md" }),
    el("div", { class: "box-pad markdown-body" }, [renderMarkdown(md)]),
  ]);
}

// owner / name with a small kind label — the GitHub repo-title line.
export function titleRow(owner, name, label) {
  return el("div", { class: "repo-title" }, [
    el("span", { class: "owner", text: owner }),
    el("span", { class: "slash", text: "/" }),
    el("span", { class: "reponame", text: name }),
    label ? el("span", { class: "label", text: label }) : null,
  ]);
}

// rows: [{label, value?, link?, mono?}]; tags render as topics; `extra` (e.g. a
// Releases block) is appended after the rows. No "Languages" — agents have none.
export function aboutBox(rows, tags, extra) {
  const items = rows.filter(Boolean).map((r) =>
    el("div", { class: "about-row" }, [
      el("span", { class: "about-k", text: r.label }),
      r.link ? el("a", { class: "about-v", href: r.link, target: "_blank", rel: "noopener", text: r.link })
             : el("span", { class: r.mono ? "about-v mono" : "about-v", text: r.value }),
    ])
  );
  return el("aside", { class: "about" }, [el("h2", { class: "about-title", text: "About" }), pills(tags), ...items, extra || null]);
}

export function itemDetail(it) {
  const ins = ((it.versions && it.versions[0]) || {}).install || {};
  const cmd = ins.mcp?.command ? [ins.mcp.command].concat(ins.mcp.args || []).join(" ") : null;
  return el("section", { class: "repo" }, [
    el("a", { class: "back", href: "#/items", text: "← Items" }),
    titleRow(it.author || "openagenthub", it.name, it.kind || "item"),
    it.description ? el("p", { class: "repo-lead", text: it.description }) : null,
    pills(it.tags),
    el("div", { class: "repo-bar" }, [actionRow([
      cmd ? { label: "复制安装命令", copy: cmd, primary: true } : (ins.repo ? { label: "复制 repo 地址", copy: ins.repo, primary: true } : null),
      it.homepage ? { label: "主页 ↗", href: it.homepage } : null,
      it.repo ? { label: "仓库 ↗", href: it.repo } : null,
    ])]),
    el("p", { class: "hint", text: "先在 Items 页「添加数据源」,即可在 agentLauncher 市场里搜索并一键安装此条目。" }),
    el("div", { class: "repo-cols" }, [
      el("div", { class: "repo-main" }, [readmeBox(it.readme || `# ${it.name}\n\n${it.description || ""}`)]),
      aboutBox([
        { label: "Kind", value: it.kind || "—" },
        { label: "安装方式", value: ins.method || "—" },
        ins.package ? { label: "package", value: ins.package, mono: true } : null,
        ins.repo ? { label: "repo", link: ins.repo } : null,
        cmd ? { label: "命令", value: cmd, mono: true } : null,
        ins.env?.length ? { label: "环境变量", value: ins.env.join(", "), mono: true } : null,
        it.license ? { label: "License", value: it.license } : null,
      ], it.tags),
    ]),
  ]);
}
