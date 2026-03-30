import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { getMyTasks, getProjectStatus } from "@/lib/notion/client";

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult.error !== null) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view"); // "status" for summary, default for tasks list
  const statusFilter = searchParams.get("status") ?? undefined;

  try {
    if (view === "status") {
      const status = await getProjectStatus();
      return NextResponse.json(status);
    }

    const tasks = await getMyTasks(statusFilter);
    return NextResponse.json({ tasks, count: tasks.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Notion API error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
