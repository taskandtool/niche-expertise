// Best-of lists, "X vs Y" and alternatives: the order, the reasons and the gaps all come
// from scripts/rank.mjs. A page words them here, the same way every time.
import { Check, PageHead, RatingBadge, Section, itemList, lengthWord, plural, title } from "../components";
import type { Alternatives, Company, Data, Reason, Standout, Versus } from "../data";
import { Band, site, type Page } from "../shell";

const month = (s: string) => (s ? new Date(`${s}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) : "");
const google = (c: Company) => c.ratings.find((r) => r.platform === "Google" && r.count != null) ?? null;
/** The Google rating the ranking counts: from `floor` reviews or more, as scripts/rank.mjs reads it. */
const rated = (c: Company, floor: number) => {
  const r = google(c);
  return r && r.count! >= floor ? r : null;
};
const ratingText = (c: Company) => {
  const r = google(c);
  return r ? `${r.rating.toFixed(1)} from ${r.count!.toLocaleString("en-US")} Google reviews` : null;
};
/** "10 years" before a noun reads "10-year"; "lifetime" stays a word. */
const asLength = (length: string) => title(lengthWord(length));

export function standoutText(s: Standout): string {
  if (s.kind === "longer-guarantee") return `${asLength(s.length)} ${s.guarantee} guarantee (most offer ${s.standard})`;
  if (s.kind === "rare-guarantee") return `One of ${s.count} companies here with a ${s.guarantee} guarantee`;
  if (s.kind === "most-reviewed") return `Most Google reviews here: ${s.count.toLocaleString("en-US")}`;
  if (s.kind === "years") return `In business ${s.years} years`;
  return `Current offer: ${s.title}`;
}

export const gapText = (g: Company["gaps"][number], floor: number) =>
  g === "no-prices" ? "No prices posted" : g === "no-guarantee" ? "No guarantee stated" : `No Google rating from ${floor} or more reviews`;

/** Why a company beats `base`; a rating reason says against what, since the weighting counts reviews too. */
function reasonText(r: Reason, base: Company, floor: number): string {
  if (r.kind === "rating") {
    const theirs = rated(base, floor);
    const mine = `${r.rating.toFixed(1)} from ${r.count.toLocaleString("en-US")} Google reviews`;
    if (!theirs) return `Rated ${mine}`;
    if (r.rating.toFixed(1) === theirs.rating.toFixed(1)) return `The same ${mine.replace(" from", " rating from")}, against ${theirs.count!.toLocaleString("en-US")}`;
    return `Rated ${mine}, against ${theirs.rating.toFixed(1)}`;
  }
  if (r.kind === "guarantee") return `${asLength(r.length)} ${r.guarantee} guarantee`;
  if (r.kind === "longer-guarantee") return `${asLength(r.length)} ${r.guarantee} guarantee, against ${r.theirs}`;
  if (r.kind === "offer") return `Current offer: ${r.title}`;
  return `In business ${r.years} years`;
}

const guaranteeCell = (c: Company) => [...new Map(c.guarantees.filter((g) => g.kind !== "other").map((g) => [g.kind, g])).values()].map((g) => `${title(g.kind)}${g.length && g.length.length <= 24 ? `: ${g.length}` : ""}`).join("; ");

/** The same columns in the same order on every page; a blank is "not stated". */
export function ComparisonTable({ companies, label }: { companies: Company[]; label: string }) {
  const years = (c: Company) => (c.background?.founded ? `Since ${c.background.founded}` : "");
  const cols: [string, (c: Company) => string][] = [
    ["Google rating", (c) => ratingText(c) ?? ""],
    ["Guarantees", guaranteeCell],
    ["Current offer", (c) => c.offers[0]?.title ?? ""],
    ["In business", years],
    ["Prices posted", (c) => (c.services.some((s) => s.price) ? "Yes" : "")],
  ];
  return (
    <div class="overflow-x-auto rounded-card border border-line bg-surface" tabindex={0} role="region" aria-label={label}>
      <table class="w-full min-w-[44rem] text-left">
        <thead class="bg-panel text-label text-ink-2">
          <tr><th scope="col" class="px-4 py-3 font-semibold">Company</th>{cols.map(([h]) => <th scope="col" class="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr class="border-t border-line align-top">
              <th scope="row" class="px-4 py-3 font-semibold"><a href={c.path}>{c.name}</a></th>
              {cols.map(([, cell]) => {
                const v = cell(c);
                return <td class={`px-4 py-3 ${v ? "" : "text-ink-3"}`}>{v || "not stated"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The ranked list itself: place, name, rating, one reason and one honest gap. A gap most of
 * the list shares tells the reader nothing about this company, so it isn't shown. */
export function RankedList({ companies, floor }: { companies: Company[]; floor: number }) {
  const common = new Set(["no-prices", "no-guarantee", "no-rating"].filter((g) => companies.filter((c) => c.gaps.includes(g as Company["gaps"][number])).length > companies.length / 2));
  return (
    <ol class="grid gap-3">
      {companies.map((c, i) => {
        const why = c.standouts[0];
        const gap = c.gaps.find((g) => !common.has(g));
        const cities = [...new Set(c.locations.map((l) => l.city).filter(Boolean))].join(", ");
        return (
          <li class="relative flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
            <span class="font-display text-section leading-none text-ink-3" aria-hidden="true">{i + 1}</span>
            <div class="min-w-0">
              <h3 class="font-body text-title"><a href={c.path} class="no-underline after:absolute after:inset-0 hover:underline">{c.name}</a></h3>
              {cities ? <p class="text-label text-ink-3">{cities}</p> : null}
              {google(c) ? <p class="mt-1.5 text-label text-ink-2"><RatingBadge ratings={[google(c)!]} /></p> : null}
              {why ? <p class="mt-2 flex items-start gap-2"><Check class="mt-0.5" /><span>{standoutText(why)}</span></p> : null}
              {gap ? <p class="mt-1 text-label text-ink-3">{gapText(gap, floor)}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const MethodLine = ({ area, count, floor, updated }: { area?: string; count: number; floor: number; updated: string }) => (
  <p class="mt-4 max-w-content text-ink-2">
    How we rank: {area ? `companies based in ${area} come first, then the best Google ratings.` : "the best Google ratings first."} A rating counts once it has {floor} reviews, and more reviews count for more. {plural(count, "company", "companies")} compared. Updated {month(updated)}.
  </p>
);

/** The answer a searcher came for, in two sentences built from data. */
function bestAnswer(list: Company[], where: string, what: string, floor: number) {
  // Companies based here rank first even unrated, so the top-rated one may not be first.
  const top = list.find((c) => rated(c, floor));
  const guaranteed = list.filter((c) => c.guarantees.length).length;
  const first = !top
    ? `None of the ${list.length} ${what} we compared in ${where} has a Google rating from ${floor} or more reviews yet.`
    : top === list[0]
      ? `${top.name} ranks first of the ${list.length} ${what} we compared in ${where}, rated ${ratingText(top)}.`
      : `${top.name} is the top-rated of the ${list.length} ${what} we compared in ${where}, at ${ratingText(top)}.`;
  const second = !guaranteed ? "None of them publish a guarantee." : guaranteed === list.length ? `All ${list.length} publish a guarantee.` : `${guaranteed} of the ${list.length} publish a guarantee.`;
  return `${first} ${second}`;
}

/** A best-of block for an area or a service in it: the answer, the method, the list and the table. */
export function BestOf({ d, ranked, where, what, area, updated }: { d: Data; ranked: string[]; where: string; what: string; area: string; updated: string }) {
  const list = ranked.map((s) => d.companies.find((c) => c.slug === s)).filter((c): c is Company => Boolean(c));
  if (!list.length) return null;
  const floor = d.stats.method.reviews;
  return (
    <>
      <Band class="pb-2">
        <p class="max-w-content text-lede">{bestAnswer(list, where, what, floor)}</p>
        <MethodLine area={area} count={list.length} floor={floor} updated={updated} />
      </Band>
      <Section heading={`The ${what} we compared`}><RankedList companies={list} floor={floor} /></Section>
      <Section heading="Side by side"><ComparisonTable companies={list} label={`${title(what)} in ${where}, side by side`} /></Section>
    </>
  );
}

/** Structured data for a best-of: the ranked companies in order. */
export const rankedItems = (d: Data, name: string, ranked: string[]) => itemList(name, ranked.map((s) => d.companies.find((c) => c.slug === s)).filter((c): c is Company => Boolean(c)));

// ---- X vs Y ----

/** Who leads on each fact both state (scripts/rank.mjs), in words. No overall winner: ties and one-sided offers make "ahead on every fact" an overclaim. */
function verdicts(v: Versus, a: Company, b: Company) {
  const name = (slug: string) => (slug === a.slug ? a : b).name;
  const out: string[] = [];
  const lead = v.ahead.find((x) => x.field === "rating");
  if (google(a) && google(b)) {
    const [hi, lo] = lead?.slug === b.slug ? [b, a] : [a, b];
    out.push(`${hi.name} is rated ${ratingText(hi)}; ${lo.name}, ${ratingText(lo)}.`);
  }
  for (const x of v.ahead) {
    if (x.field === "guarantee") out.push(`${name(x.slug)} has the longer ${x.guarantee} guarantee: ${x.length}, against ${x.other}.`);
    if (x.field === "offer") out.push(`${name(x.slug)} has a current offer: ${x.title}.`);
    if (x.field === "years") out.push(`${name(x.slug)} has been in business longer: ${x.years} years.`);
  }
  return out;
}

export function versusPage(d: Data, v: Versus) {
  const [a, b] = v.companies.map((s) => d.companies.find((c) => c.slug === s)!);
  const page: Page = {
    path: v.path,
    title: `${a.name} vs ${b.name}`,
    description: `${a.name} and ${b.name} side by side: Google rating, guarantees, current offers and years in business.`,
    crumbs: [{ label: "Companies", href: "/companies" }],
  };
  const others = d.versus.filter((x) => x !== v && x.companies.some((s) => v.companies.includes(s)));
  const Body = () => (
    <div data-pagefind-body>
      <PageHead page={page} lede={verdicts(v, a, b).join(" ")} />
      <Band><p class="max-w-content text-label text-ink-3">Every fact here comes from each company's own website and its Google listing. Updated {month(v.updated)}.</p></Band>
      <Section heading="Side by side"><ComparisonTable companies={[a, b]} label={`${a.name} and ${b.name}, side by side`} /></Section>
      <Section heading="More on each">
        <ul class="space-y-1.5">
          {[a, b].map((c) => <li><a href={c.path}>{c.name}</a>{d.alternatives.some((x) => x.slug === c.slug) ? <> <span aria-hidden="true">·</span> <a href={`${c.path}/alternatives`}>Alternatives to {c.name}</a></> : null}</li>)}
          {others.map((x) => <li><a href={x.path}>{x.companies.map((s) => d.companies.find((c) => c.slug === s)?.name).join(" vs ")}</a></li>)}
        </ul>
      </Section>
    </div>
  );
  return { page, Body };
}

// ---- Alternatives ----

export function alternativesPage(d: Data, x: Alternatives) {
  const c = d.companies.find((y) => y.slug === x.slug)!;
  const rows = x.companies.map((y) => ({ c: d.companies.find((z) => z.slug === y.slug)!, why: y.why }));
  const page: Page = {
    path: x.path,
    title: `Alternatives to ${c.name}`,
    description: `${plural(rows.length, "company", "companies")} near ${c.name} that beat it on a stated fact: rating, guarantees, offers or years in business.`,
    index: x.index,
    crumbs: [{ label: "Companies", href: "/companies" }, { label: c.name, href: c.path }],
    jsonLd: [itemList(`Alternatives to ${c.name}`, rows.map((r) => r.c))],
  };
  const floor = d.stats.method.reviews;
  const lede = `${c.name}${rated(c, floor) ? ` is rated ${ratingText(c)}` : " has no Google rating with enough reviews yet"}. ${rows.length === 1 ? "This nearby company beats" : `These ${rows.length} nearby companies each beat`} it on at least one fact they state.`;
  const Body = () => (
    <div data-pagefind-body>
      <PageHead page={page} lede={lede} />
      <Band><p class="max-w-content text-label text-ink-3">In rating order, weighted toward companies with more reviews. Updated {month(x.updated)}.</p></Band>
      <Section heading="Who beats it, and on what">
        <ol class="grid gap-3">
          {rows.map(({ c: y, why }) => (
            <li class="relative rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
              <h3 class="font-body text-title"><a href={y.path} class="no-underline after:absolute after:inset-0 hover:underline">{y.name}</a></h3>
              <ul class="mt-2 space-y-1">{why.map((r) => <li class="flex items-start gap-2"><Check class="mt-0.5" /><span>{reasonText(r, c, floor)}</span></li>)}</ul>
            </li>
          ))}
        </ol>
      </Section>
      <Section heading="Side by side"><ComparisonTable companies={[c, ...rows.map((r) => r.c)]} label={`${c.name} and its alternatives, side by side`} /></Section>
    </div>
  );
  return { page, Body };
}

/** Every comparison a company is part of, for its page: alternatives, "vs" pages and the best-of lists it ranks on. */
export function compareLinks(d: Data, c: Company): { path: string; label: string }[] {
  const named = (s: string) => d.companies.find((y) => y.slug === s)?.name;
  const alt = d.alternatives.find((x) => x.slug === c.slug && x.companies.length);
  return [
    ...(alt ? [{ path: alt.path, label: `Alternatives to ${c.name}` }] : []),
    ...d.versus.filter((v) => v.companies.includes(c.slug)).map((v) => ({ path: v.path, label: v.companies.map(named).join(" vs ") })),
    ...d.areas.filter((a) => a.index && a.ranked.includes(c.slug)).map((a) => ({ path: a.path, label: `Best ${site.noun} in ${a.name}` })),
    ...d.serviceAreas.filter((s) => s.index && s.ranked.includes(c.slug)).map((s) => ({ path: s.path, label: `Best ${s.service} in ${s.areaName}` })),
  ].slice(0, 10);
}
