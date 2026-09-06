// site/app.js — load the two catalogs, route on the hash, render. The data
// files are the very ones agentLauncher reads, fetched relative to this page.

import { clear, el } from "./dom.js";
import { listView, sourceBanner, about } from "./ui.js";
import { itemDetail } from "./detail.js";
import { recipeDetail, releasePage } from "./recipe.js";

const view = document.getElementById("view");
const state = { items: [], recipes: [] };

async function loadJSON(rel, key) {
  try {
    const r = await fetch(rel, { cache: "no-cache" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json())[key] || [];
  } catch (e) {
    console.error(`load ${rel}:`, e);
    return [];
  }
}

function setActiveTab(tab) {
  for (const a of document.querySelectorAll(".ghd-nav a")) a.classList.toggle("on", a.dataset.tab === tab);
}

function notFound() {
  return el("section", {}, [el("h2", { text: "404 · 找不到" }), el("a", { href: "#/", text: "← 返回" })]);
}

function route() {
  const [section, id] = location.hash.replace(/^#\/?/, "").split("/");
  clear(view);
  if (section === "recipe" && id) {
    const r = state.recipes.find((x) => x.id === id);
    view.append(r ? recipeDetail(r) : notFound());
    setActiveTab("recipes");
  } else if (section === "release" && id) {
    const r = state.recipes.find((x) => x.id === id);
    view.append(r ? releasePage(r) : notFound());
    setActiveTab("recipes");
  } else if (section === "item" && id) {
    const it = state.items.find((x) => x.id === id);
    view.append(it ? itemDetail(it) : notFound());
    setActiveTab("items");
  } else if (section === "items") {
    view.append(listView("item", "市场条目 Items", "插件 / 技能 / MCP——订阅为 agentLauncher 数据源。", state.items, sourceBanner()));
    setActiveTab("items");
  } else if (section === "about") {
    view.append(about());
    setActiveTab("about");
  } else {
    view.append(listView("recipe", "整合包 Recipes", "打包好的 agent 实例,一键导入 agentLauncher。", state.recipes));
    setActiveTab("recipes");
  }
}

async function main() {
  [state.items, state.recipes] = await Promise.all([loadJSON("./feed.json", "items"), loadJSON("./recipes/index.json", "recipes")]);
  window.addEventListener("hashchange", route);
  route();
}

main();
