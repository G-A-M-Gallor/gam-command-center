import { NextResponse } from "next/server";

/**
 * GET /api/push/config
 * Returns the VAPID public key for client-side push subscription.
 * This avoids relying on NEXT_PUBLIC_ build-time injection.
 */
export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json({ vapidPublicKey: null });
  }

  return NextResponse.json({ vapidPublicKey });
}
