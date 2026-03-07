/** Extract plain text from Tiptap JSON content */
export function extractPlainText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const node = content as {
    type?: string;
    text?: string;
    content?: unknown[];
  };
  if (node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractPlainText).join(" ");
  }
  return "";
}
