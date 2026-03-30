import { NextRequest, NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/google/tokenManager";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessageMeta {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload?: {
    headers?: GmailHeader[];
  };
  internalDate?: string;
}

function getHeader(_headers: GmailHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

// GET /api/google/gmail?account_id=xxx&limit=10
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { _user } } = await supabase.auth.getUser();

  if (!_user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const params = new URL(_request.url).searchParams;
  const accountId = params.get("account_id");
  if (!accountId) {
    return NextResponse.json({ error: "Missing account_id" }, { status: 400 });
  }

  const limit = Math.min(Math.max(parseInt(params.get("limit") || "10", 10) || 10, 1), 20);

  try {
    const accessToken = await getValidAccessToken(accountId, _user.id);

    // 1. List message IDs
    const listRes = await fetch(
      `${GMAIL_API}/messages?maxResults=${limit}&q=in:inbox`,
      { _headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const err = await listRes.text();
      throw new Error(`Gmail list failed: ${err}`);
    }

    const listData = await listRes.json();
    const messageIds: string[] = (listData.messages || []).map((m: { id: string }) => m.id);

    if (messageIds.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    // 2. Batch fetch metadata for each message
    const fetchPromises = messageIds.map(async (id) => {
      const res = await fetch(
        `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { _headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) return null;
      return res.json() as Promise<GmailMessageMeta>;
    });

    const rawMessages = await Promise.all(fetchPromises);

    const messages = rawMessages
      .filter((m): m is GmailMessageMeta => m !== null)
      .map((m) => ({
        id: m.id,
        threadId: m.threadId,
        subject: getHeader(m.payload?._headers, "Subject") || "(no subject)",
        from: getHeader(m.payload?._headers, "From"),
        date: m.internalDate
          ? new Date(parseInt(m.internalDate, 10)).toISOString()
          : getHeader(m.payload?._headers, "Date"),
        snippet: m.snippet,
        isUnread: m.labelIds?.includes("UNREAD") ?? false,
      }));

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("Gmail API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch Gmail" },
      { status: 500 }
    );
  }
}
