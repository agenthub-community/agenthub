// site/md.js — a tiny, safe Markdown → DOM renderer. It builds real nodes with
// textContent (never innerHTML), and only emits links whose URL is http(s), so
// registry-authored README text can never inject markup or a javascript: href.
// Supported: #..###### headings, paragraphs, - / * and 1. lists, ``` fences,
// `code`, **bold**, *italic* / _italic_, and [text](https://…) links.

import { el } from "./dom.js";

// Inline spans within a single line of text.
function inline(text) {
  const out = [];
  for (const part of text.split(/(`[^`]+`)/)) {
    if (!part) continue;
    if (part[0] === "`" && part.endsWith("`")) {
      out.push(el("code", { class: "md-code", text: part.slice(1, -1) }));
    } else {
      out.push(...rich(part));
    }
  }
  return out;
}

function rich(s) {
  const out = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(document.createTextNode(s.slice(last, m.index)));
    if (m[2] !== undefined) out.push(el("a", { href: m[2], text: m[1], target: "_blank", rel: "noopener noreferrer" }));
    else if (m[3] !== undefined) out.push(el("strong", { text: m[3] }));
    else out.push(el("em", { text: m[4] !== undefined ? m[4] : m[5] }));
    last = re.lastIndex;
  }
  if (last < s.length) out.push(document.createTextNode(s.slice(last)));
  return out;
}

const isBlank = (l) => /^\s*$/.test(l);
const isHeading = (l) => /^#{1,6}\s/.test(l);
const isList = (l) => /^\s*([-*]|\d+\.)\s+/.test(l);

export function renderMarkdown(src) {
  const frag = document.createDocumentFragment();
  const lines = (src || "").replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      i++;
      const buf = [];
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; // closing fence
      frag.append(el("pre", { class: "md-pre" }, [el("code", { text: buf.join("\n") })]));
    } else if (isBlank(line)) {
      i++;
    } else if (isHeading(line)) {
      const [, h, rest] = line.match(/^(#{1,6})\s+(.*)$/);
      frag.append(el(`h${h.length}`, { class: "md-h" }, inline(rest)));
      i++;
    } else if (isList(line)) {
      const ordered = /^\s*\d+\.\s/.test(line);
      const items = [];
      while (i < lines.length && isList(lines[i]) && /^\s*\d+\.\s/.test(lines[i]) === ordered) {
        items.push(el("li", {}, inline(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""))));
        i++;
      }
      frag.append(el(ordered ? "ol" : "ul", { class: "md-list" }, items));
    } else {
      const buf = [line];
      i++;
      while (i < lines.length && !isBlank(lines[i]) && !isHeading(lines[i]) && !isList(lines[i]) && !/^```/.test(lines[i])) buf.push(lines[i++]);
      frag.append(el("p", { class: "md-p" }, inline(buf.join(" "))));
    }
  }
  return frag;
}
