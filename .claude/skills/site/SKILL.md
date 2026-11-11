---
name: site
description: "Changes how the site works: page templates, filters, the map, charts, the correction form and the look. Use for any change to pages or the build. Not for what a company's page says, which comes from its record (read-company), or for ranking in search and AI answers (seo)."
---

# The site

Hono templates pre-rendered to static HTML from `data/`, served from Cloudflare, so the machine can sleep.

- `src/app.tsx` is every pre-rendered route, `src/pages/` the templates, `src/components.tsx` the
  parts. `src/data.ts` reads `data/`. These run on the machine only.
- `src/public.tsx` is all the Worker carries: `/contact`, its form routes, quote requests (`src/leads.tsx`), the 404. It must stay
  free of Node built-ins and `data.ts`; `npm run check` fails otherwise.
- `scripts/zips.mjs` and `scripts/zipmap.mjs` map ZIP codes to cities and counties from Census files, with no AI.
- `static/site.js` runs the filters, distance, compare, search and the map, over `/filters/*.json`,
  which `npm run build` copies from `data/`. Filters only appear when `scripts/build-data.mjs` says
  enough companies have that data.
- The look is `design/system.yaml`: `npm run apply-design`, tokens only in markup (the `design` skill).

Rules the pages keep, which `npm run check` tests:

- Code counts. A number on a page comes from `data/`. Never write one into a template.
- A company page sells, and every claim on it is true: stars only from a platform's number, "free" only where the company says it, a named person only beside a picture that names them. Cards stay one glance long: "Terms apply" links out where a record holds conditions, and sources sit together at the page's foot. A section with nothing to say is left out; in a comparison a blank reads "not stated", never "no".
- Copy is plain labels and plain benefits. A cold read against `.claude/skills/tropes/references/copy.md` catches what the script can't, such as "what they actually state".
- A rating stays its platform's; there is no score of ours and no review markup. The review band says when it shows only 4 and 5 stars. A complaint shows only as a trend: 5 or more reviews, 5% of those read, from 50 or more read.
- The default order is companies with a current offer first, then the rest, each by name. Other sorts are named where they are chosen. A best-of page orders by its method line (the `seo` skill); nothing else raises a company.
- A page that doesn't pass the gate (`data/pages.json`) stays `noindex` and out of the sitemap.
- Source text is rendered only as text: never `raw()` it. A link is web, mail or phone.

Done when `npm run check` passes and `tt-crawl shoot /path` shows the changed pages right at phone and desktop width.
