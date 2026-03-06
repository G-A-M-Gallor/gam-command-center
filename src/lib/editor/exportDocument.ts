import type { JSONContent } from "@tiptap/react";

// ─── HTML Export ────────────────────────────────────────────

export function exportToHTML(content: JSONContent, title: string): string {
  const bodyHtml = tiptapJsonToHtml(content);
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #1e293b; line-height: 1.8; direction: rtl; }
    h1 { font-size: 2rem; margin: 1.5rem 0 1rem; }
    h2 { font-size: 1.5rem; margin: 1.25rem 0 0.75rem; }
    h3 { font-size: 1.25rem; margin: 1rem 0 0.5rem; }
    p { margin: 0.5rem 0; }
    ul, ol { padding-right: 1.5rem; margin: 0.5rem 0; }
    li { margin: 0.25rem 0; }
    blockquote { border-right: 3px solid #6366f1; padding-right: 1rem; margin: 1rem 0; color: #64748b; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: right; }
    th { background: #f8fafc; font-weight: 600; }
    input[type="checkbox"] { margin-left: 8px; }
    .callout { background: #f1f5f9; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${bodyHtml}
</body>
</html>`;
}

// ─── Markdown Export ────────────────────────────────────────

export function exportToMarkdown(content: JSONContent, title: string): string {
  return `# ${title}\n\n${tiptapJsonToMarkdown(content)}`;
}

// ─── PDF Export (print-based, zero deps) ────────────────────

export function exportToPDF(content: JSONContent, title: string): void {
  const html = exportToHTML(content, title);
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
}

// ─── DOCX Export ────────────────────────────────────────────

export async function exportToDOCX(content: JSONContent, title: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

  const paragraphs = tiptapJsonToDocxParagraphs(
    content,
    { Document, Paragraph, TextRun, HeadingLevel, AlignmentType }
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.RIGHT,
        }),
        ...paragraphs,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${title}.docx`);
}

// ─── Trigger Download ───────────────────────────────────────

export function triggerDownload(content: Blob | string, filename: string): void {
  const blob = typeof content === "string"
    ? new Blob([content], { type: "text/plain;charset=utf-8" })
    : content;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Tiptap JSON → HTML walker ──────────────────────────────

function tiptapJsonToHtml(node: JSONContent): string {
  if (!node) return "";

  if (node.type === "text") {
    let text = escapeHtml(node.text || "");
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case "bold": text = `<strong>${text}</strong>`; break;
          case "italic": text = `<em>${text}</em>`; break;
          case "underline": text = `<u>${text}</u>`; break;
          case "code": text = `<code>${text}</code>`; break;
          case "link": text = `<a href="${escapeHtml(mark.attrs?.href || "")}">${text}</a>`; break;
          case "highlight": text = `<mark>${text}</mark>`; break;
          case "textStyle":
            if (mark.attrs?.color) text = `<span style="color:${mark.attrs.color}">${text}</span>`;
            break;
        }
      }
    }
    return text;
  }

  const children = (node.content || []).map(tiptapJsonToHtml).join("");

  switch (node.type) {
    case "doc": return children;
    case "paragraph": return `<p>${children || "<br>"}</p>`;
    case "heading": return `<h${node.attrs?.level || 1}>${children}</h${node.attrs?.level || 1}>`;
    case "bulletList": return `<ul>${children}</ul>`;
    case "orderedList": return `<ol>${children}</ol>`;
    case "listItem": return `<li>${children}</li>`;
    case "taskList": return `<ul style="list-style:none;padding:0">${children}</ul>`;
    case "taskItem": {
      const checked = node.attrs?.checked ? "checked" : "";
      return `<li><input type="checkbox" ${checked} disabled> ${children}</li>`;
    }
    case "blockquote": return `<blockquote>${children}</blockquote>`;
    case "codeBlock": return `<pre><code>${children}</code></pre>`;
    case "table": return `<table>${children}</table>`;
    case "tableRow": return `<tr>${children}</tr>`;
    case "tableHeader": return `<th>${children}</th>`;
    case "tableCell": return `<td>${children}</td>`;
    case "hardBreak": return "<br>";
    case "horizontalRule": return "<hr>";
    case "calloutBlock": return `<div class="callout">${children}</div>`;
    default: return children;
  }
}

// ─── Tiptap JSON → Markdown walker ──────────────────────────

function tiptapJsonToMarkdown(node: JSONContent, depth = 0): string {
  if (!node) return "";

  if (node.type === "text") {
    let text = node.text || "";
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case "bold": text = `**${text}**`; break;
          case "italic": text = `*${text}*`; break;
          case "code": text = `\`${text}\``; break;
          case "link": text = `[${text}](${mark.attrs?.href || ""})`; break;
        }
      }
    }
    return text;
  }

  const children = (node.content || [])
    .map((c) => tiptapJsonToMarkdown(c, depth))
    .join("");

  switch (node.type) {
    case "doc": return children;
    case "paragraph": return `${children}\n\n`;
    case "heading": return `${"#".repeat(node.attrs?.level || 1)} ${children}\n\n`;
    case "bulletList":
      return (node.content || [])
        .map((item) => {
          const itemContent = (item.content || [])
            .map((c) => tiptapJsonToMarkdown(c, depth + 1))
            .join("")
            .trim();
          return `${"  ".repeat(depth)}- ${itemContent}`;
        })
        .join("\n") + "\n\n";
    case "orderedList":
      return (node.content || [])
        .map((item, i) => {
          const itemContent = (item.content || [])
            .map((c) => tiptapJsonToMarkdown(c, depth + 1))
            .join("")
            .trim();
          return `${"  ".repeat(depth)}${i + 1}. ${itemContent}`;
        })
        .join("\n") + "\n\n";
    case "listItem": return children;
    case "taskList":
      return (node.content || [])
        .map((item) => {
          const checked = item.attrs?.checked ? "x" : " ";
          const itemContent = (item.content || [])
            .map((c) => tiptapJsonToMarkdown(c, depth + 1))
            .join("")
            .trim();
          return `- [${checked}] ${itemContent}`;
        })
        .join("\n") + "\n\n";
    case "blockquote": return `> ${children.trim()}\n\n`;
    case "codeBlock": return `\`\`\`\n${children}\`\`\`\n\n`;
    case "horizontalRule": return "---\n\n";
    case "hardBreak": return "\n";
    default: return children;
  }
}

// ─── Tiptap JSON → DOCX paragraphs ─────────────────────────

function tiptapJsonToDocxParagraphs(
  node: JSONContent,
  docx: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Document: any; Paragraph: any; TextRun: any; HeadingLevel: any; AlignmentType: any;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const { Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any[] = [];

  function walkNode(n: JSONContent) {
    if (!n) return;

    switch (n.type) {
      case "doc":
        (n.content || []).forEach(walkNode);
        break;
      case "paragraph":
        result.push(
          new Paragraph({
            children: getTextRuns(n),
            alignment: AlignmentType.RIGHT,
          })
        );
        break;
      case "heading":
        result.push(
          new Paragraph({
            children: getTextRuns(n),
            heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][
              (n.attrs?.level || 1) - 1
            ],
            alignment: AlignmentType.RIGHT,
          })
        );
        break;
      case "bulletList":
      case "orderedList":
        (n.content || []).forEach((item) => {
          result.push(
            new Paragraph({
              children: getTextRuns(item),
              bullet: n.type === "bulletList" ? { level: 0 } : undefined,
              numbering: n.type === "orderedList" ? { reference: "default-numbering", level: 0 } : undefined,
              alignment: AlignmentType.RIGHT,
            })
          );
        });
        break;
      case "blockquote":
        (n.content || []).forEach((child) => {
          result.push(
            new Paragraph({
              children: [
                new TextRun({ text: "│ ", color: "6366f1" }),
                ...getTextRuns(child),
              ],
              alignment: AlignmentType.RIGHT,
            })
          );
        });
        break;
      default:
        (n.content || []).forEach(walkNode);
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getTextRuns(node: JSONContent): any[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runs: any[] = [];
    function walk(n: JSONContent) {
      if (n.type === "text") {
        const marks = n.marks || [];
        runs.push(
          new TextRun({
            text: n.text || "",
            bold: marks.some((m) => m.type === "bold"),
            italics: marks.some((m) => m.type === "italic"),
            underline: marks.some((m) => m.type === "underline") ? {} : undefined,
          })
        );
      } else {
        (n.content || []).forEach(walk);
      }
    }
    (node.content || []).forEach(walk);
    if (runs.length === 0) runs.push(new TextRun({ text: "" }));
    return runs;
  }

  walkNode(node);
  return result;
}

// ─── Helpers ────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
