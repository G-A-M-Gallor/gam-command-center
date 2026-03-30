import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

const completeRegistrationSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100).trim(),
});

export async function POST(request: Request) {
  // Rate limit — auth routes get brute-force protection
  const rl = checkRateLimit(request, RATE_LIMITS.auth);
  if (rl.limited) return rl.response;

  // Verify the user is authenticated via cookie session
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = completeRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid request' },
      { status: 400 },
    );
  }

  const { displayName } = parsed.data;

  // Use service role for privileged operations
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Set app_metadata.role = 'external' for self-registered users
  // This is the most restrictive role — admin can promote later
  const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
    app_metadata: { role: 'external' },
    user_metadata: { display_name: displayName },
  });

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update user metadata' },
      { status: 500 },
    );
  }

  // Upsert user_profiles with role = 'client' (DB label for self-registered users)
  const { error: profileError } = await adminClient
    .from('user_profiles')
    .upsert(
      {
        id: user.id,
        email: user.email,
        display_name: displayName,
        role: 'client',
      },
      { onConflict: 'id' },
    );

  if (profileError) {
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
