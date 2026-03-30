// ===================================================
// GAM Command Center — Supabase Client (Legacy Re-export)
// ===================================================
// All existing imports of `supabase` from this file now use
// the cookie-aware browser client from @supabase/ssr.

import { createClient } from "@/lib/supabase/client";

export const supabase = createClient();
