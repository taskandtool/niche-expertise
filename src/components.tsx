// The parts every page is built from. Source text is only ever rendered as text (JSX
// escapes it), and build-data has already emptied any link that is not web, mail or phone.
import type { Child } from "hono/jsx";
import type { Company, Evidence, Filter, LiveOffer, Offer, Rating, Ref, ReviewCard as Review } from "./data";
import { Band, site, type Page } from "./shell";
export { mergeGuarantees, type GuaranteeGroup } from "./guarantees";

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
/** "a" or "an" before a word: "an upfront price guarantee". */
export const an = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");
export const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const day = (s?: string | null) => (s ? new Date(`${s}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "");

export function PageHead({ page, lede, children }: { page: Page; lede?: Child; children?: Child }) {
  return (
    <Band class="pt-10 pb-4 sm:pt-16 sm:pb-6">
      {page.crumbs?.length ? (
        <nav aria-label="Breadcrumb" class="mb-4 text-label font-normal text-ink-3">
          {page.crumbs.map((c) => (
            <>
              <a href={c.href} class="no-underline hover:text-ink">{c.label}</a>
              <span aria-hidden="true"> › </span>
            </>
          ))}
        </nav>
      ) : null}
      <h1 class="max-w-4xl font-display text-display">{page.title}</h1>
      {lede ? <p class="mt-3 max-w-content text-lede text-ink-2">{lede}</p> : null}
      {children}
    </Band>
  );
}

export function Section({ heading, children, id }: { heading: string; children?: Child; id?: string }) {
  return (
    <Band class="mt-section first:mt-6">
      <section id={id} aria-label={heading}>
        <h2 class="font-display text-section">{heading}</h2>
        <div class="mt-lead">{children}</div>
      </section>
    </Band>
  );
}

export function Tag({ children, href }: { children?: Child; href?: string }) {
  const cls = "inline-block rounded-full border border-line bg-surface px-3 py-1 no-underline";
  return href ? <a href={href} class={`${cls} hover:border-line-strong`}>{children}</a> : <span class={cls}>{children}</span>;
}

/** The map, with its list always beside or under it; site.js draws it from the data attributes. */
export function CompanyMap({ area }: { area?: string }) {
  return <div data-map data-area={area} role="img" aria-label="Map of the companies listed on this page" class="h-80 w-full overflow-hidden rounded-card border border-line bg-panel lg:h-[28rem]" />;
}

/** The filter bar. Only filters with enough data behind them reach here. */
export function Filters({ filters }: { filters: Filter[] }) {
  return (
    <>
      {filters.map((f) => (
        <label class="flex flex-col gap-1 text-label">
          {f.label}
          <select data-filter={f.key} class="min-h-11 rounded-control border border-line-strong bg-surface pl-3 font-normal">
            <option value="">Any</option>
            {f.options.map((o) => <option value={o.value}>{title(o.value)} ({o.count})</option>)}
          </select>
        </label>
      ))}
    </>
  );
}

/** A list's structured data: each entry in order, with its address. */
export function itemList(name: string, items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "ItemList", name, itemListElement: items.slice(0, 100).map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, url: `${site.url}${x.path}` })) };
}

export const ListNote = ({ children }: { children?: Child }) => <p class="max-w-content text-ink-2">{children}</p>;

// ---- The storefront's parts ----

/** A length as a word before a noun: "10 years" becomes "10-year" (and months, days), so "1 year parts guarantee" reads right. */
export const lengthWord = (s: string) => s.replace(/^([\d–-]+)[ -]?years?$/i, "$1-year").replace(/^([\d–-]+)[ -]?months?$/i, "$1-month").replace(/^([\d–-]+)[ -]?days?$/i, "$1-day");
/** One from each company in turn, so a company with twenty offers can't fill a screen. */
export function takeTurns<T extends { company: Ref }>(items: T[]): T[] {
  const byCompany = new Map<string, T[]>();
  for (const x of items) byCompany.set(x.company.slug, [...(byCompany.get(x.company.slug) ?? []), x]);
  const out: T[] = [];
  for (let round = 0; out.length < items.length; round++) for (const list of byCompany.values()) if (list[round]) out.push(list[round]);
  return out;
}

export const CHIP = "inline-block rounded-full border border-line bg-surface px-3.5 py-1.5 font-medium no-underline hover:border-line-strong aria-[current=page]:border-accent aria-[current=page]:bg-accent aria-[current=page]:text-accent-ink";
export const CTA = "inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-6 font-semibold text-accent-ink no-underline shadow-card transition-colors duration-150 ease-soft hover:bg-accent-hover";
export const CTA_QUIET = "inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line-strong bg-surface px-5 font-semibold text-ink no-underline transition-colors duration-150 ease-soft hover:bg-panel";

/** The signature: beside anything a company states. */
export const Check = ({ class: cls = "" }: { class?: string }) => (
  <span class={`inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink ${cls}`} aria-hidden="true">
    <svg viewBox="0 0 20 20" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 10.5 3.2 3.2L15 6.800" /></svg>
  </span>
);
export const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.900v3a2 2 0 0 1-2.200 2 19.800 19.800 0 0 1-8.600-3.100 19.500 19.500 0 0 1-6-6A19.800 19.800 0 0 1 2.100 4.200 2 2 0 0 1 4.100 2h3a2 2 0 0 1 2 1.700c.1 1 .4 1.900.7 2.800a2 2 0 0 1-.5 2.100L8.100 9.900a16 16 0 0 0 6 6l1.300-1.300a2 2 0 0 1 2.100-.4c.9.3 1.800.5 2.800.7a2 2 0 0 1 1.700 2z" /></svg>
);
const STAR = "M10 1.700l2.500 5.200 5.700.8-4.100 4 1 5.700L10 14.700l-5.100 2.700 1-5.700-4.100-4 5.700-.8z";
const StarRow = () => <>{[0, 1, 2, 3, 4].map(() => <svg viewBox="0 0 20 20" class="size-4 shrink-0 fill-current" aria-hidden="true"><path d={STAR} /></svg>)}</>;
/** A platform's own number, drawn. Never ours, and never shown without one behind it. */
export const Stars = ({ rating }: { rating: number }) => (
  <span class="relative inline-flex align-middle text-line-strong" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
    <StarRow />
    <span class="absolute inset-y-0 left-0 inline-flex overflow-hidden text-star" style={`width:${Math.max(0, Math.min(100, (rating / 5) * 100))}%`}><StarRow /></span>
  </span>
);
export const GoogleMark = () => <img src="/google.svg" alt="" width="16" height="16" class="size-4 shrink-0" />;

/** The first platform's rating: stars, the number, how many. */
export function RatingBadge({ ratings, class: cls = "" }: { ratings: Rating[]; class?: string }) {
  const r = ratings[0];
  if (!r) return null;
  const google = r.platform === "Google";
  return (
    <span class={`inline-flex flex-wrap items-center gap-x-1.5 ${cls}`}>
      {google ? <GoogleMark /> : null}
      <Stars rating={r.rating} />
      <strong class="font-semibold">{r.rating.toFixed(1)}</strong>
      {r.count != null ? <span class="opacity-75">({r.url ? <a href={r.url} rel="nofollow noopener" class="relative z-10 no-underline hover:underline">{r.count.toLocaleString("en-US")}{google ? " Google reviews" : ""}</a> : <>{r.count.toLocaleString("en-US")}{google ? " Google reviews" : ""}</>})</span> : null}
      {!google ? <span class="opacity-75">on their site</span> : null}
    </span>
  );
}

/** Where a card's fine print lives: the company's own page. Only where the record holds conditions. */
export const TermsApply = ({ item, has }: { item: Evidence; has?: string | null }) =>
  has && item.url ? <p class="mt-auto pt-3 text-label text-ink-3"><a href={item.url} rel="nofollow noopener" class="relative z-10 underline hover:text-ink">Terms apply</a></p> : null;

/** One offer, one glance: what you get, from whom, and by when. On a list the whole card leads to the company. */
export function OfferCard({ o, company }: { o: Offer; company?: Ref }) {
  return (
    <article data-ends={o.ends ?? undefined} class={`relative flex flex-col rounded-card border border-line bg-surface p-5 shadow-card ${company ? "transition-shadow duration-150 ease-soft hover:shadow-lift" : ""}`}>
      {o.ends ? <p class="mb-2.5"><span class="rounded-full bg-mark-soft px-2.5 py-1 text-label font-semibold text-mark">Ends {day(o.ends)}</span></p> : null}
      <h3 class="font-display text-[1.5rem] leading-[1.15]">{o.title}</h3>
      {company ? <p class="mt-2"><a href={company.path} class="font-semibold no-underline after:absolute after:inset-0 hover:underline">{company.name}</a></p> : <TermsApply item={o} has={o.conditions} />}
    </article>
  );
}
export const OfferGrid = ({ offers }: { offers: LiveOffer[] }) => <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{offers.map((o) => <OfferCard o={o} company={o.company} />)}</div>;

/** The most telling line of a company, for a card: its first offer, and a guarantee with a length if it has one. */
const hook = (c: Company) => c.guarantees.find((g) => g.length && g.kind !== "other") ?? c.guarantees.find((g) => g.kind !== "other");

export function CompanyCard({ c }: { c: Company }) {
  const photo = c.photos.find((p) => p.kind === "work" || p.kind === "before_after") ?? c.photos[0];
  const g = hook(c);
  const cities = [...new Set(c.locations.map((l) => l.city).filter(Boolean))].join(", ");
  return (
    <article class="relative flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition-shadow duration-150 ease-soft hover:shadow-lift sm:flex-row sm:p-5">
      {photo ? <img src={photo.src} alt="" loading="lazy" class="aspect-[16/10] w-full shrink-0 rounded-control object-cover sm:aspect-square sm:w-36" /> : null}
      <div class="min-w-0 grow">
        <div class="flex items-center gap-3">
          {c.logo ? <img src={c.logo} alt="" loading="lazy" class="h-9 w-auto max-w-20 shrink-0 object-contain" /> : null}
          <div class="min-w-0">
            <h3 class="font-body text-title"><a href={c.path} class="no-underline after:absolute after:inset-0 hover:underline">{c.name}</a></h3>
            {cities ? <p class="text-label text-ink-3">{cities}</p> : null}
          </div>
        </div>
        <p class="mt-2 text-label text-ink-2"><RatingBadge ratings={c.ratings} /></p>
        <ul class="mt-3 space-y-1.5">
          {c.offers[0] ? <li class="flex items-start gap-2"><span class="mt-0.5 rounded-full bg-mark-soft px-2 py-0.5 text-label font-semibold text-mark">Offer</span><span class="font-medium">{c.offers[0].title}</span></li> : null}
          {g ? <li class="flex items-start gap-2"><Check class="mt-0.5" /><span>{title([g.length && g.length.length <= 18 ? lengthWord(g.length) : null, g.kind].filter(Boolean).join(" "))} guarantee</span></li> : null}
        </ul>
      </div>
    </article>
  );
}

/** A customer's words. Stars only where the platform gave them. */
export function ReviewCard({ r, copy }: { r: Review; copy?: boolean }) {
  return (
    <figure class="flex w-80 shrink-0 flex-col rounded-card bg-surface p-5 text-ink shadow-card">
      <div class="flex items-center justify-between gap-3">
        <p class="flex min-w-0 items-center gap-2">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent" aria-hidden="true">{(r.who ?? "?").charAt(0).toUpperCase()}</span>
          <span class="truncate font-semibold">{r.url && !copy ? <a href={r.url} rel="nofollow noopener" class="no-underline hover:underline">{r.who ?? "A customer"}</a> : r.who ?? "A customer"}</span>
        </p>
        {r.where === "Google" ? <GoogleMark /> : null}
      </div>
      {r.stars ? <p class="mt-2"><Stars rating={r.stars} /></p> : null}
      <blockquote class="mt-2 line-clamp-5">{r.quote}</blockquote>
      <figcaption class="mt-auto pt-2 text-label text-ink-3">{r.where === "Google" ? `On Google${r.day ? `, ${day(r.day)}` : ""}` : "From their website"}</figcaption>
    </figure>
  );
}

/** Two rows of reviews drifting past, or still ones when there are few or a reader asks for less motion. */
export function ReviewMarquee({ reviews }: { reviews: Review[] }) {
  if (reviews.length < 4) return <div class="mx-auto flex max-w-wide flex-wrap justify-center gap-4 px-5 sm:px-8">{reviews.map((r) => <ReviewCard r={r} />)}</div>;
  const half = Math.ceil(reviews.length / 2);
  const rows = [reviews.slice(0, half), reviews.slice(half)].filter((x) => x.length);
  return (
    <div class="space-y-4">
      {rows.map((row, i) => {
        // Enough copies to outrun a wide screen, and exactly two equal halves so the loop has no seam.
        const half2 = Array.from({ length: Math.max(1, Math.ceil(6 / row.length)) }).flatMap(() => row);
        return (
          <div class="overflow-hidden motion-reduce:overflow-x-auto">
            <div class={`flex w-max gap-4 animate-[marquee_80s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none ${i ? "[animation-direction:reverse]" : ""}`}>
              {half2.map((r) => <ReviewCard r={r} />)}
              {half2.map((r) => <div aria-hidden="true" class="motion-reduce:hidden"><ReviewCard r={r} copy /></div>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Things to walk into, plainly: a name and how many companies. */
export const EntryTiles = ({ entries }: { entries: { name: string; path: string; count: number }[] }) => (
  <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {entries.map((e) => (
      <li>
        <a href={e.path} class="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3.5 font-medium no-underline transition-shadow duration-150 ease-soft hover:shadow-card">
          <span>{title(e.name)}</span>
          <span class="shrink-0 text-label text-ink-3">{plural(e.count, "company", "companies")}</span>
        </a>
      </li>
    ))}
  </ul>
);
