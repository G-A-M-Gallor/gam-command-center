#!/usr/bin/env node

/**
 * WATI MCP Server - Local
 *
 * Uses the existing WATI client from src/lib/wati/client.ts
 * Requires: WATI_API_URL + WATI_API_TOKEN env vars
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Simple fetch-based WATI client (copying the logic from your client.ts)
function getConfig() {
  const baseUrl = process.env.WATI_API_URL;
  const token = process.env.WATI_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error('WATI_API_URL and WATI_API_TOKEN must be configured');
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), token };
}

async function watiRequest(path, options = {}) {
  const { baseUrl, token } = getConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`WATI API error ${res.status}: ${text}`);
  }

  return res.json();
}

function normalizePhone(phone) {
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('0') && digits.length === 10) {
    digits = '972' + digits.slice(1);
  }

  if (!digits.startsWith('972') && digits.length === 9) {
    digits = '972' + digits;
  }

  return digits;
}

// WATI API functions
async function getContacts(pageSize = 50, pageNumber = 1) {
  const data = await watiRequest(
    `/api/v1/getContacts?pageSize=${pageSize}&pageNumber=${pageNumber}`
  );
  return data.contact_list || [];
}

async function getMessages(phone, pageSize = 50, pageNumber = 1) {
  const normalized = normalizePhone(phone);
  const data = await watiRequest(
    `/api/v1/getMessages/${normalized}?pageSize=${pageSize}&pageNumber=${pageNumber}`
  );
  return data.messages?.items || [];
}

async function sendTextMessage(phone, text) {
  const normalized = normalizePhone(phone);
  return watiRequest(
    `/api/v1/sendSessionMessage/${normalized}`,
    {
      method: 'POST',
      body: JSON.stringify({ messageText: text }),
    }
  );
}

async function sendTemplateMessage(phone, templateName, params) {
  const normalized = normalizePhone(phone);
  return watiRequest(
    `/api/v1/sendTemplateMessage/${normalized}`,
    {
      method: 'POST',
      body: JSON.stringify({
        template_name: templateName,
        broadcast_name: `cc_${Date.now()}`,
        parameters: params,
      }),
    }
  );
}

async function getMessageTemplates() {
  const data = await watiRequest('/api/v1/getMessageTemplates');
  return data.messageTemplates || [];
}

// MCP Server
const server = new Server(
  {
    name: 'wati-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'wati_get_contacts',
        description: 'Get WATI WhatsApp contacts list',
        inputSchema: {
          type: 'object',
          properties: {
            pageSize: { type: 'number', description: 'Number of contacts per page (default: 50)' },
            pageNumber: { type: 'number', description: 'Page number (default: 1)' },
          },
        },
      },
      {
        name: 'wati_get_messages',
        description: 'Get WhatsApp messages for a phone number',
        inputSchema: {
          type: 'object',
          properties: {
            phone: { type: 'string', description: 'Phone number (E.164 or Israeli format)' },
            pageSize: { type: 'number', description: 'Number of messages per page (default: 50)' },
            pageNumber: { type: 'number', description: 'Page number (default: 1)' },
          },
          required: ['phone'],
        },
      },
      {
        name: 'wati_send_message',
        description: 'Send a text WhatsApp message',
        inputSchema: {
          type: 'object',
          properties: {
            phone: { type: 'string', description: 'Phone number (E.164 or Israeli format)' },
            text: { type: 'string', description: 'Message text to send' },
          },
          required: ['phone', 'text'],
        },
      },
      {
        name: 'wati_send_template',
        description: 'Send a WhatsApp template message',
        inputSchema: {
          type: 'object',
          properties: {
            phone: { type: 'string', description: 'Phone number (E.164 or Israeli format)' },
            templateName: { type: 'string', description: 'Template name' },
            params: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'string' },
                },
                required: ['name', 'value'],
              },
              description: 'Template parameters',
            },
          },
          required: ['phone', 'templateName', 'params'],
        },
      },
      {
        name: 'wati_get_templates',
        description: 'Get approved WhatsApp message templates',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'wati_get_contacts': {
        const contacts = await getContacts(args.pageSize, args.pageNumber);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(contacts, null, 2),
            },
          ],
        };
      }

      case 'wati_get_messages': {
        const messages = await getMessages(args.phone, args.pageSize, args.pageNumber);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(messages, null, 2),
            },
          ],
        };
      }

      case 'wati_send_message': {
        const result = await sendTextMessage(args.phone, args.text);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'wati_send_template': {
        const result = await sendTemplateMessage(args.phone, args.templateName, args.params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'wati_get_templates': {
        const templates = await getMessageTemplates();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(templates, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new Error(`WATI MCP Error: ${error.message}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WATI MCP server running');
}

main().catch((error) => {
  console.error('Failed to start WATI MCP server:', error);
  process.exit(1);
});