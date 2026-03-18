/**
 * Seed matching demo data: 5 clients + 20 talents
 * All tagged with meta.__seed_demo = true for easy cleanup.
 *
 * Run:   npx tsx scripts/seed-matching-demo.ts
 * Clean: npx tsx scripts/seed-matching-demo.ts --clean
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// We'll fetch the workspace_id and entity_id from existing records
let WORKSPACE_ID = "";
let ENTITY_ID = "";

// ─── Construction skills pool (Israel context) ──────────
const SKILLS = [
  "חשמל", "אינסטלציה", "טיח", "ריצוף", "צבע", "גבס", "ברזל", "בטון",
  "שיפוצים", "איטום", "מיזוג אוויר", "אלומיניום", "נגרות", "הנדסת מבנים",
  "ריתוך", "עבודות עפר", "קונסטרוקציה", "חיפוי אבן", "גינון", "פיקוח"
];

const AREAS = [
  "תל אביב", "ירושלים", "חיפה", "באר שבע", "נתניה",
  "ראשון לציון", "פתח תקווה", "אשדוד", "רמת גן", "הרצליה",
  "מרכז", "שרון", "שפלה", "צפון", "דרום"
];

const FIRST_NAMES = [
  "יוסי", "מוחמד", "אלכס", "דוד", "סרגיי", "אחמד", "ויקטור", "משה",
  "עלי", "אנדריי", "חסן", "אריק", "ניקולאי", "עומר", "ולדימיר",
  "איברהים", "בוריס", "יעקב", "כמאל", "רומן"
];

const LAST_NAMES = [
  "כהן", "אבו-חמד", "פטרוב", "לוי", "סמירנוב", "חסן", "קוזלוב", "מזרחי",
  "עבאס", "איבנוב", "סעיד", "אזולאי", "וולקוב", "נסאר", "גרינברג",
  "מנסור", "שפירו", "דהן", "ג׳בארין", "פופוב"
];

// ─── Helper functions ───────────────────────────────────

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function futureDate(daysMin: number, daysMax: number): string {
  const d = new Date();
  d.setDate(d.getDate() + rand(daysMin, daysMax));
  return d.toISOString().split("T")[0];
}

// ─── Generate 5 Clients (requesting recruitment) ────────

function generateClients() {
  const companies = [
    {
      name: "[דוגמה] שיכון ובינוי — גיוס עובדי בניין",
      description: "חברת בנייה גדולה מחפשת 15 עובדי בניין מיומנים לפרויקט מגורים בתל אביב",
      required_skills: ["בטון", "ברזל", "טיח", "ריצוף"],
      service_area: ["תל אביב", "רמת גן", "מרכז"],
      budget_min: 800000, budget_max: 1200000,
      workers_needed: 15,
      start_date: futureDate(7, 14), end_date: futureDate(180, 365),
    },
    {
      name: "[דוגמה] אלקטרה בנייה — חשמלאים ואינסטלטורים",
      description: "דרושים חשמלאים ואינסטלטורים מוסמכים לפרויקט משרדים בהרצליה",
      required_skills: ["חשמל", "אינסטלציה", "מיזוג אוויר"],
      service_area: ["הרצליה", "נתניה", "שרון"],
      budget_min: 500000, budget_max: 800000,
      workers_needed: 8,
      start_date: futureDate(14, 30), end_date: futureDate(120, 240),
    },
    {
      name: "[דוגמה] דניה סיבוס — פרויקט שיפוץ ירושלים",
      description: "פרויקט שיפוץ מבנה ציבורי בירושלים. דרושים בעלי מקצוע מגוונים",
      required_skills: ["שיפוצים", "צבע", "גבס", "נגרות", "חיפוי אבן"],
      service_area: ["ירושלים"],
      budget_min: 300000, budget_max: 600000,
      workers_needed: 12,
      start_date: futureDate(30, 60), end_date: futureDate(90, 180),
    },
    {
      name: "[דוגמה] אפריקה ישראל — פרויקט מגדל חיפה",
      description: "בניית מגדל מגורים בחיפה. צוות קונסטרוקציה מלא כולל מנופאים ומפקחים",
      required_skills: ["קונסטרוקציה", "בטון", "ברזל", "פיקוח", "עבודות עפר"],
      service_area: ["חיפה", "צפון"],
      budget_min: 2000000, budget_max: 3500000,
      workers_needed: 25,
      start_date: futureDate(0, 7), end_date: futureDate(365, 730),
    },
    {
      name: "[דוגמה] מנרב — שיפוצים ואיטום נגב",
      description: "פרויקט תחזוקה ושיפוץ מבני מגורים בבאר שבע ואשדוד. דרושים מומחי איטום וצבע",
      required_skills: ["איטום", "צבע", "טיח", "אלומיניום"],
      service_area: ["באר שבע", "אשדוד", "דרום"],
      budget_min: 200000, budget_max: 400000,
      workers_needed: 10,
      start_date: futureDate(7, 21), end_date: futureDate(60, 120),
    },
  ];

  return companies.map((c) => ({
    title: c.name,
    entity_type: "client",
    record_type: "entity",
    source: "manual",
    status: "active",
    workspace_id: WORKSPACE_ID,
    entity_id: ENTITY_ID,
    meta: {
      __seed_demo: true,
      business: c.name.replace("[דוגמה] ", ""),
      description: c.description,
      required_skills: c.required_skills,
      service_area: c.service_area,
      budget_min: c.budget_min,
      budget_max: c.budget_max,
      budget: Math.round((c.budget_min + c.budget_max) / 2),
      workers_needed: c.workers_needed,
      start_date: c.start_date,
      end_date: c.end_date,
      phone: `05${rand(0, 4)}${rand(1000000, 9999999)}`,
      email: `demo@${c.name.split("—")[0].trim().replace(/[\[\]דוגמה ]/g, "").trim().toLowerCase()}.co.il`,
    },
  }));
}

// ─── Generate 20 Talents / Workers ──────────────────────

function generateTalents() {
  return FIRST_NAMES.map((firstName, i) => {
    const lastName = LAST_NAMES[i];
    const numSkills = rand(2, 5);
    const skills = pick(SKILLS, numSkills);
    const areas = pick(AREAS, rand(1, 3));
    const experienceYears = rand(1, 20);
    const age = rand(22, 55);

    // Generate a realistic CV-like description
    const cvSummary = [
      `${firstName} ${lastName}, בן ${age}`,
      `ניסיון של ${experienceYears} שנים בתחום הבנייה`,
      `התמחות: ${skills.join(", ")}`,
      `אזורי עבודה מועדפים: ${areas.join(", ")}`,
      experienceYears > 10 ? "בעל ניסיון ניהולי" : "",
      experienceYears > 5 ? "עבד בפרויקטים גדולים" : "עובד חרוץ ולומד מהר",
    ].filter(Boolean).join(". ");

    return {
      title: `[דוגמה] ${firstName} ${lastName}`,
      entity_type: "employee",
      record_type: "entity",
      source: "manual",
      status: "active",
      workspace_id: WORKSPACE_ID,
    entity_id: ENTITY_ID,
      meta: {
        __seed_demo: true,
        full_name: `${firstName} ${lastName}`,
        skills,
        experience_years: experienceYears,
        location: areas,
        preferred_areas: areas,
        age,
        phone: `05${rand(0, 4)}${rand(1000000, 9999999)}`,
        email: `${firstName.toLowerCase()}.demo@example.com`,
        available_from: futureDate(0, 14),
        available_to: futureDate(90, 365),
        description: cvSummary,
        notes: cvSummary,
        hourly_rate: rand(45, 120),
        has_vehicle: Math.random() > 0.5,
        has_safety_certification: Math.random() > 0.3,
        languages: pick(["עברית", "ערבית", "רוסית", "אנגלית", "רומנית", "אמהרית"], rand(1, 3)),
        // Capacity field for matching engine
        capacity: rand(1, 5),
      },
    };
  });
}

// ─── Main ───────────────────────────────────────────────

async function clean() {
  console.log("🧹 Cleaning demo data...");

  // Find demo records by meta.__seed_demo flag
  const { data: demoRecords } = await supabase
    .from("vb_records")
    .select("id")
    .contains("meta", { __seed_demo: true });

  if (demoRecords && demoRecords.length > 0) {
    const ids = demoRecords.map((r) => r.id);

    // Delete note_relations
    await supabase.from("note_relations").delete().in("source_id", ids);
    await supabase.from("note_relations").delete().in("target_id", ids);

    // Delete matching_scores
    await supabase.from("matching_scores").delete().in("source_id", ids);
    await supabase.from("matching_scores").delete().in("target_id", ids);

    // Delete the records themselves
    const { error, count } = await supabase
      .from("vb_records")
      .delete()
      .contains("meta", { __seed_demo: true });

    if (error) {
      console.error("❌ Error:", error.message);
    } else {
      console.log(`✅ Deleted ${count ?? ids.length} demo records + related data`);
    }
  } else {
    console.log("ℹ️  No demo records found");
  }
}

async function seed() {
  console.log("🌱 Seeding matching demo data...");

  // Get workspace_id and entity_id from existing records
  const { data: existing } = await supabase
    .from("vb_records")
    .select("workspace_id, entity_id")
    .not("workspace_id", "is", null)
    .limit(1);
  WORKSPACE_ID = existing?.[0]?.workspace_id || "3ecaf990-43ef-4b91-9956-904a8b97b851";
  ENTITY_ID = existing?.[0]?.entity_id || WORKSPACE_ID;

  const clients = generateClients();
  const talents = generateTalents();
  const all = [...clients, ...talents];

  console.log(`  → ${clients.length} clients (requesting recruitment)`);
  console.log(`  → ${talents.length} talents/workers`);

  const { data, error } = await supabase
    .from("vb_records")
    .insert(all)
    .select("id, title, entity_type");

  if (error) {
    console.error("❌ Error inserting:", error.message);
    process.exit(1);
  }

  console.log(`\n✅ Inserted ${data.length} records:`);
  for (const r of data) {
    const icon = r.entity_type === "client" ? "🏢" : "👷";
    console.log(`  ${icon} ${r.title}`);
  }

  console.log("\n📍 All records tagged with source='seed_demo' + meta.__seed_demo=true");
  console.log("🧹 To clean: npx tsx scripts/seed-matching-demo.ts --clean");
}

// ─── Entry point ────────────────────────────────────────

const isClean = process.argv.includes("--clean");
(isClean ? clean() : seed()).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
