import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function SharedDocPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Fetch share record
  const { data: share } = await supabase
    .from("doc_shares")
    .select("document_id, is_active")
    .eq("share_token", token)
    .eq("is_active", true)
    .single();

  if (!share) notFound();

  // Fetch document
  const { data: doc } = await supabase
    .from("vb_records")
    .select("title, content")
    .eq("id", share.document_id)
    .single();

  if (!doc) notFound();

  // Simple Tiptap JSON → HTML renderer (server-side)
  const html = renderTiptapToHtml(doc.content);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <span className="text-xs text-slate-500">vBrain.io — Shared Document</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-100">{doc.title}</h1>
        </div>
        <article
          className="prose prose-invert prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderTiptapToHtml(node: any): string {
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
          case "link": text = `<a href="${escapeHtml(mark.attrs?.href || "")}" target="_blank" rel="noopener">${text}</a>`; break;
          case "highlight": text = `<mark>${text}</mark>`; break;
        }
      }
    }
    return text;
  }

  const children = (node.content || []).map(renderTiptapToHtml).join("");

  switch (node.type) {
    case "doc": return children;
    case "paragraph": return `<p>${children || "&nbsp;"}</p>`;
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
    case "hardBreak": return "<br>";
    case "horizontalRule": return "<hr>";
    default: return children;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
