// What scripts/build-data.mjs wrote to data/, for the pages. Machine only: the
// pages are pre-rendered here, and the Worker never reaches this file.
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(process.env.SITE_ROOT || join(fileURLToPath(import.meta.url), "..", ".."));

export type Evidence = { quote: string; url: string; where: string; corrected?: string | null };
export type Guarantee = Evidence & { kind: string; promise: string | null; length: string | null; covers: string | null; conditions: string | null; whose: string | null };
export type Offer = Evidence & { kind: string; title: string; ends: string | null; conditions: string | null; source: string; firstSeen: string; lastSeen: string };
export type Ref = { slug: string; name: string; path: string };
export type LiveOffer = Offer & { company: Ref; services: string[]; areas: string[] };
export type Service = Evidence & { name: string; price: string | null };
export type Rating = { platform: string; rating: number; count: number | null; url: string; where: string };
export type Location = { address: string; city: string; region: string; postcode: string; lat: number | null; lng: number | null; areas: string[] };
export type ReviewCard = { quote: string; who: string | null; stars: number | null; day: string | null; where: string; url: string };
export type ZipPage = { zip: string; path: string; place: string | null; companies: string[]; index: boolean; indexWhy: string };
export type Company = {
  zips: string[];
  slug: string;
  name: string;
  pitch: (Evidence & { headline: string; points: (Evidence & { text: string })[] }) | null;
  reviewCards: ReviewCard[];
  leadTo: string | null;
  termsUrl: string | null;
  path: string;
  website: string;
  domain: string;
  scope: string;
  crawled: string;
  fetched: string;
  note: string | null;
  siteDown: boolean;
  leftSource: string | null;
  phones: { value: string; where: string[] }[];
  emails: { value: string; where: string[] }[];
  hours: { text: string[]; where: string }[];
  booking: string;
  logo: string | null;
  photos: { src: string; kind: string; alt: string; source: string; credit: string | null; creditUrl: string | null }[];
  social: string[];
  ratings: Rating[];
  locations: Location[];
  serves: { name: string; area: string | null }[];
  servesQuotes: Evidence[];
  background: { summary: string | null; founded: number | null; people: { name: string; role?: string }[]; evidence: Evidence[] } | null;
  services: Service[];
  guarantees: Guarantee[];
  offers: Offer[];
  brands: (Evidence & { name: string })[];
  proof: (Evidence & { kind: string; title: string })[];
  details: (Evidence & { name: string; value: string | null })[];
  keywords: string[];
  testimonials: (Evidence & { who: string | null })[];
  reviews: { praise: Theme[]; complaints: Theme[]; services: Theme[]; read: number } | null;
  index: boolean;
  firstSeen: string;
  standouts: Standout[];
  gaps: ("no-prices" | "no-guarantee" | "no-rating")[];
};
/** What sets a company apart, from facts (scripts/rank.mjs); the page words it. */
export type Standout =
  | { kind: "longer-guarantee"; guarantee: string; length: string; standard: string }
  | { kind: "rare-guarantee"; guarantee: string; count: number; of: number }
  | { kind: "most-reviewed"; rating: number; count: number }
  | { kind: "years"; years: number }
  | { kind: "offer"; title: string };
/** Why an alternative beats the company it stands in for. */
export type Reason =
  | { kind: "rating"; rating: number; count: number }
  | { kind: "guarantee"; guarantee: string; length: string }
  | { kind: "longer-guarantee"; guarantee: string; length: string; theirs: string }
  | { kind: "offer"; title: string }
  | { kind: "years"; years: number };
export type Ahead =
  | { field: "rating"; slug: string }
  | { field: "guarantee"; slug: string; guarantee: string; length: string; other: string }
  | { field: "offer"; slug: string; title: string }
  | { field: "years"; slug: string; years: number };
export type Versus = { path: string; companies: [string, string]; fields: string[]; ahead: Ahead[]; updated: string };
export type Alternatives = { slug: string; path: string; companies: { slug: string; why: Reason[] }[]; index: boolean; updated: string };
export type Theme = { theme: string; quote?: string; source?: string; count: number | null; of: number };
export type ListEntry<T = object> = { name: string; slug: string; path: string; count: number; of: number; percent: number; index: boolean; companies: ({ company: Ref } & T)[] };
export type ServiceEntry = ListEntry<Service> & { note: string; withPrice: number; mostMentioned: { company: Ref; count: number; of: number; ratings: Rating[] }[] };
export type GuaranteeEntry = ListEntry<Guarantee> & { lengths: Tally; whose: Tally; withConditions: number; standard: string | null; common: boolean };
export type Tally = { value: string; count: number }[];
export type Link = { title: string; url: string; where: string | null };
/** A brand: who installs it, the maker's own terms (records/brands/), and what each installer adds. */
export type BrandEntry = ListEntry<Evidence> & {
  maker: { site: string; warranty: { covers: string; length: string | null; condition: string | null; quote: string; url: string }[]; registration: { days: number | null; quote: string; url: string } | null; reviews: Link[]; news: Link[] } | null;
  adds: { company: Ref; guarantees: { kind: string; length: string | null }[] }[];
};
export type Area = { zips?: string[]; name: string; kind: string; state: string; slug: string; path: string; based: string[]; serves: string[]; count: number; guarantees: { kind: string; count: number; percent: number }[]; brands: Tally; services: Tally; offers: number; index: boolean; rank: number; ranked: string[]; updated: string };
export type ServiceArea = { area: string; areaName: string; service: string; serviceSlug: string; path: string; companies: string[]; ranked: string[]; updated: string; index: boolean };
export type PageFlag = { path: string; kind: string; index: boolean; why?: string };
export type Filter = { key: string; label: string; options: Tally };

const read = <T,>(name: string, fallback: T): T => {
  const file = join(ROOT, "data", `${name}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : fallback;
};

export type Data = {
  ready: boolean;
  companies: Company[];
  services: ServiceEntry[];
  guarantees: GuaranteeEntry[];
  brands: BrandEntry[];
  topics: ListEntry[];
  offers: { live: LiveOffer[]; kinds: ListEntry<Offer>[] };
  areas: Area[];
  serviceAreas: ServiceArea[];
  zipPages: ZipPage[];
  stats: { total: number; built: string; withGuarantee: number; withOffer: number; withBrands: number; withWebsite: number; withPrices: number; withFounded: number; ads: number; offers: number; ranked: string[]; method: { reviews: number } };
  versus: Versus[];
  alternatives: Alternatives[];
  pages: PageFlag[];
  news: { day: string; kind: string; text: string; path: string }[];
  filters: { companies: Filter[]; show: Record<string, boolean> };
  guides: { kind: string; slug: string; title: string; path: string; figures: Record<string, number> }[];
};

let cached: { at: number; data: Data } | null = null;

/** Read again whenever the build has run, so dev shows a rebuild on refresh. */
export function loadData(): Data {
  const stamp = join(ROOT, "data", "stats.json");
  const at = existsSync(stamp) ? statSync(stamp).mtimeMs : 0;
  if (cached?.at === at) return cached.data;
  const data: Data = {
    ready: at > 0,
    companies: read("companies", []),
    services: read("services", []),
    guarantees: read("guarantees", []),
    brands: read("brands", []),
    topics: read("topics", []),
    offers: read("offers", { live: [], kinds: [] }),
    areas: read("areas", []),
    serviceAreas: read("service-areas", []),
    zipPages: read("zip-pages", []),
    stats: read("stats", { total: 0, built: "", withGuarantee: 0, withOffer: 0, withBrands: 0, withWebsite: 0, withPrices: 0, withFounded: 0, ads: 0, offers: 0, ranked: [], method: { reviews: 20 } }),
    versus: read("versus", []),
    alternatives: read("alternatives", []),
    pages: read("pages", []),
    news: read("new", []),
    filters: read("filters", { companies: [], show: {} }),
    guides: read("guides", []),
  };
  cached = { at, data };
  return data;
}

/** A guide's words, with its {{figures}} filled in; null when none is written. */
export function guideText(kind: string, slug: string, figures: Record<string, number>): string | null {
  const file = join(ROOT, "content", kind, `${slug}.md`);
  if (!existsSync(file)) return null;
  return readFileSync(file, "utf8").replace(/^---[\s\S]*?\n---\r?\n?/, "").replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, k: string) => String(figures[k] ?? ""));
}
