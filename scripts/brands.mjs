#!/usr/bin/env node
// The equipment brands the companies install: the maker's own warranty terms, and
// links to independent reviews and news, gathered once into raw/brands/<brand>/.
// The read-brand skill reads that into records/brands/<brand>.md; `check` traces
// every quote and link back to what was gathered; build-data puts it on the brand page.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { done, fail, flag, has, misused, parseArgs, usage } from "../src/data/cli.mjs";
import { loadSources, sameUrl, squash } from "./evidence.mjs";
import { at, connections, frontMatter, hasCommand, readJson, slugify, today, vendor, writeAtomic, writeJson } from "./lib.mjs";

const HELP = `usage: node scripts/brands.mjs <command> [options]

  list
      The brands with enough installers for a page (data/brands.json), and for
      each what is gathered and read. Spends nothing.
  gather [--brand <slug>] [--site <url>] [--again] [--confirm]
      For each brand not gathered yet (or the one named): three Google searches
      through ScrapeCreators (the maker's warranty pages, independent reviews,
      news), saved to raw/brands/<brand>/search/, then the maker's warranty pages
      and the documents they link read with tt-crawl into raw/brands/<brand>/site/.
      The maker's site is the first result on a domain carrying the brand's
      name; --site names it when that guess is wrong (with --brand). 3
      ScrapeCreators credits a brand. Without --confirm it prints the plan and spends nothing.
      Safe to run again: a gathered brand is left alone unless --again.
  check <slug> | --all
      records/brands/<brand>.md against what was gathered: every warranty
      quote is on the page its url names, and every review and news link is
      one the searches found, under that title.

Each prints what it did by brand, then Next:. Exit 0 done, 1 failed or with
findings, 2 misused.`;

const a = parseArgs(process.argv.slice(2), { bare: ["confirm", "again", "all"] });
const [cmd, ...rest] = a._;
usage(a, cmd, ["list", "gather", "check"], HELP, "brands", { list: [], gather: ["brand", "site", "again", "confirm"], check: ["all"] });
if (cmd !== "check" && rest.length) misused(`brands ${cmd}: takes no argument (${rest.join(" ")})`, "node scripts/brands.mjs --help");

const site = frontMatter(existsSync(at("SITE.md")) ? readFileSync(at("SITE.md"), "utf8") : "")?.data ?? {};
/** The trade in a word or two, for searches: "HVAC companies" is "HVAC". */
const trade = String(site.noun ?? "").replace(/\b(companies|company|businesses|business|services|contractors?)\b/gi, "").trim();
const brands = readJson(at("data", "brands.json"), null);
if (!brands) fail(`brands ${cmd}: data/ has not been built`, "node scripts/build-data.mjs");
const paged = brands.filter((b) => b.index);
const dir = (slug, ...p) => at("raw", "brands", slug, ...p);
const stateOf = (slug) => readJson(dir(slug, "brand.json"), {});
const recordFile = (slug) => at("records", "brands", `${slug}.md`);

if (cmd === "list") {
  if (!paged.length) done("brands list", "no brand has enough installers for a page yet", { next: "node scripts/build-data.mjs, once more companies are read" });
  else done("brands list", `${paged.length} brands with a page`, {
    lines: paged.map((b) => {
      const s = stateOf(b.slug);
      const read = existsSync(recordFile(b.slug));
      return `${b.name} (${b.slug}): ${b.count} installers; ${s.searched ? `gathered ${s.searched}${s.site ? ` from ${s.site}, ${s.pages ?? 0} pages` : ", no maker site found"}` : "not gathered"}; ${read ? "read" : "not read"}`;
    }),
    next: paged.some((b) => !stateOf(b.slug).searched) ? "node scripts/brands.mjs gather, for the plan" : "the read-brand skill for any not read, then node scripts/brands.mjs check --all",
  });
}

/** One Google search through ScrapeCreators (1 credit), its results kept as JSON and as text a quote can be traced to. */
async function search(slug, conn, name, query, again) {
  // A search already saved is reused, so a run stopped partway never pays twice.
  const saved = readJson(dir(slug, "search", `${name}.json`), null);
  if (saved?.query === query && !again) return saved.items;
  const r = await vendor(conn, `/v1/google/search?query=${encodeURIComponent(query)}`);
  if (!r.success) throw new Error(r.message ?? "ScrapeCreators made no search");
  const plain = (s) => String(s ?? "").replace(/<[^>]+>/g, "").trim();
  const items = (r.results ?? [])
    .filter((x) => /^https?:\/\//.test(x.url ?? "") && x.title)
    .map((x) => ({ title: plain(x.title), url: x.url, where: new URL(x.url).hostname.replace(/^www\./, ""), snippet: plain(x.description) }));
  writeJson(dir(slug, "search", `${name}.json`), { query, searched: today(), items });
  writeAtomic(dir(slug, "search", `${name}.md`), `# Google: ${query}\n\n${items.map((x) => `## ${x.title}\nurl: ${x.url}\nwhere: ${x.where}\n\n${x.snippet}\n`).join("\n")}`);
  return items;
}

/** The maker's own site: the first result on a domain that carries the brand's name. */
const token = (name) => slugify(name).replace(/-/g, "");
// A name under 3 letters ("LG") would match any host; its site is named with --site instead.
const makerOf = (name, items) => token(name).length >= 3 && items.find((x) => new URL(x.url).hostname.replace(/^www\./, "").replace(/[^a-z0-9.]/g, "").split(".")[0].includes(token(name).slice(0, 12)));

const crawl = (args) => {
  const r = spawnSync("tt-crawl", [...args, "--json"], { encoding: "utf8", cwd: at(), timeout: 600_000 });
  try {
    return JSON.parse(r.stdout.trim().split("\n").pop());
  } catch {
    return { error: (r.stderr || r.stdout || "tt-crawl did not answer").trim().split("\n").slice(-1)[0] };
  }
};

if (cmd === "gather") {
  const only = flag(a, "brand");
  const named = flag(a, "site");
  if (named && !only) misused("brands gather: --site names one brand's site, so it needs --brand", "node scripts/brands.mjs gather --brand <slug> --site https://maker.example");
  if (named && !/^https?:\/\/[^/\s]+\.[^/\s]+/.test(named)) misused(`brands gather: --site is the maker's address, starting https:// (not ${named})`, `node scripts/brands.mjs gather --brand ${only} --site https://maker.example`);
  if (only && !brands.some((b) => b.slug === only)) fail(`brands gather: no brand ${only}`, "node scripts/brands.mjs list");
  const todo = (only ? brands.filter((b) => b.slug === only) : paged).filter((b) => has(a, "again") || named || !stateOf(b.slug).searched);
  if (!todo.length) {
    done("brands gather", "every brand with a page is gathered already, left alone", { next: "node scripts/brands.mjs list" });
    process.exit(0);
  }
  const conn = connections().scrapecreators;
  if (!conn) fail("brands gather: ScrapeCreators is not connected", 'python3 ~/tools/taskandtool.py request-connection scrapecreators --why "Search each equipment brand\'s warranty pages, reviews and news"');
  if (!has(a, "confirm")) {
    console.log(`brands gather: ${todo.length} brands, ${todo.length * 3} ScrapeCreators credits (one Google search each)`);
    console.log(`  ${todo.map((b) => b.name).join(", ")}`);
    console.log(`  Nothing was spent. If the owner said yes: node scripts/brands.mjs gather${only ? ` --brand ${only}` : ""}${named ? ` --site ${named}` : ""}${has(a, "again") ? " --again" : ""} --confirm`);
    process.exit(0);
  }
  if (!hasCommand("tt-crawl")) fail("brands gather: tt-crawl is not installed", "bash .taskandtool/after-setup.sh");
  const lines = [];
  const failed = [];
  for (const b of todo) {
    try {
      const q = `${b.name}${trade ? ` ${trade}` : ""}`;
      const again = has(a, "again");
      const warranty = await search(b.slug, conn, "warranty", `${q} warranty`, again);
      const reviews = await search(b.slug, conn, "reviews", `${q} reviews`, again);
      const news = await search(b.slug, conn, "news", `${q} news`, again);
      const maker = named ? { url: named } : makerOf(b.name, warranty);
      const state = { name: b.name, searched: today(), site: null, pages: 0 };
      if (maker) {
        const host = new URL(maker.url).hostname;
        state.site = `https://${host}`;
        const pages = [maker.url, ...warranty.filter((x) => new URL(x.url).hostname === host && x.url !== maker.url).map((x) => x.url)].slice(0, 4);
        const out = dir(b.slug, "site");
        const first = crawl(["brand", pages[0], "--out", out, "--max-pages", "1", "--images", "none"]);
        if (pages.length > 1) crawl(["add", ...pages.slice(1), "--out", out, "--images", "none"]);
        crawl(["docs", "--from", out]);
        state.pages = readJson(dir(b.slug, "site", "_index", "run.json"))?.read ?? 0;
        if (!state.pages) state.refused = first.error ?? first.refusal ?? "no pages read";
      }
      writeJson(dir(b.slug, "brand.json"), state);
      lines.push(`${b.name}: ${warranty.length + reviews.length} results, ${news.length} news items${state.site ? `; ${state.pages} pages from ${state.site}${state.refused ? ` (the site refused: ${state.refused})` : ""}` : "; no maker site among the results, name it with --brand " + b.slug + " --site <url>"}`);
    } catch (e) {
      failed.push(`${b.name}: ${e.message}`);
    }
  }
  if (failed.length) {
    if (lines.length) console.log(`brands gather: ${lines.length} brands into raw/brands/\n${lines.map((l) => `  ${l}`).join("\n")}`);
    console.error(`brands gather: ${failed.length} of ${todo.length} brands stopped (searches already made are kept)\n${failed.map((l) => `  ${l}`).join("\n")}`);
    console.error(`  Try: node scripts/brands.mjs gather${only ? ` --brand ${only}` : ""} --confirm`);
    process.exit(1);
  }
  done("brands gather", `${lines.length} brands into raw/brands/`, { lines, next: "the read-brand skill for each, then node scripts/brands.mjs check --all" });
}

/** Every finding on one brand record. */
function checkBrand(slug) {
  const file = recordFile(slug);
  if (!existsSync(file)) return [{ where: file, what: "is not written yet: the read-brand skill writes it" }];
  const rec = frontMatter(readFileSync(file, "utf8"));
  if (!rec || rec.error) return [{ where: file, what: `is not valid front matter: ${rec?.error ?? "no --- block"}` }];
  const d = rec.data;
  const blocks = loadSources(`brands/${slug}`);
  const found = [];
  const add = (where, what) => found.push({ where: `records/brands/${slug}.md ${where}`, what });
  const quoted = (where, x) => {
    if (!x?.quote || !x.url) return add(where, "needs a quote and the url it is on");
    const q = squash(x.quote);
    const here = blocks.filter((b) => b.text.includes(q));
    if (!here.length) add(where, `quote not found in raw/brands/${slug}/: "${x.quote}". Copy it exactly`);
    else if (!here.some((b) => sameUrl(b.url) === sameUrl(x.url))) add(where, `quote is not at ${x.url}: it appears at ${here[0].url}. Cite that`);
  };
  (d.warranty ?? []).forEach((w, i) => {
    if (!w.covers) add(`warranty[${i}]`, "says nothing it covers: name the part (parts, compressor, heat exchanger)");
    quoted(`warranty[${i}]`, w);
  });
  if (d.registration) quoted("registration", d.registration);
  const searched = ["reviews", "news", "warranty"].flatMap((n) => readJson(dir(slug, "search", `${n}.json`))?.items ?? []);
  for (const key of ["reviews", "news"])
    (d[key] ?? []).forEach((x, i) => {
      const hit = searched.find((s) => sameUrl(s.url) === sameUrl(x.url));
      if (!hit) add(`${key}[${i}]`, `${x.url} is not one the searches found: pick from raw/brands/${slug}/search/${key}.md`);
      else if (squash(hit.title) !== squash(x.title ?? "")) add(`${key}[${i}]`, `its title is "${hit.title}" where it was found: use that`);
      if (hit && sameUrl(new URL(hit.url).origin) === sameUrl(d.site ?? "")) add(`${key}[${i}]`, "is the maker's own page, not an independent one");
    });
  return found;
}

if (cmd === "check") {
  const slugs = has(a, "all") ? paged.map((b) => b.slug).filter((s) => existsSync(recordFile(s))) : rest;
  if (has(a, "all") === Boolean(rest.length) || rest.length > 1) misused("brands check: name one brand, or --all", "node scripts/brands.mjs check --all");
  if (!has(a, "all") && !brands.some((b) => b.slug === rest[0])) fail(`brands check: no brand ${rest[0]}`, "node scripts/brands.mjs list");
  const findings = slugs.flatMap(checkBrand);
  if (findings.length) {
    console.error(`brands check: ${findings.length} findings`);
    for (const f of findings) console.error(`  ${f.where}: ${f.what}`);
    console.error(`  Try: fix them in the record, then node scripts/brands.mjs check ${has(a, "all") ? "--all" : rest[0]}`);
    process.exit(1);
  }
  done("brands check", `${slugs.length} brand records clean`, { next: "node scripts/build-data.mjs" });
}
