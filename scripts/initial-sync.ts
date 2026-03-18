/**
 * Initial sync: Pull all pages from 7 Notion DBs and push to notion-sync Edge Function.
 * Run once: npx tsx scripts/initial-sync.ts
 */
const { Client } = require("@notionhq/client");

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const EDGE_FN_URL = "https://qdnreijwcptghwoaqlny.supabase.co/functions/v1/notion-sync";

const notion = new Client({ auth: NOTION_API_KEY });

const DBS = [
  { name: "Goals",      id: "5c763111-a2a3-492d-a8cd-8b1ee8520610" },
  { name: "Portfolios", id: "72be2bbc-ba3e-49b5-9ec9-1009df235777" },
  { name: "Projects",   id: "95e23b99-655c-4784-958f-4779f15d5e3c" },
  { name: "Sprints",    id: "2529dae7-6133-4e01-ae0a-38760df51f27" },
  { name: "Tasks",      id: "25a2ef60-2865-4c6a-bbe5-7c6fb97504ed" },
  { name: "Sub-tasks",  id: "3191236e-1458-4cf0-81ef-afee9840460d" },
  { name: "CEO Intake", id: "938f1761-465b-4541-aa27-e7bc1a327375" },
];

async function queryAll(dbId: string) {
  const pages: any[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function sendToEdgeFn(page: any) {
  const res = await fetch(EDGE_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(page),
  });
  return res.json();
}

async function main() {
  if (!NOTION_API_KEY) {
    console.error("Missing NOTION_API_KEY in env");
    process.exit(1);
  }
  if (!SUPABASE_ANON_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in env");
    process.exit(1);
  }

  let totalSynced = 0;
  let totalErrors = 0;

  for (const db of DBS) {
    console.log(`\n📥 Fetching ${db.name}...`);
    const pages = await queryAll(db.id);
    console.log(`   Found ${pages.length} pages`);

    for (const page of pages) {
      try {
        const result = await sendToEdgeFn(page);
        if (result.ok) {
          totalSynced++;
          process.stdout.write(".");
        } else {
          totalErrors++;
          console.error(`\n   ❌ ${page.id}: ${JSON.stringify(result)}`);
        }
      } catch (err) {
        totalErrors++;
        console.error(`\n   ❌ ${page.id}: ${err}`);
      }
    }
    console.log(`\n   ✅ ${db.name}: ${pages.length} synced`);
  }

  console.log(`\n\n🏁 Done! Synced: ${totalSynced}, Errors: ${totalErrors}`);
}

main();
