import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { getClient, extractPlainText } from "@/lib/notion/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const CEO_INTAKE_DS = "938f1761-465b-4541-aa27-e7bc1a327375";

export interface CeoIntakeItem {
  id: string;
  url: string;
  number: string;
  title: string;
  codeName: string;
  urgency: string;
  impact: string;
  status: string;
  category: string;
  directiveType: string;
  immediate: boolean;
  queueScore: number;
  notes: string;
  claudeResponse: string;
  expectedDeliverable: string;
  createdAt: string;
  completedAt: string;
}

// GET /api/ceo-intake — active queue items
export async function GET(request: Request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { error: "Notion not configured" },
      { status: 502 },
    );
  }

  const { searchParams } = new URL(request.url);
  const showCompleted = searchParams.get("completed") === "true";

  try {
    const filter = showCompleted
      ? {
          property: "סטטוס ביצוע",
          select: { equals: "✅ אושר" },
        }
      : {
          and: [
            {
              property: "סטטוס ביצוע",
              select: { does_not_equal: "✅ אושר" },
            },
            {
              property: "סטטוס ביצוע",
              select: { does_not_equal: "🚫 בוטל" },
            },
          ],
        };

    const response = await client.dataSources.query({
      data_source_id: CEO_INTAKE_DS,
      filter: filter as never,
      page_size: 50,
    });

    const items: CeoIntakeItem[] = response.results
      .filter(
        (r): r is PageObjectResponse =>
          "object" in r && r.object === "page" && "properties" in r,
      )
      .map((page) => {
        const p = page.properties;
        return {
          id: page.id,
          url: page.url,
          number: extractPlainText(p["#"]),
          title: extractPlainText(p["בקשה"]),
          codeName: extractPlainText(p["שם קוד"]),
          urgency: extractPlainText(p["דחיפות"]),
          impact: extractPlainText(p["אימפקט"]),
          status: extractPlainText(p["סטטוס ביצוע"]),
          category: extractPlainText(p["קטגוריה"]),
          directiveType: extractPlainText(p["סוג הנחיה"]),
          immediate: extractPlainText(p["⚡ מיידי"]) === "true",
          queueScore: Number(extractPlainText(p["ציון תור"])) || 99,
          notes: extractPlainText(p["הערות גל"]),
          claudeResponse: extractPlainText(p["תגובת Claude"]),
          expectedDeliverable: extractPlainText(p["תוצר צפוי"]),
          createdAt: extractPlainText(p["תאריך"]),
          completedAt: extractPlainText(p["תאריך השלמה"]),
        };
      })
      .sort((a, b) => a.queueScore - b.queueScore);

    return NextResponse.json(
      {
        items,
        counts: {
          total: items.length,
          immediate: items.filter((i) => i.immediate).length,
          inProgress: items.filter((i) => i.status === "🔵 בעבודה").length,
          waiting: items.filter((i) => i.status === "⏳ בתור").length,
          questions: items.filter((i) => i.status === "❓ שאלה לגל").length,
          forReview: items.filter((i) => i.status === "🟡 לבדיקת CEO").length,
        },
      },
      { headers: { "Cache-Control": "private, s-maxage=60" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch CEO intake";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
