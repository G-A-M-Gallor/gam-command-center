import { NextRequest } from 'next/server';
import { sendTextMessage, sendTemplateMessage, getMessages } from '@/lib/wati/client';
import { z } from 'zod';

const SendTextSchema = z.object({
  phone: z.string(),
  text: z.string(),
});

const SendTemplateSchema = z.object({
  phone: z.string(),
  templateName: z.string(),
  params: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })),
});

const GetMessagesSchema = z.object({
  phone: z.string(),
  pageSize: z.number().optional().default(50),
  pageNumber: z.number().optional().default(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'send_text': {
        const { phone, text } = SendTextSchema.parse(data);
        const result = await sendTextMessage(phone, text);
        return Response.json({ success: true, result });
      }

      case 'send_template': {
        const { phone, templateName, params } = SendTemplateSchema.parse(data);
        const result = await sendTemplateMessage(phone, templateName, params);
        return Response.json({ success: true, result });
      }

      case 'get_messages': {
        const { phone, pageSize, pageNumber } = GetMessagesSchema.parse(data);
        const messages = await getMessages(phone, pageSize, pageNumber);
        return Response.json({ success: true, messages });
      }

      default:
        return Response.json(
          { error: 'Invalid action. Use: send_text, send_template, get_messages' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('WATI messages API error:', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Failed to process WATI message request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');
    const pageSize = parseInt(url.searchParams.get('pageSize') ?? '50');
    const pageNumber = parseInt(url.searchParams.get('pageNumber') ?? '1');

    if (!phone) {
      return Response.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const messages = await getMessages(phone, pageSize, pageNumber);
    return Response.json({ success: true, messages });
  } catch (error) {
    console.error('WATI get messages error:', error);
    return Response.json(
      { error: 'Failed to get WATI messages' },
      { status: 500 }
    );
  }
}