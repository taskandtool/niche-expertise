#!/usr/bin/env node
// Is anything wrong? `npm run check` builds, then tests what a visitor would get.
// Every finding prints at once, so all are fixed in one pass. Blocks a deploy.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { done, fail, has, machineEnv } from "../src/data/cli.mjs";
import { loadSources, sameUrl, squash } from "./evidence.mjs";
import { at, frontMatter, readJson, start, today, walk, here } from "./lib.mjs";

const a = start("check", `usage: npm run check [-- --built]

Builds the site (--built uses dist/ as it is), then fails on: broken internal links
and pages nothing links to; a quote not in raw/; an offer shown as current after it
expired; a profile used without a confirmed match; a missing title, description,
canonical or structured data; a thin page open to search; any review or rating markup;
text from raw/ or a record's body in dist/ beyond its quotes; HTML that would run or a
link with an unsafe scheme; an AI tell or a typed number in a guide; a Node import
in the Worker; too many files for Cloudflare. Prints every finding, by area. Exit 0
clean, 1 with findings.`, { bools: ["built"] });

const findings = [];
const add = (area, where, what) => findings.push({ area, where, what });
const dist = at("dist");

const data = (name, fallback) => readJson(at("data", `${name}.json`), fallback);
if (!existsSync(at("data", "stats.json"))) fail("check: data/ has not been built", "node scripts/build-data.mjs");

const tsc = spawnSync("node_modules/.bin/tsc", ["--noEmit"], { encoding: "utf8" });
if (tsc.status !== 0) add("code", "TypeScript", tsc.stdout.trim().split("\n").slice(0, 8).join("\n    "));

// What the AI wrote for a page to say, and the words in the templates: the tells a reader would catch.
const copy = spawnSync("node", [here("..", ".claude", "skills", "tropes", "tropes.mjs"), "--scan", here("..", "src", "pages"), here("..", "src", "components.tsx"), here("..", "src", "shell.tsx")], { encoding: "utf8" });
if (copy.status === 1) add("copy", "templates", `${copy.stdout}${copy.stderr}`.trim().split("\n").slice(0, 12).join("\n    "));
const written = data("companies", []).flatMap((c) => [c.pitch?.headline, ...(c.pitch?.points ?? []).map((p) => p.text), c.background?.summary].filter(Boolean).map((text) => `${c.slug}: ${text}`));
const asked = spawnSync("node", [here("..", ".claude", "skills", "tropes", "tropes.mjs"), "--kind", "text", "-"], { encoding: "utf8", input: written.join("\n") });
if (asked.status === 1) add("copy", "records", `${asked.stdout}${asked.stderr}`.trim().split("\n").slice(0, 12).join("\n    "));

if (!has(a, "built")) {
  const r = spawnSync("node_modules/.bin/tsx", ["scripts/build.ts"], { encoding: "utf8", env: process.env });
  if (r.status !== 0) fail(`check: the build failed\n${`${r.stdout}${r.stderr}`.trim()}`, "npm run build");
}
if (!existsSync(join(dist, "index.html"))) fail("check: dist/ is empty", "npm run build");

const htmlFiles = walk(dist).filter((f) => f.endsWith(".html") && !f.includes("/pagefind/"));
const pathOf = (f) => {
  const p = `/${f.slice(dist.length + 1).replace(/\.html$/, "")}`;
  return p === "/index" ? "/" : p;
};
const pages = new Map(htmlFiles.map((f) => [pathOf(f), readFileSync(f, "utf8")]));
const flags = new Map(data("pages", []).map((p) => [p.path, p]));

// ---- Links: every internal one lands; every page is reached ----
const DYNAMIC = new Set(["/contact"]);
const linkedTo = new Set(["/"]);
for (const [path, html] of pages) {
  if (path === "/404") continue;
  for (const [, href] of html.matchAll(/<a\b[^>]*\shref="([^"]*)"/g)) {
    if (/^\s*(javascript|data|vbscript):/i.test(href)) add("safety", path, `a link with an unsafe scheme: ${href.slice(0, 60)}`);
    if (!href.startsWith("/")) continue;
    const target = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
    linkedTo.add(target);
    if (!pages.has(target) && !DYNAMIC.has(target)) add("links", path, `links to ${target}, which isn't a page`);
  }
}
// Every script and stylesheet a page loads is in dist/.
const missing = new Set();
for (const [, ref] of [...pages.values()].join("").matchAll(/<(?:script|link)\b[^>]*\s(?:src|href)="(\/[^"?#]*\.(?:js|css))"/g)) {
  if (!missing.has(ref) && !existsSync(join(dist, ref))) {
    missing.add(ref);
    add("links", "/", `pages load ${ref}, which isn't in dist/`);
  }
}
for (const path of pages.keys()) {
  if (path !== "/404" && !linkedTo.has(path) && !["/search", "/compare"].includes(path)) add("links", path, "nothing links to it");
}

// ---- Search: titles, the gate, structured data ----
/** Page kinds that rank or list companies, and so carry an ItemList (the seo skill). */
const LISTS = new Set(["area", "service-area", "alternatives", "brand", "guarantee"]);
const sitemapText = walk(dist).filter((f) => /\/sitemap[^/]*\.xml$/.test(f)).map((f) => readFileSync(f, "utf8")).join("\n");
const owner = frontMatter(readFileSync(at("SITE.md"), "utf8"))?.data ?? {};
const siteUrl = owner.url;
// /contact is how a business reaches anyone: a database for its form, or an address.
if (has(a, "built") && owner.forward_leads === true) {
  const env = machineEnv();
  if (!env.DATABASE_URL) add("leads", "SITE.md", "forward_leads is on, but quote requests have no database to be saved in");
  if (!/^(resend|postmark)/.test(env.NOTIFY_VIA ?? "") || !env.NOTIFY_FROM) add("leads", "SITE.md", "forward_leads is on, but nothing can email a business: connect Resend or Postmark, and set NOTIFY_VIA and NOTIFY_FROM");
}
if (has(a, "built") && !machineEnv().DATABASE_URL && !owner.contact_email) add("form", "/contact", "no database and no contact_email, so a business can't reach anyone: add the postgres capability, or contact_email in SITE.md");
const titles = new Map();
for (const [path, html] of pages) {
  if (path === "/404") continue;
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
  if (!title) add("seo", path, "has no title");
  else if (titles.has(title)) add("seo", path, `has the same title as ${titles.get(title)}: "${title}"`);
  else titles.set(title, path);
  if (!/<meta name="description" content="[^"]+"/.test(html)) add("seo", path, "has no description");
  const noindex = /<meta name="robots" content="noindex"/.test(html);
  const flag = flags.get(path);
  if (flag) {
    if (!flag.index && !noindex) add("seo", path, `is open to search but does not pass the gate: ${flag.why ?? "see data/pages.json"}`);
    if (flag.index && noindex) add("seo", path, "passes the gate but says noindex");
  }
  const inMap = sitemapText.includes(`${siteUrl ?? ""}${path}</loc>`);
  if (noindex && inMap) add("seo", path, "says noindex but is in the sitemap");
  if (siteUrl && !noindex && !inMap && flag) add("seo", path, "is open to search but not in the sitemap");
  if (siteUrl && !noindex && !html.includes('rel="canonical"')) add("seo", path, "has no canonical tag");
  if (siteUrl && flag?.kind === "company" && !html.includes('"@type":"LocalBusiness"')) add("seo", path, "has no LocalBusiness structured data");
  if (siteUrl && !noindex && LISTS.has(flag?.kind) && !html.includes('"@type":"ItemList"')) add("seo", path, "is a list open to search with no ItemList structured data");
  if (/aggregateRating|"@type":"Review"|itemprop="(ratingValue|reviewRating)"/.test(html)) add("seo", path, "has review or rating markup: Google says not to aggregate ratings from other sites");
  for (const [, ldText] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(ldText);
    } catch {
      add("seo", path, "has structured data that does not parse");
    }
  }
  // ---- Safety: nothing from a source can run ----
  if (/<[a-z]+\b[^>]*\son[a-z]+\s*=/i.test(html)) add("safety", path, "has an inline event handler");
  if (/<(iframe|object|embed)\b/i.test(html)) add("safety", path, "embeds outside content");
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const known = /type="application\/ld\+json"/.test(attrs) || /src="\/site\.js"/.test(attrs) || (path === "/correct" && !attrs.trim());
    if (!known) add("safety", path, `has a script that is not ours: ${(attrs + body).slice(0, 60)}`);
  }
}

// ---- The facts on the pages ----
const companies = data("companies", []);
const TODAY = today();
const blocksOf = new Map();
const blocks = (slug) => {
  if (!blocksOf.has(slug)) blocksOf.set(slug, loadSources(slug));
  return blocksOf.get(slug);
};
for (const c of companies) {
  const facts = [...c.guarantees, ...c.offers, ...c.services, ...c.brands, ...c.proof, ...c.details, ...c.testimonials, ...(c.background?.evidence ?? []), ...c.servesQuotes];
  for (const f of facts) {
    if (f.corrected || !f.quote) continue;
    const q = squash(f.quote);
    const here = blocks(c.slug).filter((b) => !b.held && b.text.includes(q));
    if (!here.length) add("quotes", c.path, `"${f.quote.slice(0, 80)}" is not in raw/${c.slug}/`);
    else if (f.url && !here.some((b) => b.everyPage || sameUrl(b.url) === sameUrl(f.url))) add("quotes", c.path, `"${f.quote.slice(0, 60)}" is not at ${f.url}`);
  }
  for (const o of c.offers) if (o.ends && o.ends < TODAY) add("offers", c.path, `"${o.title}" ended ${o.ends} and shows as current: node scripts/build-data.mjs`);
  // A profile we could not confirm never reaches its page.
  for (const m of readJson(at("raw", c.slug, "matches.json"), [])) {
    if ((m.status === "held" || m.status === "rejected") && pages.get(c.path)?.includes(m.url)) add("matches", c.path, `uses ${m.url}, which matches.json does not confirm`);
  }
  // Private text: a record's body is for the AI, not the page.
  const record = existsSync(at("records", `${c.slug}.md`)) ? frontMatter(readFileSync(at("records", `${c.slug}.md`), "utf8")) : null;
  const html = pages.get(c.path) ?? "";
  for (const line of (record?.body ?? "").split("\n").map((l) => l.trim()).filter((l) => l.length > 60)) {
    if (html.includes(line.replace(/&/g, "&amp;"))) add("private", c.path, `shows a line from the body of records/${c.slug}.md: "${line.slice(0, 60)}"`);
  }
}
for (const [path, html] of pages) if (/raw\/[a-z0-9-]+\/|records\/[a-z0-9-]+\.md/.test(html)) add("private", path, "names a working file in the page");

// ---- Guides: no tells, and no number the build didn't fill in ----
const guideFiles = walk(at("content")).filter((f) => f.endsWith(".md"));
for (const f of guideFiles) {
  const text = readFileSync(f, "utf8").replace(/\{\{[^}]*\}\}/g, "");
  for (const [i, line] of text.split("\n").entries()) {
    if (/\b\d[\d,.]*\s*(%|percent|of\b|companies)/i.test(line)) add("guides", `${f.slice(at().length + 1)}:${i + 1}`, `states a number: use a {{figure}}: "${line.slice(0, 80)}"`);
  }
}
if (guideFiles.length) {
  const r = spawnSync("node", [".claude/skills/tropes/tropes.mjs", "--scan", at("content")], { encoding: "utf8" });
  if (r.status !== 0) add("guides", "tropes", `${r.stdout}${r.stderr}`.trim().split("\n").slice(0, 12).join("\n    "));
}

// ---- What Cloudflare takes ----
if (existsSync(at("build", "worker.mjs")) && /from\s*["']node:/.test(readFileSync(at("build", "worker.mjs"), "utf8"))) add("code", "src/worker.ts", "the Worker imports a Node built-in: keep it out of what src/public.tsx reaches");
const all = walk(dist);
if (all.length > 20000) add("size", "dist/", `${all.length} files: plan for under 20,000, or move pictures to R2`);
for (const f of all) if (statSync(f).size > 25 * 1024 * 1024) add("size", f.slice(dist.length), "over Cloudflare's 25 MiB a file");

if (findings.length) {
  const areas = [...new Set(findings.map((f) => f.area))];
  const lines = areas.flatMap((x) => [`${x}:`, ...findings.filter((f) => f.area === x).slice(0, 40).map((f) => `  ${f.where}: ${f.what}`)]);
  console.error(`check: ${findings.length} finding${findings.length === 1 ? "" : "s"}\n${lines.map((l) => `  ${l}`).join("\n")}\n  Try: fix them, then npm run check`);
  process.exit(1);
}
done("check", `${pages.size} pages clean: links, search, quotes, offers, matches, safety, guides, size`, { next: "tt-crawl shoot /" });
