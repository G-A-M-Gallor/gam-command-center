import { NextResponse } from "next/server";
import { createGoogleAuth } from "@/lib/google/driveAuth";

/**
 * GET /api/google/auth - Get Google OAuth URL
 */
export async function GET() {
  try {
    const googleAuth = createGoogleAuth();
    const authUrl = googleAuth.getAuthUrl();
    
    return NextResponse.json({ authUrl });
  } catch (error: unknown) {
    console.error("Error generating Google auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
