// The document around every page: head, header, footer. Runs at the edge too
// (the correction form), so it reads no files. Pages supply what goes in <main>.
import { html, raw } from "hono/html";
import type { Child } from "hono/jsx";
import { googleFontsUrl } from "./fonts";
import siteJson from "./generated/site.json";

export const site = siteJson as { name: string; niche: string; noun: string; area: string; url: string; contactEmail: string; disclosure: string; forwardLeads: boolean };

export type Page = {
  path: string;
  title: string;
  description: string;
  /** False keeps it out of search and the sitemap. */
  index?: boolean;
  jsonLd?: object[];
  crumbs?: { label: string; href: string }[];
  map?: boolean;
};

const NAV = [
  ["Companies", "/companies"],
  ["Offers", "/offers"],
  ["Services", "/services"],
  ["Guarantees", "/guarantees"],
  ["Areas", "/areas"],
];

const absolute = (path: string) => `${site.url}${path}`;

function breadcrumbLd(page: Page) {
  if (!page.crumbs?.length) return null;
  const all = [...page.crumbs, { label: page.title, href: page.path }];
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: absolute(c.href) })) };
}

/** JSON inside a script tag: a closing tag in source text must not end the script. */
const ld = (obj: object) => JSON.stringify(obj).replace(/</g, "\\u003c");

function Layout({ page, children }: { page: Page; children?: Child }) {
  const crumb = breadcrumbLd(page);
  const jsonLd = [...(page.jsonLd ?? []), ...(crumb ? [crumb] : [])];
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{page.path === "/" ? site.name : `${page.title} | ${site.name}`}</title>
        <meta name="description" content={page.description} />
        <meta data-pagefind-meta="title[content]" content={page.title} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.description} />
        <meta property="og:type" content="website" />
        {page.index === false ? <meta name="robots" content="noindex" /> : null}
        {page.index !== false && site.url ? <link rel="canonical" href={absolute(page.path)} /> : null}
        {googleFontsUrl ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
            <link rel="stylesheet" href={googleFontsUrl} />
          </>
        ) : null}
        <link rel="stylesheet" href="/site.css" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {page.map ? <link rel="stylesheet" href="/maplibre/maplibre-gl.css" /> : null}
        {(site.url ? jsonLd : []).map((obj) => (
          <script type="application/ld+json">{raw(ld(obj))}</script>
        ))}
        <script src="/site.js" defer />
      </head>
      <body class="flex min-h-screen flex-col bg-canvas text-ink font-body">
        <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
          Skip to content
        </a>
        <header class="border-b border-line bg-surface">
          <div class="mx-auto flex max-w-wide flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 sm:px-8">
            <a href="/" class="font-display text-title no-underline">{site.name}</a>
            <nav aria-label="Main" class="-mx-2 flex max-w-full flex-wrap">
              {NAV.map(([label, href]) => (
                <a href={href} class="whitespace-nowrap px-2 py-1 no-underline text-ink-2 hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink" aria-current={page.path.startsWith(href!) ? "page" : undefined}>
                  {label}
                </a>
              ))}
              <a href="/search" data-search-open class="ml-2 inline-flex items-center gap-1.5 rounded-control border border-line px-2.5 py-1 no-underline text-ink-2 hover:border-line-strong hover:text-ink">
                <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="9" r="5.5" /><path d="m13.500 13.500 3.500 3.500" /></svg>
                Search
                <kbd data-search-key class="hidden rounded bg-panel px-1.5 font-body text-[0.75rem] text-ink-3 lg:inline" />
              </a>
            </nav>
          </div>
        </header>
        <main id="main" class="grow pb-section">{children}</main>
        <footer class="bg-night text-night-ink-2">
          <div class="mx-auto grid max-w-wide gap-6 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto]">
            <div class="max-w-content">
              <p class="font-display text-title text-night-ink">{site.name}</p>
              <p class="mt-2">An independent guide. Details come from each company's website and public reviews. We haven't verified them.</p>
              {site.disclosure ? <p class="mt-2">{site.disclosure}</p> : null}
            </div>
            <nav aria-label="About this site" class="flex flex-col gap-1">
              <a class="no-underline hover:text-night-ink" href="/about">About</a>
              <a class="no-underline hover:text-night-ink" href="/brands">Brands</a>
              <a class="no-underline hover:text-night-ink" href="/topics">Common promises</a>
              <a class="no-underline hover:text-night-ink" href="/new">What's new</a>
              <a class="no-underline hover:text-night-ink" href="/contact">Contact</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}

/** A full document for a page: the doctype plus the layout. */
export const render = (page: Page, body: Child) => html`<!doctype html>${raw(String(<Layout page={page}>{body}</Layout>))}`;

/** One band of the page, on the frame every band shares. */
export function Band({ children, class: cls = "" }: { children?: Child; class?: string }) {
  return <div class={`mx-auto max-w-wide px-5 sm:px-8 ${cls}`}>{children}</div>;
}
