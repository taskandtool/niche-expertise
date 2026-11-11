// How a best-of list is ordered and what it says about each company, by code: guarantee
// lengths read as months, what is standard for each guarantee, what sets a company apart,
// its honest gaps, and which comparisons and alternatives have enough facts to be pages.
// Pure functions over build-data's companies; build-data writes what they return.

const UNIT = { day: 1 / 30, week: 7 / 30, month: 1, year: 12, yr: 12 };
const WORD = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, sixty: 60, ninety: 90 };
// Not after a hyphen or letter: "forty-five days" is no length we can read, never "five days".
const LENGTH = new RegExp(`(?<![\\w-])(\\d+(?:\\.\\d+)?|${Object.keys(WORD).join("|")})(?:\\s*(?:-|–|to)\\s*\\d+(?:\\.\\d+)?)?[\\s-]*(day|week|month|year|yr)s?\\b`);
// "Lifetime of your membership" lasts as long as a membership, not for life.
const LIFETIME = /\b(lifetime|for life|forever)\b(?! of)/;

/** A guarantee's length in months, from the first length it states: "10–12 years on mini-splits" is 120. Lifetime is Infinity; none is null. */
export function lengthMonths(text) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  const m = LENGTH.exec(t);
  const life = LIFETIME.exec(t);
  if (life && (!m || life.index < m.index)) return Infinity;
  return m ? (WORD[m[1]] ?? Number(m[1])) * UNIT[m[2]] : null;
}

/** Months as a reader says them: "lifetime", "10 years", "6 months", "45 days" (a length that isn't whole months stays in days). */
export function monthsLabel(m) {
  if (m === Infinity) return "lifetime";
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const whole = Math.abs(m - Math.round(m)) < 1e-9;
  if (whole && m >= 12 && Math.round(m) % 12 === 0) return plural(Math.round(m) / 12, "year");
  if (whole && m >= 1) return plural(Math.round(m), "month");
  return plural(Math.round(m * 30), "day");
}

/** A company's Google rating, only once it has enough reviews to mean something. */
export function googleRating(c, floor) {
  const r = c.ratings.find((x) => x.platform === "Google");
  return r && r.rating && (r.count ?? 0) >= floor ? { rating: Number(r.rating), count: Number(r.count) } : null;
}

/** The longest stated length of each guarantee kind a company gives. */
const longest = (c) => {
  const out = new Map();
  for (const g of c.guarantees) {
    const m = lengthMonths(g.length);
    if (m != null && !(out.get(g.kind)?.months >= m)) out.set(g.kind, { months: m, length: g.length });
  }
  return out;
};

const areasOf = (c) => new Set([...c.locations.flatMap((l) => l.areas), ...c.serves.map((s) => s.area).filter(Boolean)]);
const shares = (a, b) => [...a].some((x) => b.has(x));
const servicesOf = (c) => new Set(c.services.map((s) => s.name));

/**
 * What the market looks like for ranking: the floor and weight from the gate, the average rating,
 * each guarantee kind's standard length (the median of those stated, once 3 state one) and how
 * common it is among the companies read (a company only listed says nothing about its terms),
 * and the review and years marks a company has to pass to stand out.
 */
export function marketOf(companies, gate, today) {
  const floor = gate.rating_reviews;
  const rated = companies.map((c) => googleRating(c, floor)).filter(Boolean);
  const mean = rated.length ? rated.reduce((n, r) => n + r.rating, 0) / rated.length : 0;
  const read = companies.filter((c) => c.services.length || c.guarantees.length || c.offers.length).length;
  const kinds = new Map();
  for (const c of companies) for (const kind of new Set(c.guarantees.map((g) => g.kind))) kinds.set(kind, { count: (kinds.get(kind)?.count ?? 0) + 1, months: [] });
  for (const c of companies) for (const [kind, x] of longest(c)) kinds.get(kind).months.push(x.months);
  const guarantees = Object.fromEntries(
    [...kinds].map(([kind, x]) => {
      const sorted = x.months.sort((p, q) => p - q);
      const standard = sorted.length >= 3 ? sorted[Math.floor((sorted.length - 1) / 2)] : null;
      return [kind, { count: x.count, of: read, common: x.count * 2 >= read, standard, standardLabel: standard == null ? null : monthsLabel(standard), stated: sorted.length }];
    }),
  );
  const years = companies.map((c) => yearsOf(c, today)).filter((y) => y != null).sort((p, q) => p - q);
  return {
    floor,
    prior: gate.rating_prior,
    mean: Math.round(mean * 100) / 100,
    guarantees,
    mostReviews: Math.max(0, ...rated.map((r) => r.count)),
    yearsMark: years.length >= 3 ? years[Math.floor(years.length * 0.75)] : null,
  };
}

export const yearsOf = (c, today) => (c.background?.founded ? new Date(today).getFullYear() - Number(c.background.founded) : null);

/** A rating weighted toward more reviews: as if each company also had `prior` reviews at the market's average. Orders; never shown. */
const weighted = (r, market) => (r.rating * r.count + market.mean * market.prior) / (r.count + market.prior);

/** Based in an area: inside its boundary, or with its name as the address's city (a pin just outside city limits still reads as local). */
export const basedIn = (c, area, areaName = null) => c.locations.some((l) => l.areas.includes(area) || (areaName && l.city === areaName));

/**
 * A best-of order over the companies that pass the company gate: those based in `area` first
 * (basedIn), then rated companies by weighted rating, then the rest with a current offer first,
 * each by name.
 */
export function ranked(companies, market, area = null, areaName = null) {
  const key = (c) => {
    const r = googleRating(c, market.floor);
    const based = area && basedIn(c, area, areaName);
    return { based: based ? 0 : 1, score: r ? weighted(r, market) : -1 };
  };
  return companies
    .filter((c) => c.index)
    .map((c) => ({ c, k: key(c) }))
    .sort((x, y) => x.k.based - y.k.based || y.k.score - x.k.score || Number(y.c.offers.length > 0) - Number(x.c.offers.length > 0) || x.c.name.localeCompare(y.c.name))
    .map((x) => x.c.slug);
}

/** What sets a company apart, from facts, strongest first. Each is data; the page words it. */
export function standouts(c, market, today) {
  const out = [];
  for (const [kind, x] of longest(c)) {
    const m = market.guarantees[kind];
    if (m?.standard != null && x.months > m.standard) out.push({ kind: "longer-guarantee", guarantee: kind, length: monthsLabel(x.months), standard: m.standardLabel });
  }
  for (const kind of new Set(c.guarantees.map((g) => g.kind))) {
    const m = market.guarantees[kind];
    if (kind !== "other" && m && m.of >= 8 && m.count * 4 <= m.of) out.push({ kind: "rare-guarantee", guarantee: kind, count: m.count, of: m.of });
  }
  const r = googleRating(c, market.floor);
  if (r && r.count === market.mostReviews) out.push({ kind: "most-reviewed", rating: r.rating, count: r.count });
  const years = yearsOf(c, today);
  if (market.yearsMark != null && years != null && years >= market.yearsMark) out.push({ kind: "years", years });
  if (c.offers[0]) out.push({ kind: "offer", title: c.offers[0].title });
  return out;
}

/** The honest gaps a reader should know before calling: no prices, no guarantee, no rating with enough reviews. */
export function gaps(c, market) {
  return [
    ...(c.services.length && !c.services.some((s) => s.price) ? ["no-prices"] : []),
    ...(c.guarantees.length ? [] : ["no-guarantee"]),
    ...(googleRating(c, market.floor) ? [] : ["no-rating"]),
  ];
}

/** The facts two companies both state, so a table can set them side by side. */
export function sharedFields(a, b, market, today) {
  const kinds = (c) => new Set(c.guarantees.map((g) => g.kind));
  return [
    googleRating(a, market.floor) && googleRating(b, market.floor) && "rating",
    yearsOf(a, today) != null && yearsOf(b, today) != null && "years",
    shares(kinds(a), kinds(b)) && "guarantees",
    a.offers.length && b.offers.length && "offers",
    a.services.some((s) => s.price) && b.services.some((s) => s.price) && "prices",
  ].filter(Boolean);
}

/** Who is ahead on each fact both state: the weighted rating, each shared guarantee's length, a current offer, years in business. */
function ahead(a, b, market, today) {
  const out = [];
  const [ra, rb] = [googleRating(a, market.floor), googleRating(b, market.floor)];
  if (ra && rb && weighted(ra, market) !== weighted(rb, market)) out.push({ field: "rating", slug: weighted(ra, market) > weighted(rb, market) ? a.slug : b.slug });
  const lb = longest(b);
  for (const [kind, x] of longest(a)) {
    const y = lb.get(kind);
    if (kind === "other" || !y || x.months === y.months) continue;
    const [win, lose, who] = x.months > y.months ? [x, y, a] : [y, x, b];
    out.push({ field: "guarantee", slug: who.slug, guarantee: kind, length: monthsLabel(win.months), other: monthsLabel(lose.months) });
  }
  for (const [x, y] of [[a, b], [b, a]]) if (x.offers.length && !y.offers.length) out.push({ field: "offer", slug: x.slug, title: x.offers[0].title });
  const [ya, yb] = [yearsOf(a, today), yearsOf(b, today)];
  if (ya != null && yb != null && ya !== yb) out.push({ field: "years", slug: ya > yb ? a.slug : b.slug, years: Math.max(ya, yb) });
  return out;
}

/**
 * "X vs Y" pairs: both pass the company gate and have a rating, they share a service and an area,
 * and they state at least `gate.versus_fields` of the same facts. Each company keeps its 3 closest
 * rivals: most services in common, then nearest in review count. Slugs sorted, so a pair is one page.
 * `ahead` says who leads on each fact.
 */
export function versus(companies, market, gate, today) {
  const pool = companies.filter((c) => c.index && googleRating(c, market.floor));
  const pairs = new Map();
  for (const a of pool) {
    const rivals = pool
      .filter((b) => b !== a && shares(servicesOf(a), servicesOf(b)) && shares(areasOf(a), areasOf(b)))
      .map((b) => ({ b, fields: sharedFields(a, b, market, today), common: [...servicesOf(a)].filter((s) => servicesOf(b).has(s)).length, gap: Math.abs(Math.log(googleRating(a, market.floor).count / googleRating(b, market.floor).count)) }))
      .filter((x) => x.fields.length >= gate.versus_fields)
      .sort((x, y) => y.common - x.common || x.gap - y.gap)
      .slice(0, 3);
    for (const { b, fields } of rivals) {
      const [one, two] = [a, b].sort((x, y) => x.slug.localeCompare(y.slug));
      pairs.set(`${one.slug}|${two.slug}`, { path: `/vs/${one.slug}-vs-${two.slug}`, companies: [one.slug, two.slug], fields, ahead: ahead(one, two, market, today) });
    }
  }
  return [...pairs.values()].sort((x, y) => x.path.localeCompare(y.path));
}

/**
 * For each company past the gate, the nearby companies (a shared service and area) that beat it
 * on something stated, each with what. A page needs `gate.list_companies` of them.
 */
export function alternatives(companies, market, gate, today) {
  return companies
    .filter((c) => c.index)
    .map((c) => {
      const mine = longest(c);
      const stated = new Set(c.guarantees.map((g) => g.kind));
      const r = googleRating(c, market.floor);
      const near = companies.filter((b) => b !== c && b.index && shares(servicesOf(c), servicesOf(b)) && shares(areasOf(c), areasOf(b)));
      const beats = near
        .map((b) => {
          const why = [];
          const br = googleRating(b, market.floor);
          if (br && (!r || weighted(br, market) > weighted(r, market))) why.push({ kind: "rating", rating: br.rating, count: br.count });
          for (const [kind, x] of longest(b)) {
            if (kind === "other") continue;
            // A guarantee it states with no length is still one it has: nothing to beat.
            if (!stated.has(kind)) why.push({ kind: "guarantee", guarantee: kind, length: monthsLabel(x.months) });
            else if (mine.has(kind) && x.months > mine.get(kind).months) why.push({ kind: "longer-guarantee", guarantee: kind, length: monthsLabel(x.months), theirs: monthsLabel(mine.get(kind).months) });
          }
          if (b.offers.length && !c.offers.length) why.push({ kind: "offer", title: b.offers[0].title });
          const by = yearsOf(b, today);
          const cy = yearsOf(c, today);
          if (by != null && cy != null && by - cy >= 5) why.push({ kind: "years", years: by });
          return why.length ? { slug: b.slug, why } : null;
        })
        .filter(Boolean);
      const order = ranked(near, market);
      beats.sort((x, y) => order.indexOf(x.slug) - order.indexOf(y.slug));
      const index = beats.length >= gate.list_companies;
      return { slug: c.slug, path: `${c.path}/alternatives`, companies: beats, index, indexWhy: index ? `${beats.length} companies that beat it on something stated` : `only ${beats.length} companies beat it on something stated, and the gate is ${gate.list_companies}` };
    });
}
