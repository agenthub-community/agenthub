// site/ui.js — list views (GitHub repo-list style), the market-source banner,
// and the About page. Repo-style detail pages live in detail.js.

import { el, pills, fmtDate, absUrl, copy } from "./dom.js";

const PROTOCOL = "agentlauncher";

// One entry in a list, styled like a row in a GitHub repo list.
function repoRow(kind, o) {
  const isHot = (o.tags || []).includes("hot");
  const hay = [o.name, o.id, o.description, (o.tags || []).join(" "), o.kind, o.engine].filter(Boolean).join(" ").toLowerCase();
  return el("div", { class: `repo-row${isHot ? " repo-row-hot" : ""}`, "data-hay": hay }, [
    el("div", { class: "repo-row-head" }, [
      el("a", { class: "repo-name", href: `#/${kind}/${o.id}`, text: o.name || o.id }),
      el("span", { class: "label", text: o.kind || "recipe" }),
      isHot ? el("span", { class: "hot-badge", text: "🔥 Hot" }) : null,
    ]),
    o.description ? el("p", { class: "repo-desc", text: o.description }) : null,
    pills(o.tags),
    el("div", { class: "repo-meta" }, [
      o.engine ? el("span", { text: `engine ${o.engine}` }) : null,
      o.skills?.length ? el("span", { text: `skills ${o.skills.length}` }) : null,
      o.license ? el("span", { text: o.license }) : null,
      (o.updated_at || o.created_at) ? el("span", { text: `Updated ${fmtDate(o.updated_at || o.created_at)}` }) : null,
    ]),
  ]);
}

export function listView(kind, title, subtitle, rows, extra) {
  // Hot first for visibility
  const sorted = [...rows].sort((a, b) => {
    const ah = (a.tags || []).includes("hot") ? 0 : 1;
    const bh = (b.tags || []).includes("hot") ? 0 : 1;
    return ah - bh || (a.name || a.id).localeCompare(b.name || b.id);
  });
  const list = el("div", { class: "box" }, sorted.length ? sorted.map((r) => repoRow(kind, r)) : el("div", { class: "blankslate", text: "暂无内容。" }));
  const filter = el("input", {
    class: "filter", type: "search", placeholder: `Find a ${kind}… (try hot)`,
    oninput: (e) => {
      const q = e.target.value.trim().toLowerCase();
      for (const row of list.children) row.hidden = q && !(row.dataset.hay || "").includes(q);
    },
  });
  const hotCount = sorted.filter((r) => (r.tags || []).includes("hot")).length;
  const hotFilter = hotCount ? el("div", { class: "hot-bar" }, [
    el("span", { class: "hot-bar-label", text: `🔥 ${hotCount} 个热门` }),
    el("button", { class: "btn btn-sm", text: "只看 Hot", onclick: () => { filter.value = "hot"; filter.dispatchEvent(new Event("input")); } }),
    el("button", { class: "btn btn-sm", text: "全部", onclick: () => { filter.value = ""; filter.dispatchEvent(new Event("input")); } }),
  ]) : null;
  return el("section", {}, [
    el("div", { class: "page-head" }, [el("h2", { text: title }), el("span", { class: "counter", text: String(sorted.length) })]),
    subtitle ? el("p", { class: "page-sub", text: subtitle }) : null,
    extra || null,
    hotFilter,
    sorted.length ? filter : null,
    list,
  ]);
}

// Global call-to-action: subscribe agentLauncher to this hub as a market source.
export function sourceBanner() {
  const feed = absUrl("./feed.json");
  const href = `${PROTOCOL}://add-source?url=${encodeURIComponent(feed)}&label=AgentHub&adapter=agentlauncher`;
  const btn = el("button", { class: "btn", text: "复制源地址" });
  btn.addEventListener("click", async () => { btn.textContent = (await copy(feed)) ? "已复制 ✓" : "复制源地址"; });
  return el("div", { class: "notice" }, [
    el("div", {}, [el("strong", { text: "把这里作为 agentLauncher 的数据源" }), el("p", { text: `热门整合包已就位，一键订阅后在启动器内安装 · ${feed}` })]),
    el("div", { class: "btn-group" }, [el("a", { class: "btn btn-primary", href, text: "一键添加数据源" }), btn]),
  ]);
}

export function about() {
  return el("section", {}, [
    el("div", { class: "box box-pad prose" }, [
      el("h2", { text: "关于 AgentHub" }),
      el("p", { text: "AgentHub 是热门 AI Agent 整合包的中枢 — agentLauncher 生态的分发源。首期聚焦热门生态：代码、研究、文档、浏览器自动化。" }),
      el("ul", {}, [
        el("li", { text: "市场条目(plugin / skill / mcp)→ feed.json,作为一个数据源被启动器订阅。" }),
        el("li", { text: "整合包 Recipes(一个打包好的实例)→ .recipe.zip,可一键导入启动器。" }),
      ]),
      el("p", {}, [el("a", { href: "https://github.com/agenthub-community/agentlauncher", target: "_blank", rel: "noopener", text: "agentLauncher" }), " 负责运行，AgentHub 负责让热门能力可见、可一键安装。"]),
      el("p", { class: "hint", text: "热门标签 hot 的条目会在列表顶部高亮，试试在筛选框输入 hot。" }),
    ]),
  ]);
}
