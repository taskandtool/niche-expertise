#!/usr/bin/env node
// What on the site is worth a Facebook or LinkedIn post, from data/: each idea with
// its page and the facts to use, so a post never states a number the site doesn't.
// The social-post skill writes the posts; posts/<date>-<slug>/post.md files them.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { done, flag, has, misused, parseArgs, usage } from "../src/data/cli.mjs";
import { at, frontMatter, readJson, today } from "./lib.mjs";

const HELP = `usage: node scripts/posts.mjs ideas [--days 14] [--all] [--today YYYY-MM-DD]

  ideas
      What changed on the site in the last --days (default 14) that is worth a
      post: best-of lists whose facts changed, new offers, companies that go past
      a guarantee's usual length, brand pages with the maker's own terms, and new
      "vs" pages. Each line names the page and the facts to use. Pages a post in
      posts/ already covers (its page: field) are left out. 20 at most; --all for
      every one. --today pins the date for a test. Spends nothing.

Prints the ideas, then Next:. Exit 0 done (none is fine), 1 when data/ is not
built, 2 misused.`;

const a = parseArgs(process.argv.slice(2), { bare: ["all"] });
const [cmd, ...rest] = a._;
usage(a, cmd, ["ideas"], HELP, "posts", { ideas: ["days", "all", "today"] });
if (rest.length) misused(`posts ideas: takes no argument (${rest.join(" ")})`, "node scripts/posts.mjs ideas --days 30");
const days = Number(flag(a, "days") ?? 14);
if (!Number.isInteger(days) || days < 1) misused("posts ideas: --days is a whole number from 1", "node scripts/posts.mjs ideas --days 30");

const data = (name) => readJson(at("data", `${name}.json`), null);
const stats = data("stats");
if (!stats) {
  console.error("posts ideas: data/ has not been built\n  Try: node scripts/build-data.mjs");
  process.exit(1);
}
const pinned = flag(a, "today");
if (pinned != null && !(/^\d{4}-\d{2}-\d{2}$/.test(pinned) && !Number.isNaN(Date.parse(pinned)))) misused(`posts ideas: --today is a date, YYYY-MM-DD (not ${pinned})`, "node scripts/posts.mjs ideas --today 2026-11-08");
const since = new Date(Date.parse(today(pinned)) - days * 86400_000).toISOString().slice(0, 10);
const companies = new Map((data("companies") ?? []).map((c) => [c.slug, c]));
const name = (slug) => companies.get(slug)?.name ?? slug;
const rating = (slug) => {
  const r = companies.get(slug)?.ratings.find((x) => x.platform === "Google" && x.count != null);
  return r ? `${Number(r.rating).toFixed(1)} from ${r.count.toLocaleString("en-US")} Google reviews` : "no Google rating yet";
};

/** The pages a filed post already covers. */
const covered = new Set(
  existsSync(at("posts"))
    ? readdirSync(at("posts")).flatMap((d) => {
        const file = at("posts", d, "post.md");
        return existsSync(file) ? [frontMatter(readFileSync(file, "utf8"))?.data?.page].filter(Boolean) : [];
      })
    : [],
);

// Strongest first: what sets a company apart, the maker's terms, new offers, then the lists.
const ideas = [];
const add = (page, kind, facts) => covered.has(page) || ideas.push({ page, kind, facts });
for (const g of data("guarantees") ?? []) {
  if (!g.index || !g.standard) continue;
  const further = [...companies.values()].filter((c) => c.standouts?.some((s) => s.kind === "longer-guarantee" && s.guarantee === g.name));
  if (further.length) add(g.path, "guarantee", `the usual ${g.name} guarantee here is ${g.standard}; going further: ${further.map((c) => `${c.name} (${c.standouts.find((s) => s.guarantee === g.name && s.kind === "longer-guarantee").length})`).join(", ")}`);
}
for (const b of data("brands") ?? []) {
  if (!b.index || !b.maker?.warranty?.length) continue;
  const w = b.maker.warranty[0];
  add(b.path, "brand", `${b.name} gives ${w.length ?? "a warranty"} on ${w.covers}${w.condition ? ` (${w.condition})` : ""}; ${b.count} installers here, ${b.adds.length} add a guarantee of their own`);
}
for (const o of data("offers")?.live ?? []) if (o.firstSeen >= since) add(o.company.path, "new offer", `${o.company.name}: ${o.title}${o.ends ? `, until ${o.ends}` : ""}`);
for (const x of [...(data("areas") ?? []), ...(data("service-areas") ?? [])]) {
  if (!x.index || !x.ranked?.length || x.updated < since) continue;
  add(x.path, "best-of", `${x.service ? `${x.service} in ${x.areaName}` : x.name}: ${x.ranked.slice(0, 3).map((s, i) => `${i + 1}. ${name(s)} (${rating(s)})`).join("; ")}; ${x.ranked.length} compared`);
}
for (const v of data("versus") ?? []) if (v.updated >= since) add(v.path, "vs", `${name(v.companies[0])} (${rating(v.companies[0])}) vs ${name(v.companies[1])} (${rating(v.companies[1])}); compares ${v.fields.join(", ")}`);

const shown = has(a, "all") ? ideas : ideas.slice(0, 20);
done("posts ideas", ideas.length ? `${ideas.length} ideas from the last ${days} days` : `nothing new in the last ${days} days that a post doesn't already cover`, {
  lines: [...shown.map((x) => `${x.kind}: ${x.page}\n  ${x.facts}`), ...(shown.length < ideas.length ? [`20 of ${ideas.length}; --all for the rest`] : [])],
  next: ideas.length ? "the social-post skill for the ones worth posting, filed as AGENTS.md says" : `node scripts/posts.mjs ideas --days ${days * 2}`,
});
