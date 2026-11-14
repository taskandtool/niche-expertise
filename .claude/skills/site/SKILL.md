---
name: site
description: "Changes how the site works: page templates, filters, the map, charts, the correction form and the look. Use for any change to pages or the build. Not for what a company's page says (its record: read-company) or for ranking in search and AI answers (seo)."
---

# The site

Done when `npm run check` passes and `tt-crawl shoot /path` shows the changed pages right at phone and desktop width.

The site is Hono templates pre-rendered to static HTML from `data/`. It is served from Cloudflare so the machine can sleep.

- `src/app.tsx` is every pre-rendered route, `src/pages/` the templates, `src/components.tsx` the
  parts. `src/data.ts` reads `data/`. These run on the machine only.
- `src/public.tsx` is all the Worker carries: `/contact`, its form routes, quote requests (`src/leads.tsx`), the 404. Keep it
  free of Node built-ins and `data.ts`; `npm run check` fails otherwise.
- `scripts/zips.mjs` and `scripts/zipmap.mjs` map ZIP codes to cities and counties from Census files, with no AI.
- `static/site.js` runs the filters, distance, compare, search and the map, over `/filters/*.json`.
  `npm run build` copies those from `data/`. A filter appears only when `scripts/build-data.mjs` says
  enough companies have that data.
- The look is `design/system.yaml`: `npm run apply-design`, tokens only in markup (the `design` skill).

Rules for every page. `npm run check` tests some of them:

- Every number on a page comes from `data/`. Never type one into a template.
- Write a company page as a sales page in which every claim is true: stars only from a platform's number, "free" only where the company says it, a named person only beside a picture that names them. Keep cards short. Where a record has conditions, link out with "Terms apply", and list the sources together at the foot of the page. Leave out a section with nothing to say. In a comparison, a blank shows "not stated", never "no".
- Write plain labels and plain benefits. Then read the page cold against `.claude/skills/tropes/references/copy.md` for what the script misses, such as "what they actually state".
- Show a rating as its platform's. Add no score of ours and no review markup. If the review band shows only 4 and 5 star reviews, say so on the band. Show a complaint only as a trend: at least 5 reviews that mention it, at least 5% of the reviews read, and at least 50 reviews read.
- By default, list companies with a current offer first, then the rest, each group by name. Name any other sort where the visitor chooses it. A best-of page follows its method line (the `seo` skill). Nothing else moves a company up.
- Keep a page that doesn't pass the gate (`data/pages.json`) `noindex` and out of the sitemap.
- Render source text only as text: never `raw()` it. A link is web, mail or phone.
