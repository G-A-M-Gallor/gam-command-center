import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { z } from "zod";

// --- Config ---
const WATI_API_URL =
  process.env.WATI_API_URL || "https://live-mt-server.wati.io/102586";
const WATI_API_TOKEN = process.env.WATI_API_TOKEN || "";
const PORT = parseInt(process.env.PORT || "3100", 10);
const AUTH_SECRET = process.env.MCP_AUTH_SECRET || "";

if (!WATI_API_TOKEN) {
  console.error("WATI_API_TOKEN is required");
  process.exit(1);
}

// --- WATI API helpers ---
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
  if (!res.ok) {
    throw new Error(`WATI API ${res.status}: ${await res.text()}`);
  }
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
  if (!res.ok) {
    throw new Error(`WATI API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// --- MCP Server ---
const server = new McpServer({
  name: "wati",
  version: "1.0.0",
});

// Tool: Get contacts
server.tool(
  "get_contacts",
  "Get WATI WhatsApp contacts with pagination. Returns contact name, phone, status, last update, and custom params.",
  {
    pageSize: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Number of contacts per page"),
    pageNumber: z.number().min(1).default(1).describe("Page number"),
    name: z
      .string()
      .optional()
      .describe("Filter by contact name (partial match)"),
  },
  async ({ pageSize, pageNumber, name }) => {
    const params: Record<string, string> = {
      pageSize: String(pageSize),
      pageNumber: String(pageNumber),
    };
    if (name) params.name = name;

    const data = await watiGet("/api/v1/getContacts", params);
    const contacts = (data.contact_list || []).map(
      (c: {
        fullName?: string;
        phone?: string;
        contactStatus?: string;
        lastUpdated?: string;
        source?: string;
        customParams?: { name: string; value: string }[];
      }) => ({
        name: c.fullName || "Unknown",
        phone: c.phone,
        status: c.contactStatus,
        lastUpdated: c.lastUpdated,
        source: c.source,
        leadStage: c.customParams?.find(
          (p: { name: string }) => p.name === "lead_stage"
        )?.value,
      })
    );

    const total = data.link?.total || 0;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ total, contacts }, null, 2),
        },
      ],
    };
  }
);

// Tool: Get messages for a contact
server.tool(
  "get_messages",
  "Get WhatsApp messages for a specific contact by phone number. Returns text messages (filters out system events).",
  {
    phone: z
      .string()
      .describe(
        "WhatsApp phone number (e.g. 972501234567, without + prefix)"
      ),
    pageSize: z
      .number()
      .min(1)
      .max(50)
      .default(20)
      .describe("Number of messages to fetch"),
  },
  async ({ phone, pageSize }) => {
    const data = await watiGet(`/api/v1/getMessages/${phone}`, {
      pageSize: String(pageSize),
    });
    const items = data.messages?.items || [];
    const messages = items
      .filter(
        (m: { type: string | number }) =>
          m.type === "text" || m.type === "image" || m.type === "document"
      )
      .map(
        (m: {
          text?: string;
          owner?: boolean;
          created?: string;
          type?: string;
        }) => ({
          text: m.text || "",
          from: m.owner ? "agent" : "contact",
          timestamp: m.created,
          type: m.type,
        })
      );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { phone, count: messages.length, messages },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Send a session message
server.tool(
  "send_message",
  "Send a WhatsApp session message to a contact. Only works within 24h window of last received message.",
  {
    phone: z
      .string()
      .describe("WhatsApp phone number (e.g. 972501234567)"),
    message: z.string().describe("Message text to send"),
  },
  async ({ phone, message }) => {
    const data = await watiPost(
      `/api/v1/sendSessionMessage/${phone}`,
      { messageText: message }
    );
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { success: data.result === "success", response: data },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Send a template message
server.tool(
  "send_template",
  "Send a WhatsApp template message to a contact. Works outside 24h window.",
  {
    phone: z
      .string()
      .describe("WhatsApp phone number (e.g. 972501234567)"),
    templateName: z.string().describe("Template name as defined in WATI"),
    parameters: z
      .array(z.object({ name: z.string(), value: z.string() }))
      .optional()
      .describe("Template parameters"),
    broadcastName: z
      .string()
      .default("api_send")
      .describe("Broadcast name for tracking"),
  },
  async ({ phone, templateName, parameters, broadcastName }) => {
    const data = await watiPost(
      `/api/v2/sendTemplateMessage/${phone}`,
      {
        template_name: templateName,
        broadcast_name: broadcastName,
        parameters: parameters || [],
      }
    );
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { success: data.result === "success", response: data },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Get contact details
server.tool(
  "get_contact",
  "Get detailed info about a specific WATI contact including all custom parameters.",
  {
    phone: z
      .string()
      .describe("WhatsApp phone number (e.g. 972501234567)"),
  },
  async ({ phone }) => {
    const data = await watiGet("/api/v1/getContacts", {
      pageSize: "1",
      pageNumber: "1",
      attribute: JSON.stringify([
        { name: "phone", operator: "==", value: phone },
      ]),
    });
    const contact = data.contact_list?.[0];
    if (!contact) {
      return {
        content: [
          { type: "text" as const, text: `Contact ${phone} not found` },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              name: contact.fullName,
              phone: contact.phone,
              status: contact.contactStatus,
              source: contact.source,
              created: contact.created,
              lastUpdated: contact.lastUpdated,
              leadStage: contact.customParams?.find(
                (p: { name: string }) => p.name === "lead_stage"
              )?.value,
              customParams: Object.fromEntries(
                (
                  contact.customParams || []
                ).map((p: { name: string; value: string }) => [p.name, p.value])
              ),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Get message templates
server.tool(
  "get_templates",
  "List available WhatsApp message templates from WATI.",
  {},
  async () => {
    const data = await watiGet("/api/v1/getMessageTemplates");
    const templates = (data.messageTemplates || []).map(
      (t: {
        elementName?: string;
        status?: string;
        category?: string;
        body?: string;
      }) => ({
        name: t.elementName,
        status: t.status,
        category: t.category,
        body: t.body,
      })
    );
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ count: templates.length, templates }, null, 2),
        },
      ],
    };
  }
);

// --- Express + SSE transport ---
const app = express();
app.use(cors());

// Simple auth middleware
if (AUTH_SECRET) {
  app.use((req, res, next) => {
    // Skip health check
    if (req.path === "/health") return next();
    const token =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.query.token;
    if (token !== AUTH_SECRET) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  });
}

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", server: "wati-mcp", version: "1.0.0" });
});

// SSE transport
const transports = new Map<string, SSEServerTransport>();

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);

  res.on("close", () => {
    transports.delete(transport.sessionId);
  });

  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.listen(PORT, () => {
  console.log(`WATI MCP server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
