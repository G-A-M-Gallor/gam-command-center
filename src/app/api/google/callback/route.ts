import { NextRequest, NextResponse } from "next/server";
import { createGoogleAuth } from "@/lib/google/driveAuth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/google/callback - Handle Google OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code not found" },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const googleAuth = createGoogleAuth();
    const tokens = await googleAuth.getTokens(code);

    // Save tokens to database (simplified for now)
    console.log('Received Google tokens:', {
      access_token: tokens.access_token ? '***' : 'missing',
      refresh_token: tokens.refresh_token ? '***' : 'missing',
      expiry_date: tokens.expiry_date
    });

    // For now, redirect back to courses page
    return NextResponse.redirect(
      new URL('/dashboard/vcloud?tab=courses&connected=true', request.url)
    );

  } catch (error: any) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL('/dashboard/vcloud?tab=courses&error=auth_failed', request.url)
    );
  }
}
