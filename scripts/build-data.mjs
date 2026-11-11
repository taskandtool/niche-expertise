#!/usr/bin/env node
// Everything in data/, by code: the lists, the links both ways, areas, statistics,
// expired offers retired, pictures resized, and which pages pass the publish
// gate. Records hold what takes understanding; contact details and ratings come
// straight from what was gathered, each with where it came from. No AI, no spending.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { done, fail, flag } from "../src/data/cli.mjs";
import { loadSources, sameUrl, squash } from "./evidence.mjs";
import { areaNamed, areasAt, loadAreas } from "./geo.mjs";
import { alternatives, basedIn, gaps, marketOf, ranked, standouts, versus, yearsOf } from "./rank.mjs";
import { loadZipMap, zipCenters } from "./zipmap.mjs";
import { at, cell, frontMatter, here, log, readCompanies, readJson, readYaml, slugify, start, today, walk, writeAtomic, writeJson } from "./lib.mjs";

const HELP = `usage: node scripts/build-data.mjs [--today YYYY-MM-DD]

Builds data/ from records/, raw/, aliases.yaml, fields.yaml and SITE.md:
companies with their contact details and ratings, services, guarantees, brands,
phrases, offers, areas, statistics, the best-of order and each company's standouts
and gaps, the "vs" pairs (versus.json) and alternatives (alternatives.json), and
pages.json, which says which pages pass the publish gate. Retires offers past their end date or gone from their source.
Resizes kept pictures to static/media/. Safe to run any time. --today pins the
date for a test.

Prints what it built and what changed, then Next:. Exit 1 when no record can be read.`;

const a = start("build-data", HELP, { flags: ["today"] });
const TODAY = today(flag(a, "today"));

// ---- The owner's settings ----

const site = frontMatter(existsSync(at("SITE.md")) ? readFileSync(at("SITE.md"), "utf8") : "")?.data ?? {};
const GATE = { company_facts: 3, list_companies: 3, area_companies: 5, service_area_companies: 3, guide_companies: 5, rating_reviews: 20, rating_prior: 50, versus_fields: 2, ...site.gate };
const fields = readYaml(at("fields.yaml"));
const aliases = readYaml(at("aliases.yaml"));

/** The one name for a thing, once aliases.yaml has merged its spellings. */
const canon = (group, name) => {
  const s = String(name ?? "").trim();
  const map = aliases[group] ?? {};
  const hit = Object.keys(map).find((k) => k.toLowerCase() === s.toLowerCase());
  return hit ? map[hit] : s;
};

const described = (list) => Object.fromEntries((list ?? []).flatMap((x) => (typeof x === "string" ? [[x, ""]] : Object.entries(x))));
const SERVICE_NOTES = described(fields.services);

// ---- Where a fact came from, as a reader is told it ----

const SOURCE_LABELS = { site: "on their website", facebook_post: "in their Facebook post", instagram_post: "in their Instagram post", facebook_ad: "running as a Facebook ad", google_ad: "running as a Google ad", review: "in a customer's review" };

function labelFor(url, domain) {
  const u = String(url ?? "");
  if (/facebook\.com\/ads\/library/.test(u)) return "running as a Facebook ad";
  if (/adstransparency\.google/.test(u)) return "running as a Google ad";
  if (/facebook\.com/.test(u)) return "on their Facebook page";
  if (/instagram\.com/.test(u)) return "on their Instagram";
  if (/linkedin\.com/.test(u)) return "on their LinkedIn";
  if (/tiktok\.com/.test(u)) return "on their TikTok";
  if (/\.pdf($|\?)/i.test(u)) return "in a document on their website";
  if (domain && u.includes(domain)) return "on their website";
  return "on a page they publish";
}

/** A web, mail or phone link, or nothing: source text never reaches a page as a live scheme. */
/** A phone worth dialling: ten digits, an optional country 1 dropped. */
const dialable = (s) => {
  const d = digits(s);
  const local = d.length === 11 && d[0] === "1" ? d.slice(1) : d;
  return local.length === 10 ? local : "";
};
/** An address mail can reach, without the encoded spaces and stray text sites leave around it. */
const mailable = (s) => {
  const e = String(s ?? "").replace(/%20/g, "").trim();
  return /^[^\s@:/%]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(e) ? e : "";
};
/** The page a site calls its terms, else its warranty page, from what the crawl discovered. */
function termsPage(slug) {
  const urls = (readJson(at("raw", slug, "site", "_index", "inventory.json"))?.records ?? []).map((r) => r.final_url ?? r.url).filter((u) => u && URL.canParse(u));
  const lastPart = (u) => new URL(u).pathname.replace(/\/+$/, "").split("/").pop();
  const pick = (re) => urls.filter((u) => re.test(lastPart(u))).sort((x, y) => x.length - y.length)[0];
  return safeUrl(pick(/^terms?([-_](and|of|&))?([-_](conditions?|service|use))?$/i) ?? pick(/(^|-)(warrant(y|ies)|guarantees?)$/i)) || null;
}

const NETWORKS = /^(?:[a-z0-9-]+\.)?(facebook|instagram|linkedin|tiktok|youtube|yelp|x|twitter)\.com$/i;
/** The company's own profiles, one per network: sites link to suppliers, partners and share pages too. */
function profiles(urls) {
  const byNetwork = new Map();
  for (const u of urls) {
    if (!URL.canParse(u)) continue;
    const { hostname, pathname } = new URL(u);
    const network = NETWORKS.exec(hostname)?.[1].toLowerCase().replace("twitter", "x");
    if (network && pathname.length > 1 && !/^\/(policy|policies|privacy|legal|terms|sharer|share|intent|plugins|help)\b/i.test(pathname) && !byNetwork.has(network)) byNetwork.set(network, u);
  }
  return [...byNetwork.values()];
}
const safeUrl = (u) => {
  const s = String(u ?? "").trim();
  return /^(https?:|mailto:|tel:)/i.test(s) ? s : "";
};
/** Source text: no markup survives, whatever a page or post tried to carry. */
const safeText = (s) => (s == null ? s : String(s).replace(/[<>]/g, "").trim());

// ---- One company ----

const digits = (s) => String(s ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
const formatPhone = (d) => (d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d);

const placesOf = (slug) => {
  const dir = at("raw", slug, "places");
  if (!existsSync(dir)) return null;
  const f = readdirSync(dir).find((x) => x.endsWith(".summary.json"));
  const held = readJson(at("raw", slug, "gather.json"))?.sources?.["google listing"]?.status === "held";
  return f && !held ? readJson(join(dir, f)) : null;
};

/** Facts from the sources, never picked between: every value with where it was seen. */
function contact(row, card, facts, places) {
  const phones = new Map();
  const seen = (raw, label) => {
    const key = dialable(raw);
    if (!key) return;
    if (!phones.has(key)) phones.set(key, { value: formatPhone(key), where: [] });
    if (!phones.get(key).where.includes(label)) phones.get(key).where.push(label);
  };
  for (const p of facts.phone ?? []) seen(p.value, "on their website");
  if (places?.telephone) seen(places.telephone, "on Google");
  for (const p of cell(row, "phones")) seen(p, "from a data provider");
  const emails = new Map();
  for (const e of (facts.email ?? []).map((x) => mailable(x.value)).filter(Boolean)) emails.set(e.toLowerCase(), { value: e, where: ["on their website"] });
  for (const e of cell(row, "emails").map(mailable).filter(Boolean)) if (!emails.has(e.toLowerCase())) emails.set(e.toLowerCase(), { value: e, where: ["from a data provider"] });
  const hours = [
    ...(places?.opening_hours_text?.length ? [{ text: places.opening_hours_text, where: "on Google" }] : []),
    ...(facts.hours ?? []).slice(0, 2).map((h) => ({ text: [safeText(h.value)], where: "on their website" })),
  ];
  const booking = safeUrl((facts.action ?? []).sort((x, y) => (y.score ?? 0) - (x.score ?? 0))[0]?.value);
  return { phones: [...phones.values()].slice(0, 6), emails: [...emails.values()].slice(0, 4), hours, booking };
}

function ratingsOf(facts, places, slug) {
  const out = [];
  const profile = readJson(at("raw", slug, "google", "profile.json"));
  if (profile?.rating) out.push({ platform: "Google", rating: profile.rating, count: profile.count ?? null, url: safeUrl(profile.url), where: "on Google" });
  else if (places?.rating) out.push({ platform: "Google", rating: places.rating, count: places.review_count ?? null, url: safeUrl(places.maps_url), where: "on Google" });
  const all = readJson(at("raw", slug, "reviews", "google.json"));
  if (all?.rating && !out.length) out.push({ platform: "Google", rating: all.rating, count: all.count ?? null, url: "", where: "on Google" });
  const best = (facts.ratings ?? [])[0];
  if (best) out.push({ platform: "Shown on their site", rating: Number(best.value), count: best.count ? Number(best.count) : null, url: safeUrl(best.url), where: "on their website" });
  return out;
}

/** Customers' words we hold, for counting themes. */
function reviewTexts(slug, places) {
  const all = readJson(at("raw", slug, "reviews", "google.json"));
  if (all?.items?.length) return all.items.map((x) => String(x.text ?? ""));
  return (places?.reviews ?? []).map((x) => String(x.quote ?? ""));
}

/** A complaint is shown as a trend or not at all: one unhappy customer doesn't speak for 1,800. */
const isTrend = (t) => t.of >= 50 && t.count != null && t.count >= 5 && t.count / t.of >= 0.05;
const countThemes = (list, texts) =>
  (list ?? []).map((t) => ({
    theme: safeText(t.theme ?? t.name),
    quote: safeText(t.quote),
    source: safeText(t.source),
    count: (t.words ?? []).length ? texts.filter((x) => t.words.some((w) => x.toLowerCase().includes(String(w).toLowerCase()))).length : null,
    of: texts.length,
  }));

/** Pictures at web size in static/media/<company>/; returns each file's address. One that can't be read costs only itself. */
function resized(slug, files, width) {
  const made = new Map();
  for (const f of files) {
    const from = at("raw", slug, f);
    if (!existsSync(from)) continue;
    const to = at("static", "media", slug, dirname(f).replace(/\/images$/, "").replace(/[^a-z0-9/-]/gi, ""));
    const name = basename(from).replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (/\.svg$/i.test(from)) {
      // Opened directly, an SVG runs on this site's address: one that could is left out.
      if (/<script|<foreignObject|\son\w+\s*=|javascript:/i.test(readFileSync(from, "utf8"))) {
        console.error(`build-data: ${slug}: left out ${f}: it holds a script`);
        continue;
      }
      mkdirSync(to, { recursive: true });
      copyFileSync(from, join(to, `${name}.svg`));
      made.set(f, join(to, `${name}.svg`).slice(at("static").length));
      continue;
    }
    const r = spawnSync("python3", [here("web_photos.py"), from, "--as", name, "--to", to, "--width", String(width), "--json"], { encoding: "utf8" });
    const out = [".jpg", ".png"].map((e) => join(to, `${name}${e}`)).find(existsSync);
    if (r.status === 0 && out) made.set(f, out.slice(at("static").length));
    else console.error(`build-data: ${slug}: left out ${f}: ${(r.stderr || "no picture made").trim().split("\n")[0]}`);
  }
  return made;
}

/** Offers we have seen, so a first-seen date outlives the record's rewrites. */
const LEDGER = at(".pipeline", "seen.json");
const ledger = readJson(LEDGER, { offers: {}, companies: {} });
const offersInRecords = new Set();

function offerStatus(offer, blocks) {
  if (offer.ends && String(offer.ends) < TODAY) return { live: false, why: `ended ${offer.ends}` };
  if (offer.corrected) return { live: true };
  const q = squash(offer.quote ?? "");
  const here = blocks.filter((b) => !b.held && b.text.includes(q) && (!offer.url || b.everyPage || sameUrl(b.url) === sameUrl(offer.url)));
  if (!here.length) return { live: false, why: /_ad$/.test(offer.source) ? "the ad is no longer running" : "it is gone from its source" };
  if (/_post$/.test(offer.source) && !offer.ends) {
    const posted = here[0].text.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
    if (posted && Date.parse(TODAY) - Date.parse(posted) > 90 * 86400_000) return { live: false, why: "posted over 90 days ago, with no end date" };
  }
  return { live: true };
}

function buildCompany(row, areas) {
  const slug = row.slug;
  const file = at("records", `${slug}.md`);
  if (!existsSync(file)) return null;
  const parsed = frontMatter(readFileSync(file, "utf8"));
  if (!parsed || parsed.error) return null;
  const d = parsed.data;
  if (d.in_niche === false) return { slug, inNiche: false, name: d.name ?? row.name };

  const siteDir = at("raw", slug, "site");
  const card = readJson(join(siteDir, "_index", "business-card.json"), {});
  const facts = readJson(join(siteDir, "_index", "facts.json"), {});
  const run = readJson(join(siteDir, "_index", "run.json"), {});
  const gathered = readJson(at("raw", slug, "gather.json"), {});
  const places = placesOf(slug);
  const blocks = loadSources(slug);
  const domain = row.domain;
  const crawled = run.finished?.slice(0, 10) ?? "";
  const fetched = gathered.fetched ?? crawled;

  const stamp = (item) => ({ quote: safeText(item.quote), url: safeUrl(item.url), where: item.source && SOURCE_LABELS[item.source] ? SOURCE_LABELS[item.source] : labelFor(item.url, domain), corrected: item.corrected ?? null });

  // Places: every location on its own, each placed by code.
  const locations = cell(row, "locations");
  const placed = locations.map((l) => ({ ...l, address: safeText(l.address), areas: areasAt(areas, l.lat, l.lng).map((x) => x.path) }));

  // What it says it serves, kept apart from where it is based.
  const serves = (d.serves ?? []).map((name) => ({ name: safeText(name), area: areaNamed(areas, String(name))?.path ?? null }));

  // Offers, each with its dates from the ledger.
  const offers = [];
  const retired = [];
  for (const o of d.offers ?? []) {
    const key = `${slug}|${slugify(o.kind)}|${slugify(o.title)}`;
    offersInRecords.add(key);
    const seen = (ledger.offers[key] ??= { first_seen: TODAY, slug, title: safeText(o.title) });
    const status = offerStatus(o, blocks);
    const item = { kind: canon("offer_kinds", o.kind), title: safeText(o.title), ends: o.ends ? String(o.ends) : null, conditions: safeText(o.conditions) ?? null, source: o.source, firstSeen: seen.first_seen, lastSeen: status.live ? fetched || TODAY : seen.last_seen ?? seen.first_seen, ...stamp(o) };
    if (status.live) {
      seen.last_seen = item.lastSeen;
      delete seen.retired;
      offers.push(item);
    } else {
      seen.retired ??= TODAY;
      seen.why = status.why;
      retired.push({ ...item, why: status.why });
    }
  }

  const mediaFiles = (d.media ?? []).filter((m) => m.kind !== "stock" && m.kind !== "logo");
  const logoFile = (d.media ?? []).find((m) => m.kind === "logo")?.file ?? (card.logo?.file ? `site/${card.logo.file}` : null);
  const photos = resized(slug, mediaFiles.map((m) => m.file), 1400);
  const logos = logoFile ? resized(slug, [logoFile], 400) : new Map();
  const texts = reviewTexts(slug, places);
  const contacts = contact(row, card, facts, places);
  const social = profiles([...new Set([...(card.same_as ?? []), ...readJson(at("raw", slug, "matches.json"), []).filter((m) => m.status === "confirmed").map((m) => m.url)])].map(safeUrl));

  // What a customer said, with a star count only where the platform gave one. A company's own pick has none.
  // A few quotes are enough, beside the rating and count.
  const googleReviews = (readJson(at("raw", slug, "reviews", "google.json"))?.items ?? places?.reviews ?? []).slice(0, 5);
  const reviewCards = [
    ...googleReviews.map((x) => ({ quote: safeText(x.text ?? x.quote), who: safeText(x.author ?? x.name), stars: Number(x.rating ?? x.stars) || null, day: x.date ?? null, where: "Google", url: safeUrl(x.url) })),
    ...(d.testimonials ?? []).map((t) => ({ quote: safeText(t.quote), who: safeText(t.who), stars: null, day: null, where: "On their website", url: safeUrl(t.url) })),
  ].filter((x) => x.quote && x.quote.length > 20).slice(0, 12);

  const company = {
    slug,
    name: safeText(d.name ?? row.name),
    pitch: d.pitch?.headline ? { headline: safeText(d.pitch.headline), points: (d.pitch.points ?? []).map((p) => ({ text: safeText(p.text), ...stamp(p) })) , ...stamp(d.pitch) } : null,
    reviewCards,
    leadTo: d.no_leads ? null : contacts.emails[0]?.value ?? null,
    termsUrl: termsPage(slug) ?? [...(d.offers ?? []), ...(d.guarantees ?? [])].find((x) => x.conditions && x.url)?.url ?? null,
    path: `/companies/${slug}`,
    website: safeUrl(row.website),
    domain,
    scope: d.scope ?? "local",
    crawled,
    fetched,
    note: safeText(row.note) || null,
    siteDown: Number(row.site_failures || 0) >= 2,
    leftSource: row.left_source || null,
    ...contacts,
    logo: logoFile ? logos.get(logoFile) ?? null : null,
    photos: mediaFiles.filter((m) => photos.has(m.file)).map((m) => ({ src: photos.get(m.file), kind: m.kind, alt: safeText(m.alt), source: safeUrl(m.url) || safeUrl(row.website), credit: safeText(m.credit) ?? null, creditUrl: safeUrl(m.credit_url) || null })),
    social,
    ratings: ratingsOf(facts, places, slug),
    locations: placed,
    serves,
    servesQuotes: (d.serves_evidence ?? []).map(stamp),
    background: d.background ? { summary: safeText(d.background.summary) ?? null, founded: d.background.founded ?? null, people: (d.background.people ?? []).map((p) => ({ name: safeText(p.name), role: safeText(p.role) })), evidence: (d.background.evidence ?? []).map(stamp) } : null,
    services: (d.services ?? []).map((s) => ({ name: canon("services", s.name), price: safeText(s.price) ?? null, ...stamp(s) })),
    guarantees: (d.guarantees ?? []).map((g) => ({ kind: canon("guarantee_kinds", g.kind), promise: safeText(g.promise) ?? null, length: safeText(g.length) ?? null, covers: safeText(g.covers) ?? null, conditions: safeText(g.conditions) ?? null, whose: g.whose ?? null, ...stamp(g) })),
    offers,
    retiredOffers: retired,
    brands: (d.brands ?? []).map((b) => ({ name: canon("brands", b.name), ...stamp(b) })),
    proof: (d.proof ?? []).map((p) => ({ kind: canon("proof_kinds", p.kind), title: safeText(p.title), ...stamp(p) })),
    details: (d.details ?? []).map((x) => ({ name: x.name, value: safeText(x.value) ?? null, ...stamp(x) })),
    keywords: (d.keywords ?? []).map((k) => canon("keywords", k)),
    testimonials: (d.testimonials ?? []).map((t) => ({ who: safeText(t.who) ?? null, ...stamp(t) })),
    reviews: d.reviews ? { praise: countThemes(d.reviews.praise, texts), complaints: countThemes(d.reviews.complaints, texts).filter(isTrend), services: countThemes(d.reviews.services, texts), read: texts.length } : null,
  };

  // The gate: kinds of real fact, never used to rank.
  const kinds = [company.guarantees.length, company.offers.length, company.services.length, company.proof.length, company.brands.length, company.background?.summary ? 1 : 0].filter(Boolean).length;
  company.factKinds = kinds;
  company.index = kinds >= GATE.company_facts;
  company.indexWhy = company.index ? `${kinds} kinds of fact` : `only ${kinds} kinds of fact, and the gate is ${GATE.company_facts}`;
  ledger.companies[slug] ??= TODAY;
  company.firstSeen = ledger.companies[slug];
  return company;
}

// ---- Lists ----

function group(companies, pick, key = (x) => x.name, every = false) {
  const map = new Map();
  for (const c of companies) {
    for (const item of pick(c)) {
      const name = key(item);
      if (!name || name === "other") continue;
      if (!map.has(name)) map.set(name, []);
      const list = map.get(name);
      if (every || !list.some((x) => x.company.slug === c.slug)) list.push({ company: { slug: c.slug, name: c.name, path: c.path }, ...item });
    }
  }
  return map;
}

const share = (n, of) => (of ? Math.round((n / of) * 100) : 0);
const tally = (items) => Object.entries(items.reduce((m, x) => (x ? ((m[x] = (m[x] ?? 0) + 1), m) : m), {})).map(([value, count]) => ({ value, count })).sort((x, y) => y.count - x.count || x.value.localeCompare(y.value));

/** The list's entries, each with who is in it and whether its page passes the gate. */
function listOf(map, base, total, extra = () => ({})) {
  return [...map]
    .map(([name, items]) => {
      const slug = slugify(name);
      const count = new Set(items.map((x) => x.company.slug)).size;
      const index = count >= GATE.list_companies;
      return { name, slug, path: `${base}/${slug}`, count, of: total, percent: share(count, total), companies: items, index, indexWhy: index ? `${count} companies` : `only ${count} companies, and the gate is ${GATE.list_companies}`, ...extra(name, items) };
    })
    .sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
}

/** Figures a guide may name; the build fills in {{placeholders}} from these so words never hold a stale number. */
const figuresHash = (count, total) => createHash("sha256").update(`${Math.round((count / Math.max(total, 1)) * 10)}`).digest("hex").slice(0, 12);

// ---- The build ----

const placeLabel = (p) => `${p.name.replace(/\s+(city|town|village|borough|CDP)$/i, "")}, ${p.state}`;
/** The site's one order: companies with a current offer, then the rest, each by name. */
const offersFirst = (x, y) => Number(y.offers.length > 0) - Number(x.offers.length > 0) || x.name.localeCompare(y.name);

const rows = readCompanies().filter((r) => r.state !== "removed");
const areas = loadAreas();
if (existsSync(at("static", "media"))) {
  const live = new Set(rows.map((r) => r.slug));
  for (const d of readdirSync(at("static", "media"))) if (!live.has(d)) rmSync(at("static", "media", d), { recursive: true, force: true });
}
const built = rows.map((r) => buildCompany(r, areas)).filter(Boolean);
// An offer a re-read dropped or retitled has ended, as far as the record goes.
for (const [key, o] of Object.entries(ledger.offers)) if (!offersInRecords.has(key) && built.some((c) => c.slug === o.slug)) o.retired ??= TODAY;
// A picture no record keeps any more stops being served: a takedown has to reach the site.
const keptMedia = new Set(built.flatMap((c) => [c.logo, ...(c.photos ?? []).map((p) => p.src)]).filter(Boolean));
for (const f of walk(at("static", "media"))) if (!keptMedia.has(f.slice(at("static").length))) rmSync(f);
const notNiche = built.filter((c) => c.inNiche === false);
const companies = built.filter((c) => c.inNiche !== false).sort(offersFirst);
if (!companies.length) fail("build-data: no records to build from", "node scripts/pipeline.mjs status");
const total = companies.length;

const services = listOf(group(companies, (c) => c.services), "/services", total, (name, items) => ({
  note: SERVICE_NOTES[name] ?? "",
  withPrice: items.filter((x) => x.price).length,
  mostMentioned: items
    .map((x) => {
      const c = companies.find((y) => y.slug === x.company.slug);
      const m = c.reviews?.services?.find((s) => canon("services", s.theme) === name);
      return m?.count != null ? { company: x.company, count: m.count, of: m.of, ratings: c.ratings } : null;
    })
    .filter((x) => x && x.count >= 10)
    .sort((p, q) => q.count - p.count),
}));
// Ranking: the market's marks, then what sets each company apart and its honest gaps (scripts/rank.mjs).
const market = marketOf(companies, GATE, TODAY);
for (const c of companies) Object.assign(c, { standouts: standouts(c, market, TODAY), gaps: gaps(c, market) });
const bySlug = new Map(companies.map((c) => [c.slug, c]));
/** The day a page's facts last changed, so its "updated" date moves only when what it shows does. */
function updatedOn(path, slugs) {
  // Everything a page states: each company's facts and the usual lengths it is measured against.
  const facts = [
    ...slugs.map((s) => bySlug.get(s)).map((c) => [c.slug, c.ratings.map((r) => [r.rating, r.count]), c.guarantees.map((g) => [g.kind, g.length]), c.offers.map((o) => o.title), c.services.map((s) => s.price), c.background?.founded ?? null]),
    Object.entries(market.guarantees).map(([k, g]) => [k, g.standardLabel]),
  ];
  const hash = createHash("sha256").update(JSON.stringify(facts)).digest("hex").slice(0, 12);
  ledger.pages ??= {};
  if (ledger.pages[path]?.hash !== hash) ledger.pages[path] = { hash, changed: TODAY };
  return ledger.pages[path].changed;
}

// A company can hold several guarantees of one kind, and the terms table shows each; `count` is companies.
// `standard` is the usual length, once 3 companies state one; `common` is offered by half or more.
const guarantees = listOf(group(companies, (c) => c.guarantees, (g) => g.kind, true), "/guarantees", total, (name, items) => ({
  standard: market.guarantees[name]?.standardLabel ?? null,
  common: market.guarantees[name]?.common ?? false,
  lengths: tally(items.map((x) => x.length)),
  whose: tally(items.map((x) => x.whose)),
  withConditions: new Set(items.filter((x) => x.conditions).map((x) => x.company.slug)).size,
}));
/** A brand's record (the read-brand skill, checked by brands.mjs check): the maker's terms and picked links. */
function makerOf(slug) {
  const file = at("records", "brands", `${slug}.md`);
  const d = existsSync(file) ? frontMatter(readFileSync(file, "utf8"))?.data : null;
  if (!d) return null;
  const link = (x) => ({ title: safeText(x.title), url: safeUrl(x.url), where: safeText(x.where) ?? null });
  return {
    site: safeUrl(d.site),
    warranty: (d.warranty ?? []).map((w) => ({ covers: safeText(w.covers), length: safeText(w.length) ?? null, condition: safeText(w.condition) ?? null, quote: safeText(w.quote), url: safeUrl(w.url) })),
    registration: d.registration ? { days: Number(d.registration.days) || null, quote: safeText(d.registration.quote), url: safeUrl(d.registration.url) } : null,
    reviews: (d.reviews ?? []).map(link).filter((x) => x.url),
    news: (d.news ?? []).map(link).filter((x) => x.url),
  };
}
// Each brand: who installs it, the maker's own terms, and what each installer gives on top of them.
const brands = listOf(group(companies, (c) => c.brands), "/brands", total, (name, items) => ({
  maker: makerOf(slugify(name)),
  adds: [...new Set(items.map((x) => x.company.slug))]
    .map((slug) => ({ company: items.find((x) => x.company.slug === slug).company, guarantees: bySlug.get(slug).guarantees.filter((g) => g.whose !== "manufacturer" && g.kind !== "other").map((g) => ({ kind: g.kind, length: g.length })) }))
    .filter((x) => x.guarantees.length),
}));
const topics = listOf(group(companies, (c) => c.keywords.map((k) => ({ name: k }))), "/topics", total);
const allOffers = companies.flatMap((c) => c.offers.map((o) => ({ ...o, company: { slug: c.slug, name: c.name, path: c.path }, services: c.services.map((s) => s.name), areas: c.locations.flatMap((l) => l.areas) }))).sort((x, y) => String(y.firstSeen).localeCompare(String(x.firstSeen)) || x.title.localeCompare(y.title));
const offerKinds = listOf(group(companies, (c) => c.offers, (o) => o.kind), "/offers", total);

// Areas: who is based in each, who says it serves each, and figures of its own.
const areaInfo = areas
  .map((area) => {
    const based = companies.filter((c) => basedIn(c, area.path, area.name));
    const says = companies.filter((c) => c.serves.some((s) => s.area === area.path));
    const here = [...new Map([...based, ...says].map((c) => [c.slug, c])).values()];
    if (!here.length) return null;
    const guaranteeCounts = tally(here.flatMap((c) => [...new Set(c.guarantees.map((g) => g.kind))])).map((x) => ({ kind: x.value, count: x.count, percent: share(x.count, here.length) }));
    const real = here.filter((c) => c.index).length;
    const stats = guaranteeCounts.length || here.some((c) => c.brands.length);
    const index = real >= GATE.area_companies && Boolean(stats);
    const order = ranked(here, market, area.path, area.name);
    return {
      name: area.name,
      kind: area.kind,
      state: area.state,
      slug: area.slug,
      path: area.path,
      based: based.map((c) => c.slug),
      serves: says.filter((c) => !based.includes(c)).map((c) => c.slug),
      count: here.length,
      guarantees: guaranteeCounts,
      brands: tally(here.flatMap((c) => [...new Set(c.brands.map((b) => b.name))])).slice(0, 12),
      services: tally(here.flatMap((c) => [...new Set(c.services.map((s) => s.name))])),
      offers: here.reduce((n, c) => n + c.offers.length, 0),
      ranked: order,
      updated: updatedOn(area.path, order),
      index,
      indexWhy: index ? `${real} companies with real data` : `${real} companies with real data, and the gate is ${GATE.area_companies}`,
      rank: area.rank,
    };
  })
  .filter(Boolean);

const serviceAreas = areaInfo
  .filter((x) => x.rank >= 1)
  .flatMap((area) =>
    area.services
      .filter((s) => s.count >= 1 && s.value !== "other")
      .map((s) => {
        const slug = slugify(s.value);
        const list = [...area.based, ...area.serves].filter((c) => companies.find((y) => y.slug === c)?.services.some((z) => z.name === s.value));
        const real = list.filter((c) => companies.find((y) => y.slug === c)?.index).length;
        const index = real >= GATE.service_area_companies;
        const order = ranked(list.map((x) => bySlug.get(x)), market, area.path, area.name);
        return { area: area.path, areaName: area.name, service: s.value, serviceSlug: slug, path: `${area.path}/${slug}`, companies: list, ranked: order, updated: updatedOn(`${area.path}/${slug}`, order), index, indexWhy: index ? `${real} companies with real data` : `${real} companies with real data, and the gate is ${GATE.service_area_companies}` };
      }),
  )
  .filter((x) => x.companies.length >= 2);
// Two cities with the same companies for a service are one page's worth of content: the first is open to search.
const sameList = new Map();
for (const x of serviceAreas) {
  const key = `${x.service}|${[...x.companies].sort().join()}`;
  if (!sameList.has(key)) sameList.set(key, x);
  else if (x.index) Object.assign(x, { index: false, indexWhy: `the same companies as ${sameList.get(key).areaName}` });
}

// "X vs Y" and alternatives: only where both sides have facts to set side by side.
const pairs = versus(companies, market, GATE, TODAY).map((v) => ({ ...v, updated: updatedOn(v.path, v.companies) }));
const rivals = alternatives(companies, market, GATE, TODAY).filter((x) => x.companies.length).map((x) => ({ ...x, updated: updatedOn(x.path, [x.slug, ...x.companies.map((y) => y.slug)]) }));

// Filters: each only when enough companies have that data.
// Counted against the companies read: one that is only listed says nothing about what its market offers.
const read = companies.filter((c) => c.services.length || c.guarantees.length || c.offers.length).length;
const enough = (n) => n >= Math.max(3, Math.ceil(read * 0.1));
const options = (pairs) => tally(pairs).filter((x) => enough(x.count));
const companyFilters = [
  { key: "services", label: "Service", options: options(companies.flatMap((c) => [...new Set(c.services.map((s) => s.name))])) },
  { key: "guarantees", label: "Guarantee", options: options(companies.flatMap((c) => [...new Set(c.guarantees.map((g) => g.kind))])) },
  { key: "brands", label: "Brand", options: options(companies.flatMap((c) => [...new Set(c.brands.map((b) => b.name))])) },
  { key: "details", label: "Also offers", options: options(companies.flatMap((c) => [...new Set(c.details.map((x) => x.name))])) },
].filter((f) => f.options.length);
const companyList = companies.map((c) => ({
  slug: c.slug,
  name: c.name,
  path: c.path,
  cities: [...new Set(c.locations.map((l) => l.city).filter(Boolean))],
  points: c.locations.filter((l) => l.lat != null).map((l) => [l.lat, l.lng]),
  areas: [...new Set(c.locations.flatMap((l) => l.areas))],
  serves: c.serves.map((s) => s.area).filter(Boolean),
  services: [...new Set(c.services.map((s) => s.name))],
  guarantees: [...new Set(c.guarantees.map((g) => g.kind))],
  terms: c.guarantees.map((g) => ({ kind: g.kind, text: [g.length, g.covers].filter(Boolean).join(": ") })),
  brands: [...new Set(c.brands.map((b) => b.name))],
  details: [...new Set(c.details.map((x) => x.name))],
  offers: c.offers.length,
  rating: c.ratings.find((r) => r.platform === "Google") ?? null,
  years: yearsOf(c, TODAY),
  photos: c.photos.length,
  phone: c.phones[0]?.value ?? null,
  postcodes: [...new Set(c.locations.map((l) => String(l.postcode ?? "").slice(0, 5)).filter(Boolean))],
}));
const showIf = {
  rating: enough(companyList.filter((c) => c.rating).length),
  years: enough(companyList.filter((c) => c.years != null).length),
  offers: enough(companyList.filter((c) => c.offers).length),
  photos: enough(companyList.filter((c) => c.photos).length),
  distance: enough(companyList.filter((c) => c.points.length).length),
};

// What the whole market looks like, all counted here.
const stats = {
  total,
  built: TODAY,
  niche: site.niche ?? "",
  withGuarantee: companies.filter((c) => c.guarantees.length).length,
  withOffer: companies.filter((c) => c.offers.length).length,
  withBrands: companies.filter((c) => c.brands.length).length,
  withWebsite: companies.filter((c) => c.website).length,
  withPrices: companies.filter((c) => c.services.some((s) => s.price)).length,
  withFounded: companies.filter((c) => c.background?.founded).length,
  ads: allOffers.filter((o) => /_ad$/.test(o.source)).length,
  offers: allOffers.length,
  ranked: ranked(companies, market),
  method: { reviews: market.floor, prior: market.prior, mean: market.mean },
};

const guides = [
  ...services.map((s) => ({ kind: "service", slug: s.slug, title: s.name, path: s.path, count: s.count, enough: s.count >= GATE.guide_companies, figures_hash: figuresHash(s.count, total), figures: { count: s.count, total: read, percent: share(s.count, read), with_price: s.withPrice } })),
  ...guarantees.map((g) => ({ kind: "guarantee", slug: g.slug, title: g.name, path: g.path, count: g.count, enough: g.count >= GATE.guide_companies, figures_hash: figuresHash(g.count, total), figures: { count: g.count, total: read, percent: share(g.count, read), with_conditions: g.withConditions } })),
];

const guideFile = (kind, slug) => at("content", kind, `${slug}.md`);
const hasGuide = (kind, slug) => existsSync(guideFile(kind, slug));

/** A list page indexes once it has companies, and a service's or guarantee's once it has its guide. */
const pages = [
  { path: "/", kind: "home", index: true },
  ...["/companies", "/offers", "/services", "/guarantees", "/brands", "/areas", "/topics", "/new", "/about"].map((path) => ({ path, kind: "hub", index: path !== "/offers" || allOffers.length > 0 })),
  ...companies.map((c) => ({ path: c.path, kind: "company", index: c.index, why: c.indexWhy })),
  ...offerKinds.map((o) => ({ path: o.path, kind: "offer-kind", index: o.count > 0, why: `${o.count} live offers` })),
  ...services.map((s) => ({ path: s.path, kind: "service", index: s.index && hasGuide("service", s.slug), why: s.index ? (hasGuide("service", s.slug) ? s.indexWhy : "its guide is not written yet") : s.indexWhy })),
  ...guarantees.map((g) => ({ path: g.path, kind: "guarantee", index: g.index, why: g.indexWhy })),
  ...brands.map((b) => ({ path: b.path, kind: "brand", index: b.index, why: b.indexWhy })),
  ...topics.map((t) => ({ path: t.path, kind: "topic", index: t.index, why: t.indexWhy })),
  ...areaInfo.map((x) => ({ path: x.path, kind: "area", index: x.index, why: x.indexWhy })),
  ...serviceAreas.map((x) => ({ path: x.path, kind: "service-area", index: x.index, why: x.indexWhy })),
  ...pairs.map((x) => ({ path: x.path, kind: "versus", index: true, why: `${x.fields.length} facts both state` })),
  ...rivals.map((x) => ({ path: x.path, kind: "alternatives", index: x.index, why: x.indexWhy })),
];

// New and changed, for /new: the last 90 days of the ledger.
const cutoff = new Date(Date.parse(TODAY) - 90 * 86400_000).toISOString().slice(0, 10);
// A company is news once the site exists: everything on the first day was simply there.
const firstDay = Object.values(ledger.companies).sort()[0];
const events = [
  ...Object.entries(ledger.companies).filter(([slug, d]) => d >= cutoff && d > firstDay && companies.some((c) => c.slug === slug)).map(([slug, d]) => ({ day: d, kind: "New company", text: companies.find((c) => c.slug === slug).name, path: `/companies/${slug}` })),
  ...Object.values(ledger.offers).filter((o) => o.first_seen >= cutoff && !o.retired && companies.some((c) => c.slug === o.slug)).map((o) => ({ day: o.first_seen, kind: "New offer", text: `${companies.find((c) => c.slug === o.slug).name}: ${o.title}`, path: `/companies/${o.slug}` })),
  ...Object.values(ledger.offers).filter((o) => o.retired >= cutoff && companies.some((c) => c.slug === o.slug)).map((o) => ({ day: o.retired, kind: "Offer ended", text: `${companies.find((c) => c.slug === o.slug).name}: ${o.title}`, path: `/companies/${o.slug}` })),
].sort((x, y) => y.day.localeCompare(x.day) || x.text.localeCompare(y.text));

// ZIP codes, from the Census's lists. A company serves a ZIP when it is based there, or based in
// or says it serves a city that ZIP belongs to.
const zipMap = loadZipMap();
// Cities only: a whole county is too wide to say a company serves one ZIP in it.
const cities = areaInfo.filter((x) => x.kind === "locality");
for (const x of areaInfo) x.zips = x.kind === "locality" ? zipMap.zipsOf(x.name, x.state) : [];
const zipAreas = new Map();
for (const x of cities) for (const z of zipMap.zipsOf(x.name, x.state)) zipAreas.set(z, [...(zipAreas.get(z) ?? []), x.path]);
const centers = new Map(zipCenters().map(([z, la, ln]) => [z, [la, ln]]));
/** Every ZIP a company works in: its own addresses', and those of the cities it is in or names. */
function zipsOfCompany(c) {
  const own = c.locations.map((l) => String(l.postcode ?? "").slice(0, 5)).filter((z) => /^\d{5}$/.test(z));
  const here = [...c.locations.flatMap((l) => l.areas), ...c.serves.map((s) => s.area).filter(Boolean)];
  const fromCities = areaInfo.filter((x) => x.kind === "locality" && here.includes(x.path)).flatMap((x) => x.zips);
  return [...new Set([...own, ...fromCities])].sort();
}
for (const c of companies) c.zips = zipsOfCompany(c);
const zipPages = [...new Set(companies.flatMap((c) => c.zips))].sort().map((zip) => {
  const inZip = companies.filter((c) => c.zips.includes(zip));
  const real = inZip.filter((c) => c.index).length;
  const place = zipMap.placesOf(zip).find((p) => p.kind === "city") ?? zipMap.placesOf(zip)[0];
  return { zip, path: `/zips/${zip}`, place: place ? placeLabel(place) : null, companies: inZip.map((c) => c.slug), index: real >= GATE.area_companies, indexWhy: real >= GATE.area_companies ? `${real} companies with real data` : `${real} with real data, and the gate is ${GATE.area_companies}` };
});
// Several ZIPs of a city often share one list of companies: the first is open to search.
const sameZips = new Map();
for (const z of zipPages) {
  const key = z.companies.join();
  if (!sameZips.has(key)) sameZips.set(key, z);
  else if (z.index) Object.assign(z, { index: false, indexWhy: `the same companies as ${sameZips.get(key).zip}` });
}
pages.push(...zipPages.map((z) => ({ path: z.path, kind: "zip", index: z.index, why: z.indexWhy })));
/** For the browser: [zip, lat, lng, the areas it belongs to], for ZIPs near the companies. */
function zipPoints() {
  const pts = companyList.flatMap((c) => c.points);
  if (!pts.length) return [];
  const [s, n] = [Math.min(...pts.map((p) => p[0])) - 1, Math.max(...pts.map((p) => p[0])) + 1];
  const [w, e] = [Math.min(...pts.map((p) => p[1])) - 1, Math.max(...pts.map((p) => p[1])) + 1];
  return [...centers].filter(([, [la, ln]]) => la >= s && la <= n && ln >= w && ln <= e).map(([z, [la, ln]]) => [z, la, ln, zipAreas.get(z) ?? []]);
}

/** What the search box looks through, by type. Offers take turns by company, so a sample shows many. */
function searchIndex() {
  const queues = companies.map((c) => c.offers.map((o) => ({ t: "offer", n: o.title, s: c.name, p: c.path, k: o.kind })));
  const offers = [];
  for (let i = 0; queues.some((q) => q[i]); i++) for (const q of queues) if (q[i]) offers.push(q[i]);
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  const named = (t, list, s) => list.map((x) => ({ t, n: cap(x.name), s: s(x), p: x.path }));
  const rated = (c) => [...new Set(c.locations.map((l) => l.city).filter(Boolean))].slice(0, 2).join(", ");
  return [
    ...offers,
    ...named("service", services, (x) => `${x.count} ${x.count === 1 ? "company" : "companies"}`),
    ...guarantees.map((g) => ({ t: "guarantee", n: `${cap(g.name)} guarantee`, s: `${g.count} ${g.count === 1 ? "company" : "companies"}`, p: g.path })),
    ...named("company", companies, rated),
    ...named("area", areaInfo.filter((x) => x.kind === "locality").sort((x, y) => y.count - x.count), (x) => `${x.count} ${x.count === 1 ? "company" : "companies"}`),
    ...zipPages.map((z) => ({ t: "zip", n: z.zip, s: z.place ?? "", p: z.path })),
    ...named("brand", brands, (x) => `${x.count} ${x.count === 1 ? "company" : "companies"}`),
  ];
}

/** An area's largest ring, thinned to 200 points at most: enough to draw on a map. */
function outline(geometry) {
  const rings = geometry.type === "Polygon" ? [geometry.coordinates[0]] : geometry.coordinates.map((p) => p[0]);
  const ring = rings.sort((x, y) => y.length - x.length)[0];
  const step = Math.ceil(ring.length / 200);
  const thin = ring.filter((_, i) => i % step === 0).map(([x, y]) => [Number(x.toFixed(4)), Number(y.toFixed(4))]);
  return [...thin, thin[0]];
}

const previous = readJson(at("data", "stats.json"));
const write = (name, value) => writeJson(at("data", `${name}.json`), value);
write("companies", companies);
write("services", services);
write("guarantees", guarantees);
write("brands", brands);
write("topics", topics);
write("offers", { live: allOffers, kinds: offerKinds, retired: companies.flatMap((c) => c.retiredOffers.map((o) => ({ ...o, company: { slug: c.slug, name: c.name, path: c.path } }))) });
write("areas", areaInfo);
write("service-areas", serviceAreas);
write("versus", pairs);
write("alternatives", rivals);
write("stats", stats);
write("guides", guides);
write("pages", pages);
write("new", events.slice(0, 100));
write("filters", { companies: companyFilters, show: showIf });
write("list-companies", companyList);
write("zips", zipPoints());
write("zip-pages", zipPages);
write("search", searchIndex());
write("area-shapes", Object.fromEntries(areas.filter((x) => x.rank >= 1 && areaInfo.some((i) => i.path === x.path)).map((x) => [x.path, outline(x.geometry)])));
writeAtomic(LEDGER, `${JSON.stringify(ledger, null, 2)}\n`);

const retiredNow = companies.flatMap((c) => c.retiredOffers).filter((o) => ledger.offers && Object.values(ledger.offers).some((x) => x.retired === TODAY && x.title === o.title));
if (retiredNow.length) log(`retired ${retiredNow.length} offers`, TODAY);
const indexable = pages.filter((p) => p.index).length;
done("build-data", `${total} companies, ${allOffers.length} live offers, ${pages.length} pages (${indexable} open to search)`, {
  lines: [
    `${guarantees.length} guarantee kinds, ${services.length} services, ${brands.length} brands, ${topics.length} phrases, ${areaInfo.length} areas`,
    ...(previous && previous.total !== total ? [`${total - previous.total} more companies than the last build`] : []),
    ...(retiredNow.length ? [`${retiredNow.length} offers retired today`] : []),
    ...(notNiche.length ? [`Left out, not this niche: ${notNiche.map((c) => c.name).join(", ")}`] : []),
    ...(fields.services ? [] : ["fields.yaml lists no services yet: agree them on the sample (tidy-names)"]),
  ],
  next: "npm run check",
});

