// site/ui.js — list views (GitHub repo-list style), the market-source banner,
// and the About page. Repo-style detail pages live in detail.js.

import { el, pills, fmtDate, absUrl, copy } from "./dom.js";

const PROTOCOL = "agentlauncher";

// One entry in a list, styled like a row in a GitHub repo list.
function repoRow(kind, o) {
  const hay = [o.name, o.id, o.description, (o.tags || []).join(" "), o.kind, o.engine].filter(Boolean).join(" ").toLowerCase();
  return el("div", { class: "repo-row", "data-hay": hay }, [
    el("div", { class: "repo-row-head" }, [
      el("a", { class: "repo-name", href: `#/${kind}/${o.id}`, text: o.name || o.id }),
      el("span", { class: "label", text: o.kind || "recipe" }),
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
  const list = el("div", { class: "box" }, rows.length ? rows.map((r) => repoRow(kind, r)) : el("div", { class: "blankslate", text: "暂无内容。" }));
  const filter = el("input", {
    class: "filter", type: "search", placeholder: `Find a ${kind}…`,
    oninput: (e) => {
      const q = e.target.value.trim().toLowerCase();
      for (const row of list.children) row.hidden = q && !(row.dataset.hay || "").includes(q);
    },
  });
  return el("section", {}, [
    el("div", { class: "page-head" }, [el("h2", { text: title }), el("span", { class: "counter", text: String(rows.length) })]),
    subtitle ? el("p", { class: "page-sub", text: subtitle }) : null,
    extra || null,
    rows.length ? filter : null,
    list,
  ]);
}

// Global call-to-action: subscribe agentLauncher to this hub as a market source.
export function sourceBanner() {
  const feed = absUrl("./feed.json");
  const href = `${PROTOCOL}://add-source?url=${encodeURIComponent(feed)}&label=OpenAgentHub&adapter=agentlauncher`;
  const btn = el("button", { class: "btn", text: "复制源地址" });
  btn.addEventListener("click", async () => { btn.textContent = (await copy(feed)) ? "已复制 ✓" : "复制源地址"; });
  return el("div", { class: "notice" }, [
    el("div", {}, [el("strong", { text: "把这里作为 agentLauncher 的数据源" }), el("p", { text: "添加一次,之后所有市场条目都能在启动器内一键安装。" })]),
    el("div", { class: "btn-group" }, [el("a", { class: "btn btn-primary", href, text: "一键添加数据源" }), btn]),
  ]);
}

export function about() {
  return el("section", {}, [
    el("div", { class: "box box-pad prose" }, [
      el("h2", { text: "关于 OpenAgentHub" }),
      el("p", { text: "OpenAgentHub 是分发 AI Agent 的中心——agentLauncher 生态的“源”。它不发明新格式,只产出 agentLauncher 已经能消费的两种东西:" }),
      el("ul", {}, [
        el("li", { text: "市场条目(plugin / skill / mcp)→ feed.json,作为一个数据源被启动器订阅。" }),
        el("li", { text: "整合包 Recipes(一个打包好的实例)→ .recipe.zip,可一键导入启动器。" }),
      ]),
      el("p", {}, [el("a", { href: "https://github.com/lildengzi/agentLauncher", target: "_blank", rel: "noopener", text: "agentLauncher" }), " 负责运行,OpenAgentHub 负责分发。"]),
    ]),
  ]);
}
