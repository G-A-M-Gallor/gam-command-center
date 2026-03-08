import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Returns the list of installed component slugs from src/components/ui/ */
export async function GET() {
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
