// ===================================================
// GAM Command Center — AI Chat API Route
// Proxy to Claude API for PM context-aware chat
// ===================================================

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.messages || !body.system) {
      return NextResponse.json(
        { error: "Missing required fields: messages, system" },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI chat not configured" },
        { status: 503 }
      );
    }

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model || "claude-3-5-sonnet-20241022",
        max_tokens: body.max_tokens || 1000,
        system: body.system,
        messages: body.messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Claude API error:", error);
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}