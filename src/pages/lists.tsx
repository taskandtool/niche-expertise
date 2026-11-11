// The browse hubs and the list pages: companies, offers, services, guarantees,
// brands, phrases. Every number here was counted by scripts/build-data.mjs.
import { raw } from "hono/html";
import { guideHtml } from "../guide";
import { CHIP, Check, CompanyCard, CompanyMap, EntryTiles, lengthWord, Filters, ListNote, OfferGrid, itemList, mergeGuarantees, PageHead, Section, TermsApply, plural, takeTurns, title } from "../components";
import { guideText, type BrandEntry, type Company, type Data, type GuaranteeEntry, type Link, type ListEntry, type ServiceEntry } from "../data";
import { Band, site, type Page } from "../shell";
import { ComparisonTable } from "./rank";

const noun = () => site.noun;

/** A guide's words under the page's heading; AI wrote them, the build filled in the figures. */
function GuideText({ text }: { text: string | null }) {
  return text ? <div class="prose max-w-content">{raw(guideHtml(text))}</div> : null;
}

// ---- Hubs ----

export function companiesHub(d: Data) {
  const page: Page = {
    path: "/companies",
    title: `${d.stats.total} ${noun()}${site.area ? ` in ${site.area}` : ""}`,
    description: `Browse ${d.stats.total} ${noun()} by area, service, guarantee and brand, with current offers and reviews.`,
    jsonLd: [itemList(`${noun()}`, d.companies)],
    map: d.filters.show.distance,
  };
  const f = d.filters;
  const Body = () => (
    <>
      <PageHead page={page} lede="See current offers, guarantees and reviews for each one." />
      <div class="mx-auto mt-2 grid max-w-wide gap-6 px-5 sm:px-8 lg:grid-cols-[17rem_1fr]">
        <details data-filter-drawer class="rounded-card border border-line bg-surface p-4 lg:sticky lg:top-4 lg:self-start lg:border-0 lg:p-0 [&[open]>summary]:lg:hidden">
        <summary class="cursor-pointer select-none font-semibold">Filter and sort <span data-active-count class="font-normal text-ink-3" /></summary>
        <form data-company-filters class="mt-3 flex flex-col gap-3 lg:mt-0" aria-label="Filter companies">
          {f.show.distance ? (
            <label class="flex flex-col gap-1 text-label">ZIP code
              <input data-zip inputmode="numeric" maxlength={5} class="min-h-11 rounded-control border border-line-strong bg-surface px-3 font-normal" />
            </label>
          ) : null}
          <label class="flex flex-col gap-1 text-label">Area
            <select data-filter="areas" class="min-h-11 rounded-control border border-line-strong bg-surface pl-3 font-normal">
              <option value="">Anywhere</option>
              {d.areas.filter((x) => x.rank >= 1).map((x) => <option value={x.path}>{x.name} ({x.count})</option>)}
            </select>
          </label>
          <Filters filters={f.companies} />
          {f.show.offers ? <label class="flex items-center gap-2 text-label"><input type="checkbox" data-has="offers" /> Has a current offer</label> : null}
          {f.show.photos ? <label class="flex items-center gap-2 text-label"><input type="checkbox" data-has="photos" /> Has photos</label> : null}
          <label class="flex flex-col gap-1 text-label">Sort
            <select data-sort class="min-h-11 rounded-control border border-line-strong bg-surface pl-3 font-normal">
              <option value="offers">Offers first</option>
              <option value="name">Name</option>
              {f.show.years ? <option value="years">Years in business</option> : null}
              {f.show.rating ? <option value="rating">Google rating</option> : null}
            </select>
          </label>
          <p data-sort-note class="text-label font-normal text-ink-3" />
          <button type="button" data-clear hidden class="self-start text-label font-semibold text-accent underline">Clear all filters</button>
        </form>
        </details>
        <div class="min-w-0">
          {f.show.distance ? (
            <>
              <button type="button" data-map-toggle aria-expanded="false" class={`${CHIP} lg:hidden`}>Show map</button>
              <div data-map-frame class="mt-3 mb-4 hidden lg:mt-0 lg:block"><CompanyMap /></div>
            </>
          ) : null}
          <p data-count class="mt-4 font-medium text-ink-2" aria-live="polite">{plural(d.stats.total, "company", "companies")}</p>
          <ul data-company-list class="mt-3 grid gap-3">
            {d.companies.map((c) => <li data-slug={c.slug}><CompanyCard c={c} /></li>)}
          </ul>
          <p data-none hidden class="mt-4 rounded-card bg-panel p-6 text-center">No companies match those filters. <button type="button" data-clear class="font-semibold text-accent underline">Clear all filters</button></p>
          <p class="mt-4 text-center"><button type="button" data-more hidden class={CHIP}>Show more</button></p>
        </div>
      </div>
    </>
  );
  return { page, Body };
}


const OfferKinds = ({ d, current }: { d: Data; current: string }) => (
  <Band class="pb-2">
    <nav aria-label="Kinds of offer" class="flex flex-wrap gap-2">
      <a href="/offers" class={CHIP} aria-current={current === "/offers" ? "page" : undefined}>All</a>
      {d.offers.kinds.map((k) => <a href={k.path} class={CHIP} aria-current={current === k.path ? "page" : undefined}>{title(k.name)}</a>)}
    </nav>
  </Band>
);

export function offersHub(d: Data) {
  const live = d.offers.live;
  const page: Page = {
    path: "/offers",
    title: `Current offers from ${noun()}`,
    index: live.length > 0,
    description: `${plural(live.length, "current offer")} from ${noun()}${site.area ? ` in ${site.area}` : ""}: discounts, financing, free estimates and more.`,
    jsonLd: [itemList("Offers", live.map((o) => ({ name: o.title, path: o.company.path })))],
  };
  const Body = () => (
    <>
      <PageHead page={page} lede={plural(live.length, "offer")} />
      <OfferKinds d={d} current="/offers" />
      <Band class="mt-6">{live.length ? <OfferGrid offers={takeTurns(live)} /> : <ListNote>No offers at the moment.</ListNote>}</Band>
    </>
  );
  return { page, Body };
}

export function offerKindPage(d: Data, k: ListEntry) {
  const live = d.offers.live.filter((o) => o.kind === k.name);
  const page: Page = { path: k.path, title: `${title(k.name)} offers`, description: `${plural(live.length, `${k.name} offer`)} from ${noun()}${site.area ? ` in ${site.area}` : ""}.`, index: live.length > 0, crumbs: [{ label: "Offers", href: "/offers" }] };
  const Body = () => (
    <>
      <PageHead page={page} lede={plural(live.length, "offer")} />
      <OfferKinds d={d} current={k.path} />
      <Band class="mt-6"><OfferGrid offers={takeTurns(live)} /></Band>
    </>
  );
  return { page, Body };
}

/** A hub: a heading, one line and the things to walk into. */
function hub(path: string, heading: string, description: string, entries: ListEntry[]) {
  const page: Page = { path, title: heading, description, jsonLd: [itemList(heading, entries)] };
  const Body = () => (
    <>
      <PageHead page={page} />
      <Band class="mt-4">{entries.length ? <EntryTiles entries={entries} /> : <ListNote>Nothing has been read yet.</ListNote>}</Band>
    </>
  );
  return { page, Body };
}

const here = () => (site.area ? ` in ${site.area}` : "");
export const servicesHub = (d: Data) => hub("/services", `${title(noun())} by service`, `Find ${noun()}${here()} by the service you need.`, d.services);
export const guaranteesHub = (d: Data) => hub("/guarantees", "Guarantees", `Find ${noun()}${here()} by the guarantee they offer.`, d.guarantees.map((g) => ({ ...g, name: `${g.name} guarantee` })));
export const brandsHub = (d: Data) => hub("/brands", "Brands", `Find ${noun()}${here()} by the brands they work with.`, d.brands);
export const topicsHub = (d: Data) => hub("/topics", "Common promises", `What ${noun()}${here()} promise most often.`, d.topics);

// ---- One service, guarantee, brand or phrase ----

/** The companies behind a list: cards, each one a way into its page. */
function CompaniesOf({ d, refs }: { d: Data; refs: { company: { slug: string } }[] }) {
  const slugs = [...new Set(refs.map((x) => x.company.slug))];
  const list = slugs.map((x) => d.companies.find((c) => c.slug === x)).filter((c): c is Company => Boolean(c));
  return <ul class="grid gap-3 lg:grid-cols-2">{list.map((c) => <li><CompanyCard c={c} /></li>)}</ul>;
}

export function servicePage(d: Data, s: ServiceEntry) {
  const flag = d.pages.find((p) => p.path === s.path);
  const guide = d.guides.find((g) => g.kind === "service" && g.slug === s.slug);
  const text = guide ? guideText("service", s.slug, guide.figures) : null;
  const page: Page = {
    path: s.path,
    title: `${title(s.name)}${here()}`,
    description: `${plural(s.count, "company", "companies")} offering ${s.name}${here()}. See their current offers, guarantees and reviews.`,
    index: flag?.index ?? false,
    crumbs: [{ label: "Services", href: "/services" }],
    ...(text ? { jsonLd: [{ "@context": "https://schema.org", "@type": "Article", headline: title(s.name), dateModified: d.stats.built }] } : {}),
  };
  const Body = () => (
    <div data-pagefind-body>
      <PageHead page={page} lede={plural(s.count, "company", "companies")} />
      <Band class="mt-4"><CompaniesOf d={d} refs={s.companies} /></Band>
      {text ? <Section heading={`About ${s.name}`}><GuideText text={text} /></Section> : null}
    </div>
  );
  return { page, Body };
}

export function guaranteePage(d: Data, g: GuaranteeEntry) {
  const guide = d.guides.find((x) => x.kind === "guarantee" && x.slug === g.slug);
  const text = guide ? guideText("guarantee", g.slug, guide.figures) : null;
  const page: Page = {
    path: g.path,
    title: `${title(g.name)} guarantees${here()}`,
    description: `${plural(g.count, "company", "companies")}${here()} with a ${g.name} guarantee. See how long each one lasts and what it covers.`,
    index: g.index,
    crumbs: [{ label: "Guarantees", href: "/guarantees" }],
    jsonLd: [itemList(`${title(g.name)} guarantees${here()}`, [...new Map(g.companies.map((x) => [x.company.slug, x.company])).values()])],
  };
  // Who goes past the usual length (scripts/rank.mjs measured it).
  const further = d.companies.flatMap((c) => c.standouts.filter((s) => s.kind === "longer-guarantee" && s.guarantee === g.name).map((s) => ({ c, length: (s as { length: string }).length })));
  const Body = () => (
    <div data-pagefind-body>
      <PageHead page={page} lede={`${plural(g.count, "company", "companies")}${here()} offer a ${g.name} guarantee.${g.standard ? ` The usual length is ${g.standard}.` : ""}`} />
      {further.length ? (
        <Section heading="Who goes further">
          <ul class="space-y-1.5">{further.map((x) => <li class="flex items-start gap-2"><Check class="mt-0.5" /><span><a href={x.c.path}>{x.c.name}</a>: {x.length}, where most offer {g.standard}</span></li>)}</ul>
        </Section>
      ) : null}
      <Band class="mt-4">
        <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...new Set(g.companies.map((x) => x.company.slug))].map((slug) => {
            const mine = g.companies.filter((x) => x.company.slug === slug);
            const merged = mergeGuarantees(mine)[0];
            return (
              <li class="relative flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-shadow duration-150 ease-soft hover:shadow-lift">
                <p class="flex items-start gap-2.5"><Check class="mt-0.5" /><a href={mine[0].company.path} class="font-body text-title no-underline after:absolute after:inset-0 hover:underline">{mine[0].company.name}</a></p>
                {merged.length ? <p class="mt-2.5 font-display text-[1.625rem] leading-tight">{title(merged.length)}</p> : null}
                {merged.lines.length === 1 ? <p class="mt-1.5 text-ink-2">{merged.lines[0]}</p> : null}
                {merged.lines.length > 1 ? <ul class="mt-2 list-disc space-y-1 pl-5 text-ink-2">{merged.lines.map((l) => <li>{l}</li>)}</ul> : null}
                {merged.terms ? <TermsApply item={merged.terms} has="yes" /> : null}
              </li>
            );
          })}
        </ul>
      </Band>
      {text ? <Section heading={`About ${g.name} guarantees`}><GuideText text={text} /></Section> : null}
    </div>
  );
  return { page, Body };
}

/** Who installs a brand: the maker's own terms first, then what each installer gives on top, then independent reviews and news. */
export function brandPage(d: Data, b: BrandEntry) {
  const m = b.maker;
  const installers = [...new Set(b.companies.map((x) => x.company.slug))].map((s) => d.companies.find((c) => c.slug === s)).filter((c): c is Company => Boolean(c));
  const first = m?.warranty[0];
  const lede = [
    first ? `${b.name} gives ${first.length ? `${first.length} on ${first.covers}` : `a ${first.covers} warranty`}${first.condition ? ` (${first.condition})` : ""}.` : null,
    `${plural(b.count, "company", "companies")}${here()} install it${b.adds.length ? `, and ${b.adds.length} add a guarantee of their own` : ""}.`,
  ].filter(Boolean).join(" ");
  const page: Page = {
    path: b.path,
    title: `${b.name} installers${here()}`,
    description: `${plural(b.count, "company", "companies")}${here()} that install ${b.name}${m?.warranty.length ? `, ${b.name}'s own warranty terms,` : ""} and what each installer adds.`,
    index: b.index,
    crumbs: [{ label: "Brands", href: "/brands" }],
    jsonLd: [itemList(`${b.name} installers${here()}`, installers)],
  };
  const Body = () => (
    <div data-pagefind-body>
      <PageHead page={page} lede={lede} />
      {m?.warranty.length ? (
        <Section heading={`${b.name}'s own warranty`}>
          <ul class="space-y-2">
            {m.warranty.map((w) => <li class="flex items-start gap-2"><Check class="mt-0.5" /><span>{title(w.covers)}: {w.length ?? "length not stated"}{w.condition ? ` (${w.condition})` : ""} <a href={w.url} rel="nofollow noopener" class="text-label text-ink-3">source</a></span></li>)}
          </ul>
          {m.registration ? <p class="mt-3 text-ink-2">Registration{m.registration.days ? ` within ${m.registration.days} days` : ""}: "{m.registration.quote}" <a href={m.registration.url} rel="nofollow noopener" class="text-label text-ink-3">source</a></p> : null}
        </Section>
      ) : null}
      {b.adds.length ? (
        <Section heading="What installers add">
          <ul class="space-y-1.5">{b.adds.map((x) => <li><a href={x.company.path}>{x.company.name}</a>: {x.guarantees.map((g) => `${g.length && PLAIN_LENGTH.test(g.length) ? `${lengthWord(g.length)} ` : ""}${g.kind} guarantee`).join("; ")}</li>)}</ul>
        </Section>
      ) : null}
      <Section heading="Installers side by side"><ComparisonTable companies={installers} label={`${b.name} installers, side by side`} /></Section>
      {m?.reviews.length ? <Section heading="Independent reviews"><Links links={m.reviews} /></Section> : null}
      {m?.news.length ? <Section heading="In the news"><Links links={m.news} /></Section> : null}
      <Section heading={`Every ${b.name} installer`}><CompaniesOf d={d} refs={b.companies} /></Section>
    </div>
  );
  return { page, Body };
}

/** A length that reads well before a noun ("10 years", "lifetime"), not one with terms in it. */
const PLAIN_LENGTH = /^(\d+[ -](day|month|year)s?|lifetime)$/i;

const Links = ({ links }: { links: Link[] }) => <ul class="space-y-1.5">{links.map((x) => <li><a href={x.url} rel="nofollow noopener">{x.title}</a>{x.where ? <span class="text-ink-3"> · {x.where}</span> : null}</li>)}</ul>;

export function topicPage(d: Data, t: ListEntry) {
  const page: Page = { path: t.path, title: title(t.name), description: `${plural(t.count, "company", "companies")}${here()} offering ${t.name}.`, index: t.index, crumbs: [{ label: "Common promises", href: "/topics" }] };
  const Body = () => (
    <div data-pagefind-body>
      <PageHead page={page} lede={plural(t.count, "company", "companies")} />
      <Band class="mt-4"><CompaniesOf d={d} refs={t.companies} /></Band>
    </div>
  );
  return { page, Body };
}
