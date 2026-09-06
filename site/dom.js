// site/dom.js — tiny DOM + formatting helpers shared by the renderers. No deps.

// Build an element: el("div", {class:"x", onclick:fn}, [child, "text"]).
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

// Resolve a build-relative path (feed.json, recipes/x.zip) to an absolute URL,
// honouring the /openagenthub/ base wherever the page is actually served.
export function absUrl(rel) {
  return new URL(rel, document.baseURI).href;
}

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// GitHub-style topic pills. Returns null when there's nothing to show.
export function pills(tags) {
  if (!tags || !tags.length) return null;
  return el("div", { class: "topics" }, tags.map((t) => el("span", { class: "topic", text: t })));
}

export function fmtBytes(n) {
  if (!Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

export function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d) ? String(s) : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
