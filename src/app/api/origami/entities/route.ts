import { NextResponse } from "next/server";

/**
 * Fetches Origami entity list.
 * Requires ORIGAMI_API_KEY and ORIGAMI_BASE_URL env vars.
 * When not configured, returns empty array so the UI falls back to demo data.
 */
export async function GET() {
  const apiKey = process.env.ORIGAMI_API_KEY;
  const baseUrl = process.env.ORIGAMI_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ entities: [], connected: false });
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/entities`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ entities: [], connected: false, error: `Origami returned ${res.status}` });
    }

    const data = await res.json();
    return NextResponse.json({ entities: data.entities || data, connected: true });
  } catch (err) {
    return NextResponse.json({ entities: [], connected: false, error: String(err) });
  }
}
