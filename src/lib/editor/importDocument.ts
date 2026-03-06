import type { JSONContent } from "@tiptap/react";

type ImportFormat = "html" | "md" | "txt" | "json";

export function detectFormat(filename: string): ImportFormat {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html": case "htm": return "html";
    case "md": case "markdown": return "md";
    case "json": return "json";
    default: return "txt";
  }
}

export async function importDocument(
  file: File
): Promise<{ content: JSONContent; title: string } | { error: string }> {
  const text = await file.text();
  const format = detectFormat(file.name);
  const title = file.name.replace(/\.[^/.]+$/, "");

  try {
    switch (format) {
      case "html": return { content: htmlToTiptap(text), title };
      case "md": return { content: await markdownToTiptap(text), title };
      case "json": return { content: jsonToTiptap(text), title };
      case "txt": return { content: textToTiptap(text), title };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Import failed" };
  }
}

// ─── HTML → Tiptap JSON ────────────────────────────────────

function htmlToTiptap(html: string): JSONContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  const content: JSONContent[] = [];

  for (const node of Array.from(body.childNodes)) {
    const converted = domNodeToTiptap(node);
    if (converted) content.push(converted);
  }

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

function domNodeToTiptap(node: Node): JSONContent | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (!text) return null;
    return { type: "text", text };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes)
    .map(domNodeToTiptap)
    .filter(Boolean) as JSONContent[];

  switch (tag) {
    case "h1": return { type: "heading", attrs: { level: 1 }, content: children };
    case "h2": return { type: "heading", attrs: { level: 2 }, content: children };
    case "h3": return { type: "heading", attrs: { level: 3 }, content: children };
    case "p": return { type: "paragraph", content: children.length > 0 ? children : undefined };
    case "ul": return { type: "bulletList", content: children };
    case "ol": return { type: "orderedList", content: children };
    case "li": return { type: "listItem", content: [{ type: "paragraph", content: children }] };
    case "blockquote": return { type: "blockquote", content: children };
    case "pre": return { type: "codeBlock", content: children };
    case "code":
      if (el.parentElement?.tagName.toLowerCase() === "pre") {
        return { type: "text", text: el.textContent || "" };
      }
      return { type: "text", text: el.textContent || "", marks: [{ type: "code" }] };
    case "strong": case "b":
      return children.length === 1 && children[0].type === "text"
        ? { ...children[0], marks: [...(children[0].marks || []), { type: "bold" }] }
        : { type: "paragraph", content: children };
    case "em": case "i":
      return children.length === 1 && children[0].type === "text"
        ? { ...children[0], marks: [...(children[0].marks || []), { type: "italic" }] }
        : { type: "paragraph", content: children };
    case "a":
      return children.length === 1 && children[0].type === "text"
        ? { ...children[0], marks: [...(children[0].marks || []), { type: "link", attrs: { href: el.getAttribute("href") || "" } }] }
        : { type: "paragraph", content: children };
    case "br": return { type: "hardBreak" };
    case "hr": return { type: "horizontalRule" };
    case "div":
      return children.length === 1 ? children[0] : { type: "paragraph", content: children };
    default:
      if (children.length > 0) return { type: "paragraph", content: children };
      if (el.textContent?.trim()) return { type: "text", text: el.textContent.trim() };
      return null;
  }
}

// ─── Markdown → Tiptap JSON ────────────────────────────────

async function markdownToTiptap(md: string): Promise<JSONContent> {
  const { marked } = await import("marked");
  const html = await marked.parse(md);
  return htmlToTiptap(html);
}

// ─── Plain text → Tiptap JSON ──────────────────────────────

function textToTiptap(text: string): JSONContent {
  const paragraphs = text.split(/\n\n+/).map((para): JSONContent => ({
    type: "paragraph",
    content: para.trim() ? [{ type: "text", text: para.trim() }] : undefined,
  }));

  return {
    type: "doc",
    content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }],
  };
}

// ─── JSON → Tiptap JSON (validation) ───────────────────────

function jsonToTiptap(jsonStr: string): JSONContent {
  const parsed = JSON.parse(jsonStr);
  if (!parsed || typeof parsed !== "object" || parsed.type !== "doc") {
    throw new Error("Invalid Tiptap JSON: must have type 'doc'");
  }
  return parsed as JSONContent;
}
