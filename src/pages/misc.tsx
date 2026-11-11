// Home, compare, search, what's new and about.
import { CompanyCard, EntryTiles, ListNote, OfferGrid, takeTurns, PageHead, Section, day, plural, title } from "../components";
import type { Data } from "../data";
import { Band, site, type Page } from "../shell";

export function home(d: Data) {
  const page: Page = {
    path: "/",
    title: site.niche ? `Find ${site.noun}${site.area ? ` in ${site.area}` : ""}` : site.name,
    description: `Compare ${d.stats.total} ${site.noun}${site.area ? ` in ${site.area}` : ""}: current offers, guarantees, reviews and services.`,
  };
  const s = d.stats;
  const offers = takeTurns(d.offers.live).slice(0, 6);
  const withOffers = d.companies.filter((c) => c.offers.length);
  const mosaic = d.companies.flatMap((c) => c.photos.filter((p) => p.kind === "work" || p.kind === "team").slice(0, 1).map((p) => p.src)).slice(0, 3);
  const Body = () =>
    !d.ready ? (
      <Band class="py-section">
        <h1 class="font-display text-display">{site.name}</h1>
        <p class="mt-3 max-w-content text-lede text-ink-2">Nothing has been read yet. Tell the AI which businesses this site is for, and the pages build themselves from what it finds.</p>
      </Band>
    ) : (
      <>
        <Band class="grid items-center gap-10 pt-10 pb-10 sm:pt-16 lg:grid-cols-[1.1fr_1fr]">
          <div>
          <h1 class="max-w-4xl font-display text-display">{page.title}</h1>
          <p class="mt-4 max-w-content text-lede text-ink-2">See current offers, guarantees and reviews, then ask for a quote.</p>
          <form action="/companies" class="mt-7 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <label class="grow">
              <span class="sr-only">Service</span>
              <select name="services" class="min-h-12 w-full rounded-control border border-line-strong bg-surface pl-3">
                <option value="">Any service</option>
                {(d.filters.companies.find((f) => f.key === "services")?.options ?? []).map((o) => <option value={o.value}>{title(o.value)}</option>)}
              </select>
            </label>
            {d.filters.show.distance ? (
              <label>
                <span class="sr-only">ZIP code</span>
                <input name="zip" inputmode="numeric" maxlength={5} placeholder="ZIP code" class="min-h-12 w-full rounded-control border border-line-strong bg-surface px-3 sm:w-32" />
              </label>
            ) : null}
            <button class="min-h-12 shrink-0 whitespace-nowrap rounded-control bg-accent px-6 font-semibold text-accent-ink hover:bg-accent-hover">Find companies</button>
          </form>
          <p class="mt-5 text-ink-2"><a href="/offers" class="font-semibold">{plural(s.offers, "current offer")}</a> <span aria-hidden="true">·</span> <a href="/companies" class="font-semibold">{plural(s.total, "company", "companies")}</a></p>
          </div>
          {/* Real work, one picture from each of three companies. */}
          {mosaic.length === 3 ? (
            <div class="hidden grid-cols-2 grid-rows-2 gap-3 lg:grid" aria-hidden="true">
              <img src={mosaic[0]} alt="" class="row-span-2 h-full min-h-80 w-full rounded-card object-cover shadow-lift" />
              <img src={mosaic[1]} alt="" class="aspect-[4/3] w-full rounded-card object-cover shadow-card" />
              <img src={mosaic[2]} alt="" class="aspect-[4/3] w-full rounded-card object-cover shadow-card" />
            </div>
          ) : null}
        </Band>

        <Section heading="Current offers">
          {offers.length ? (
            <OfferGrid offers={offers} />
          ) : <ListNote>No offers at the moment.</ListNote>}
          <p class="mt-4"><a href="/offers" class="font-semibold">All {plural(s.offers, "offer")}</a></p>
        </Section>

        {d.guarantees.length ? (
          <Section heading="Guarantees to look for">
            <EntryTiles entries={d.guarantees.slice(0, 6).map((g) => ({ ...g, name: `${g.name} guarantee` }))} />
          </Section>
        ) : null}

        {withOffers.length ? (
          <Section heading="Companies with current offers">
            <ul class="grid gap-3 lg:grid-cols-2">{withOffers.slice(0, 6).map((c) => <li><CompanyCard c={c} /></li>)}</ul>
            <p class="mt-4"><a href="/companies" class="font-semibold">All {plural(s.total, "company", "companies")}</a></p>
          </Section>
        ) : null}

        <Section heading="Browse">
          <div class="grid gap-8 md:grid-cols-3">
            {[["Services", d.services, "/services"], ["Brands", d.brands, "/brands"], ["Areas", d.areas.filter((x) => x.rank === 2).map((x) => ({ ...x, count: x.count })).sort((x, y) => y.count - x.count), "/areas"]].map(([label, list, href]) => (
              <div>
                <h3 class="font-body text-title"><a href={href as string} class="no-underline hover:underline">{label as string}</a></h3>
                <ul class="mt-2 space-y-1">{(list as { name: string; path: string; count: number }[]).slice(0, 8).map((x) => <li><a href={x.path}>{title(x.name)}</a></li>)}</ul>
              </div>
            ))}
          </div>
        </Section>
      </>
    );
  return { page, Body };
}

export function compare() {
  const page: Page = { path: "/compare", title: "Compare companies", description: "Up to three companies side by side.", index: false };
  const Body = () => (
    <>
      <PageHead page={page} lede="Pick up to three." />
      <Band>
        <form data-compare-pick class="flex max-w-2xl gap-2">
          <label class="grow"><span class="sr-only">Add a company</span><input list="company-names" data-compare-input placeholder="Add a company" class="min-h-11 w-full rounded-control border border-line-strong bg-surface px-3" /></label>
          <datalist id="company-names" />
          <button class="min-h-11 rounded-control bg-accent px-5 font-semibold text-accent-ink hover:bg-accent-hover">Add</button>
        </form>
        <div data-compare class="mt-6 overflow-x-auto" tabindex={0} role="region" aria-label="Comparison" />
      </Band>
    </>
  );
  return { page, Body };
}

export function search() {
  const page: Page = { path: "/search", title: "Search", description: "Search every company, service, guarantee and offer.", index: false };
  const Body = () => (
    <>
      <PageHead page={page} />
      <Band>
        <form action="/search" class="flex max-w-2xl gap-2">
          <label class="grow"><span class="sr-only">Search</span><input name="q" data-search-input placeholder="Company name, service or offer" class="min-h-12 w-full rounded-control border border-line-strong bg-surface px-3" /></label>
          <button class="min-h-12 rounded-control bg-accent px-5 font-semibold text-accent-ink hover:bg-accent-hover">Search</button>
        </form>
        <p data-search-count class="mt-4 text-ink-2" aria-live="polite" />
        <ul data-search-results class="mt-2" />
      </Band>
    </>
  );
  return { page, Body };
}

export function whatsNew(d: Data) {
  const page: Page = { path: "/new", title: "What's new", description: `New companies and offers from the last 90 days.` };
  const Body = () => (
    <>
      <PageHead page={page} lede={page.description} />
      <Section heading="Latest">
        {d.news.length ? (
          <ul>{d.news.map((e) => <li class="border-b border-line py-2"><span class="text-ink-3">{day(e.day)}</span> {e.kind}: <a href={e.path}>{e.text}</a></li>)}</ul>
        ) : <ListNote>Nothing has changed lately.</ListNote>}
      </Section>
    </>
  );
  return { page, Body };
}

export function about(d: Data) {
  const page: Page = { path: "/about", title: `About ${site.name}`, description: "Where our information comes from, how companies are listed and how to correct a listing." };
  const Body = () => (
    <>
      <PageHead page={page} lede={site.niche ? `Independent recommendations for ${site.niche}${site.area ? ` in ${site.area}` : ""}.` : undefined} />
      <Band>
        <div class="prose max-w-content">
          <h2>Where our information comes from</h2>
          <p>Each company's page draws on its website, social profiles, running ads, Google listing and customer reviews. Businesses are found through Overture Maps, whose area boundaries are © OpenStreetMap contributors and available under the Open Database License. The maps use OpenFreeMap with OpenStreetMap data.</p>
          <h2>What we don't verify</h2>
          <p>We haven't checked these claims, and a company's own terms decide what its guarantee or offer covers. Please confirm the details with the company before you hire them.</p>
          <h2>How companies are listed</h2>
          <p>The best-of lists for each area and service put companies based there first, then rank by Google rating, weighted toward companies with more reviews; a rating counts once it has {d.stats.method.reviews} reviews. Every other list shows companies with a current offer first, then the rest, each by name, unless you choose another sort. Nobody pays for a place. Ratings are each platform's own, and we keep no score of our own. Data as of {day(d.stats.built) || "the last build"}.</p>
          <p>Nothing here is paid placement.{site.disclosure ? ` ${site.disclosure}` : ""}</p>
          <h2>Claim or correct a listing</h2>
          <p>Businesses can <a href="/contact">claim a listing, ask for a correction or a removal, or have a picture taken down</a>.{site.contactEmail ? <> Or write to <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.</> : null}</p>
        </div>
      </Band>
    </>
  );
  return { page, Body };
}
