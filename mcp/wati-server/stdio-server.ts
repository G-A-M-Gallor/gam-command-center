import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const WATI_API_URL = "https://live-mt-server.wati.io/102586";
const WATI_API_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImdhbG1pbGxlcjY5QGdtYWlsLmNvbSIsIm5hbWVpZCI6ImdhbG1pbGxlcjY5QGdtYWlsLmNvbSIsImVtYWlsIjoiZ2FsbWlsbGVyNjlAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDkvMjAyNiAyMjozMToxNCIsInRlbmFudF9pZCI6IjEwMjU4NiIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.yneQRQ5CO-5QK2ZBD7VgaP9SYKlAf8z3k2JK9saARLI";

async function watiGet(path: string, params?: Record<string, string>) {
  const url = new URL(`${WATI_API_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${WATI_API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`WATI API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function watiPost(path: string, body: unknown) {
  const res = await fetch(`${WATI_API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WATI_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`WATI API ${res.status}: ${await res.text()}`);
  return res.json();
}

const server = new McpServer({ name: "wati", version: "1.0.0" });

server.tool(
  "get_contacts",
  "Get WATI WhatsApp contacts with pagination",
  {
    pageSize: z.number().min(1).max(100).default(20),
    pageNumber: z.number().min(1).default(1),
    name: z.string().optional().describe("Filter by name"),
  },
  async ({ pageSize, pageNumber, name }) => {
    const params: Record<string, string> = {
      pageSize: String(pageSize),
      pageNumber: String(pageNumber),
    };
    if (name) params.name = name;
    const data = await watiGet("/api/v1/getContacts", params);
    const contacts = (data.contact_list || []).map(
      (c: { fullName?: string; phone?: string; contactStatus?: string; lastUpdated?: string; source?: string; customParams?: { name: string; value: string }[] }) => ({
        name: c.fullName || "Unknown",
        phone: c.phone,
        status: c.contactStatus,
        lastUpdated: c.lastUpdated,
        source: c.source,
        leadStage: c.customParams?.find((p: { name: string }) => p.name === "lead_stage")?.value,
      })
    );
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ total: data.link?.total || 0, contacts }, null, 2) }],
    };
  }
);

server.tool(
  "get_messages",
  "Get WhatsApp messages for a contact by phone number",
  {
    phone: z.string().describe("Phone number, e.g. 972501234567"),
    pageSize: z.number().min(1).max(50).default(20),
  },
  async ({ phone, pageSize }) => {
    const data = await watiGet(`/api/v1/getMessages/${phone}`, { pageSize: String(pageSize) });
    const messages = (data.messages?.items || [])
      .filter((m: { type: string | number }) => m.type === "text" || m.type === "image" || m.type === "document")
      .map((m: { text?: string; owner?: boolean; created?: string; type?: string }) => ({
        text: m.text || "",
        from: m.owner ? "agent" : "contact",
        timestamp: m.created,
        type: m.type,
      }));
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ phone, count: messages.length, messages }, null, 2) }],
    };
  }
);

server.tool(
  "send_message",
  "Send a WhatsApp session message (within 24h window)",
  {
    phone: z.string().describe("Phone number, e.g. 972501234567"),
    message: z.string().describe("Message text"),
  },
  async ({ phone, message }) => {
    const data = await watiPost(`/api/v1/sendSessionMessage/${phone}`, { messageText: message });
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: data.result === "success", response: data }, null, 2) }],
    };
  }
);

server.tool(
  "send_template",
  "Send a WhatsApp template message (works outside 24h window)",
  {
    phone: z.string().describe("Phone number"),
    templateName: z.string().describe("Template name from WATI"),
    broadcastName: z.string().default("api_send"),
    parameters: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  },
  async ({ phone, templateName, broadcastName, parameters }) => {
    const data = await watiPost(`/api/v2/sendTemplateMessage/${phone}`, {
      template_name: templateName,
      broadcast_name: broadcastName,
      parameters: parameters || [],
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: data.result === "success", response: data }, null, 2) }],
    };
  }
);

server.tool("get_templates", "List available WhatsApp message templates", {}, async () => {
  const data = await watiGet("/api/v1/getMessageTemplates");
  const templates = (data.messageTemplates || []).map(
    (t: { elementName?: string; status?: string; category?: string; body?: string }) => ({
      name: t.elementName,
      status: t.status,
      category: t.category,
      body: t.body,
    })
  );
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ count: templates.length, templates }, null, 2) }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
