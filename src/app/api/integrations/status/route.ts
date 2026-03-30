import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface IntegrationStatus {
  // Auth providers connected via Supabase identities
  providers: { provider: string; uid: string; email?: string }[];
  currentProvider: string;
  // Google accounts count from DB
  googleAccountsCount: number;
  // ENV-based service statuses
  services: {
    wati: boolean;
    voicenter: boolean;
    origami: boolean;
    notion: boolean;
    n8n: boolean;
  };
}

// GET /api/integrations/status — return status of all integrations
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Extract identity providers from user object
  const providers = (user.identities ?? []).map((id) => ({
    provider: id.provider,
    uid: id.id,
    email: id.identity_data?.email as string | undefined,
  }));

  const currentProvider = user.app_metadata?.provider ?? "email";

  // Count Google accounts from DB
  let googleAccountsCount = 0;
  try {
    const { count } = await supabase
      .from("google_accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    googleAccountsCount = count ?? 0;
  } catch {
    // table may not exist yet
  }

  // Check ENV vars for service integrations
  const services = {
    wati: !!(process.env.WATI_API_URL && process.env.WATI_API_TOKEN),
    voicenter: !!process.env.VOICENTER_API_KEY,
    origami: !!(process.env.ORIGAMI_API_KEY && process.env.ORIGAMI_BASE_URL),
    notion: !!process.env.NOTION_API_KEY,
    n8n: !!process.env.NEXT_PUBLIC_N8N_URL,
  };

  const result: IntegrationStatus = {
    providers,
    currentProvider,
    googleAccountsCount,
    services,
  };

  return NextResponse.json(result);
}
