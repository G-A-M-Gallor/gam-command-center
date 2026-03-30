import { NextResponse } from "next/server";
import { _createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

/** Returns the list of installed component slugs from src/components/ui/ */
export async function GET() {
  // Verify user session via cookie
  const supabase = await createClient();
  const { data: { _user } } = await supabase.auth.getUser();
  if (!_user) {
    return NextResponse.json({ slugs: [] });
  }

  try {
    const uiDir = path.join(process.cwd(), "src", "components", "ui");
    const files = fs.readdirSync(uiDir);
    const slugs = files
      .filter((f) => f.endsWith(".tsx") && f !== "index.tsx")
      .map((f) => f.replace(".tsx", "").toLowerCase());
    return NextResponse.json({ slugs });
  } catch {
    return NextResponse.json({ slugs: [] });
  }
}
