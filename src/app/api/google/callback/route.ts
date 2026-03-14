import { NextRequest, NextResponse } from "next/server";
import { verifySignedState, exchangeCode, getUserInfo } from "@/lib/google/oauth";
import { upsertGoogleAccount } from "@/lib/google/googleAccountQueries";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const settingsUrl = `${baseUrl}/dashboard/settings?tab=accounts`;

  // User denied consent
  if (error) {
    return NextResponse.redirect(`${settingsUrl}&error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}&error=missing_params`);
  }

  // Verify CSRF state
  const payload = verifySignedState(state);
  if (!payload) {
    return NextResponse.redirect(`${settingsUrl}&error=invalid_state`);
  }

  try {
    // Exchange authorization code for tokens
    const tokens = await exchangeCode(code);

    // Get user profile from Google
    const userInfo = await getUserInfo(tokens.access_token);

    // Store encrypted tokens in DB
    const scopes = tokens.scope.split(" ").filter(Boolean);

    await upsertGoogleAccount({
      userId: payload.userId,
      googleUserId: userInfo.id,
      googleEmail: userInfo.email,
      displayName: userInfo.name || null,
      avatarUrl: userInfo.picture || null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scopes,
    });

    return NextResponse.redirect(`${settingsUrl}&connected=true`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${settingsUrl}&error=exchange_failed`);
  }
}
