// Areas: who works where. "Based here" and "serve here" always show apart.
import { CompanyCard, CompanyMap, PageHead, Section, Tag, plural, title } from "../components";
import type { Area, Company, Data, ServiceArea, ZipPage } from "../data";
import { Band, site, type Page } from "../shell";
import { BestOf, rankedItems } from "./rank";


function Rows({ companies }: { companies: Company[] }) {
  return <ul class="grid gap-3 lg:grid-cols-2">{companies.map((c) => <li><CompanyCard c={c} /></li>)}</ul>;
}

export function areasHub(d: Data) {
  const page: Page = { path: "/areas", title: `${site.noun} by area`, description: `Find ${site.noun} near you.` };
  const kinds = [["locality", "Cities"], ["county", "Counties"], ["neighborhood", "Neighborhoods"], ["region", "States"]] as const;
  const states = d.areas.filter((x) => x.kind === "region");
  const Body = () => (
    <>
      <PageHead page={page} />
      {states.length === 1 ? <Band class="pb-2"><a href={states[0].path} class="font-semibold">All of {states[0].name}</a></Band> : null}
      {kinds.map(([kind, label]) => {
        const list = d.areas.filter((x) => x.kind === kind).sort((x, y) => y.count - x.count);
        // One state is no choice at all.
        return list.length > (kind === "region" ? 1 : 0) ? (
          <Section heading={label}>
            <p class="flex flex-wrap gap-2">{list.map((x) => <Tag href={x.path}>{x.name}</Tag>)}</p>
          </Section>
        ) : null;
      })}
    </>
  );
  return { page, Body };
}

export function areaPage(d: Data, a: Area) {
  const of = (slugs: string[]) => slugs.map((s) => d.companies.find((c) => c.slug === s)).filter((c): c is Company => Boolean(c));
  const based = of(a.based);
  const serves = of(a.serves);
  const page: Page = {
    path: a.path,
    title: `Best ${site.noun} in ${a.name}`,
    description: `${plural(a.ranked.length, "company", "companies")} in ${a.name} ranked by Google rating and reviews, with their guarantees and current offers side by side.`,
    index: a.index,
    crumbs: [{ label: "Areas", href: "/areas" }],
    map: true,
    ...(a.ranked.length ? { jsonLd: [rankedItems(d, `Best ${site.noun} in ${a.name}`, a.ranked)] } : {}),
  };
  const services = d.serviceAreas.filter((x) => x.area === a.path);
  const Body = () => (
    <div data-pagefind-body>
      <PageHead page={page} />
      <BestOf d={d} ranked={a.ranked} where={a.name} what={site.noun} area={a.name} updated={a.updated} />
      {services.length ? <Band class="pb-2"><nav aria-label="Services here" class="flex flex-wrap gap-2">{services.map((s) => <Tag href={s.path}>{title(s.service)}</Tag>)}</nav></Band> : null}
      {a.zips?.length ? (
        <Band class="mt-4">
          <p class="text-label font-semibold text-ink-2">ZIP codes</p>
          <nav aria-label={`ZIP codes in ${a.name}`} class="mt-1.5 flex flex-wrap gap-1.5">{a.zips.filter((z) => d.zipPages.some((p) => p.zip === z)).map((z) => <Tag href={`/zips/${z}`}>{z}</Tag>)}</nav>
        </Band>
      ) : null}
      <Band class="mt-6"><CompanyMap area={a.path} /></Band>
      {based.length ? <Section heading={`Every company based in ${a.name}`}><Rows companies={based} /></Section> : null}
      {serves.length ? <Section heading={`Based elsewhere and serving ${a.name}`}><Rows companies={serves} /></Section> : null}
    </div>
  );
  return { page, Body };
}

export function zipPage(d: Data, z: ZipPage) {
  const list = z.companies.map((x) => d.companies.find((c) => c.slug === x)).filter((c): c is Company => Boolean(c));
  const page: Page = {
    path: z.path,
    title: `${title(site.noun)} in ${z.zip}`,
    description: `${plural(list.length, "company", "companies")} serving ZIP code ${z.zip}${z.place ? ` in ${z.place}` : ""}. See current offers, guarantees and reviews.`,
    index: z.index,
    crumbs: [{ label: "Areas", href: "/areas" }],
  };
  const Body = () => (
    <div data-pagefind-body>
      <PageHead page={page} lede={`${z.place ? `${z.place}. ` : ""}${plural(list.length, "company", "companies")} serving this ZIP code.`} />
      <Band class="mt-4"><Rows companies={list} /></Band>
    </div>
  );
  return { page, Body };
}

export function serviceAreaPage(d: Data, s: ServiceArea) {
  const list = s.companies.map((x) => d.companies.find((c) => c.slug === x)).filter((c): c is Company => Boolean(c));
  const page: Page = {
    path: s.path,
    title: `Best ${s.service} in ${s.areaName}`,
    description: `${plural(s.ranked.length, "company", "companies")} offering ${s.service} in ${s.areaName}, ranked by Google rating and reviews, with guarantees and offers side by side.`,
    index: s.index,
    crumbs: [{ label: "Areas", href: "/areas" }, { label: s.areaName, href: s.area }],
    ...(s.ranked.length ? { jsonLd: [rankedItems(d, `Best ${s.service} in ${s.areaName}`, s.ranked)] } : {}),
  };
  const Body = () => (
    <div data-pagefind-body>
      <PageHead page={page} />
      <BestOf d={d} ranked={s.ranked} where={s.areaName} what={`${s.service} companies`} area={s.areaName} updated={s.updated} />
      <Section heading={`Every company offering ${s.service} here`}><Rows companies={list} /></Section>
    </div>
  );
  return { page, Body };
}
