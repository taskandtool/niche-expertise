// The project database's tables for the contact form (the skills' schema.sql
// files through applySchema, safe to re-run), and the form itself the first time.
// Machine only. `npm run dev` runs it before the server starts, `npm run deploy`
// before the build. Without DATABASE_URL it says so and exits 0: until there is a
// database the form says where to write instead.
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { askForDatabase, done, fail, machineEnv } from "../src/data/cli.mjs";
import type { Db } from "../src/data/db";
import { applySchema } from "../src/data/migrate";
import { fromPool } from "../src/data/pg";
import type { Field } from "../src/forms/fields";
import { seedForm } from "../src/forms/store";
import { at, start } from "./lib.mjs";

const SCHEMAS = ["data", "customers", "forms"];
const FIELDS: Field[] = [
  { name: "company", label: "Which company is this about?", type: "text" },
  { name: "ask", label: "What would you like?", type: "select", required: true, options: ["Claim this listing", "Correct this listing", "Remove this listing", "Take down a picture", "Something else"] },
  { name: "details", label: "Tell us more", type: "textarea", required: true },
  { name: "name", label: "Your name", type: "text", required: true },
  { name: "email", label: "Your email", type: "email", required: true },
];

const LEAD_FIELDS: Field[] = [
  { name: "name", label: "Your name", type: "text", required: true },
  { name: "phone", label: "Phone", type: "tel", required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "zip", label: "ZIP code", type: "text" },
  { name: "need", label: "What do you need?", type: "textarea", required: true },
];

/** Who a quote request can go to: the Worker reads this, since it carries no data of its own. */
async function syncListings(db: Db): Promise<void> {
  await db.sql`create table if not exists listed_companies (slug text primary key, name text not null, email text)`;
  const file = at("data", "companies.json");
  if (!existsSync(file)) return;
  const companies = JSON.parse(readFileSync(file, "utf8")) as { slug: string; name: string; leadTo: string | null }[];
  await db.sql`delete from listed_companies`;
  for (const c of companies) await db.sql`insert into listed_companies (slug, name, email) values (${c.slug}, ${c.name}, ${c.leadTo})`;
}

async function setupDb(db: Db): Promise<void> {
  await db.sql`create extension if not exists citext`.catch(() => {});
  await db.sql`create extension if not exists pg_trgm`.catch(() => {});
  for (const s of SCHEMAS) await applySchema(db, readFileSync(fileURLToPath(new URL(`../src/${s}/schema.sql`, import.meta.url)), "utf8"));
  await seedForm(db, { key: "contact", title: "Contact us", fields: FIELDS, leads: false }, "niche-expertise");
  await seedForm(db, { key: "quote", title: "Request a quote", fields: LEAD_FIELDS, leads: false }, "niche-expertise");
  await syncListings(db);
}

const url = () => machineEnv().DATABASE_URL;

/** Runs `fn` on the app's database, with the tables in place. The forms command calls this. */
export async function withDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const conn = url();
  if (!conn) fail("no database yet: DATABASE_URL is not set", askForDatabase());
  const pool = new pg.Pool({ connectionString: conn, max: 2 });
  try {
    const db = fromPool(pool);
    await setupDb(db);
    return await fn(db);
  } finally {
    await pool.end();
  }
}

if (basename(process.argv[1] ?? "") === "migrate.ts" && resolve(process.argv[1]!) === fileURLToPath(import.meta.url)) {
  start("migrate", `usage: npm run migrate

Sets up the contact form's tables on the project database, and the form the
first time. Safe to re-run. Prints what it did. Without a database it says so and exits 0.`, { tryHelp: "npm run migrate -- --help" });
  if (!url()) {
    done("migrate", "no database yet: the contact form is off until there is one", { lines: ["The form page says where to write until then."], next: askForDatabase() });
  } else {
    await withDb(async () => undefined).catch((e: unknown) => fail(`migrate: ${e instanceof Error ? e.message : String(e)}`, "npm run migrate, once the database answers"));
    done("migrate", "the contact form's tables are in place", { next: "node scripts/forms.mjs list" });
  }
}
