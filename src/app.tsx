// Every page the build pre-renders, from data/. Machine only: dev serves this, the
// build renders it to static files, and the Worker never bundles it.
import { Hono } from "hono";
import type { FC } from "hono/jsx";
import { loadData } from "./data";
import { render, site, type Page } from "./shell";
import { companyPage, CompanyBody } from "./pages/company";
import { brandPage, brandsHub, companiesHub, guaranteePage, guaranteesHub, offerKindPage, offersHub, servicePage, servicesHub, topicPage, topicsHub } from "./pages/lists";
import { areaPage, areasHub, serviceAreaPage, zipPage } from "./pages/areas";
import { about, compare, home, search, whatsNew } from "./pages/misc";
import { alternativesPage, compareLinks, versusPage } from "./pages/rank";
import publicApp from "./public";

export type Route = { page: Page; Body: FC };

/** Which group of the sitemap a path belongs to. */
const groupOf = (path: string) => path.split("/")[1] || "main";

export function routes(): Route[] {
  const d = loadData();
  return [
    home(d),
    about(d),
    whatsNew(d),
    compare(),
    search(),
    companiesHub(d),
    offersHub(d),
    servicesHub(d),
    guaranteesHub(d),
    brandsHub(d),
    topicsHub(d),
    areasHub(d),
    ...d.companies.map((c) => ({ page: companyPage(c), Body: () => <CompanyBody c={c} compare={compareLinks(d, c)} /> })),
    ...d.offers.kinds.map((k) => offerKindPage(d, k)),
    ...d.services.map((s) => servicePage(d, s)),
    ...d.guarantees.map((g) => guaranteePage(d, g)),
    ...d.brands.map((b) => brandPage(d, b)),
    ...d.topics.map((t) => topicPage(d, t)),
    ...d.areas.map((a) => areaPage(d, a)),
    ...d.serviceAreas.map((s) => serviceAreaPage(d, s)),
    ...d.zipPages.map((z) => zipPage(d, z)),
    ...d.versus.map((v) => versusPage(d, v)),
    ...d.alternatives.map((x) => alternativesPage(d, x)),
  ];
}

/** The sitemap: an index, then one file per page type. */
export function sitemaps(): Record<string, string> {
  if (!site.url) return {}; // a sitemap needs full addresses: it arrives with SITE.md's url, after the first deploy
  const open = routes().filter((r) => r.page.index !== false).map((r) => r.page.path);
  const groups = new Map<string, string[]>();
  for (const p of open) groups.set(groupOf(p), [...(groups.get(groupOf(p)) ?? []), p]);
  const out: Record<string, string> = {};
  for (const [g, paths] of groups) {
    out[`sitemap-${g}.xml`] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${site.url}${p}</loc></url>`).join("\n")}\n</urlset>\n`;
  }
  out["sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...groups.keys()].map((g) => `  <sitemap><loc>${site.url}/sitemap-${g}.xml</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`;
  return out;
}

export const robots = () => `User-agent: *\nAllow: /\n${site.url ? `Sitemap: ${site.url}/sitemap.xml\n` : ""}`;

const app = new Hono();
// Routes are read per request in dev, so a rebuild of data/ shows on refresh.
app.use("*", async (c, next) => {
  if (c.req.method !== "GET") return next();
  const path = new URL(c.req.url).pathname;
  const route = routes().find((r) => r.page.path === path);
  if (route) return c.html(render(route.page, <route.Body />));
  const map = sitemaps()[path.slice(1)];
  if (map) return c.body(map, 200, { "Content-Type": "application/xml" });
  if (path === "/robots.txt") return c.text(robots());
  return next();
});
app.route("/", publicApp);

export default app;
