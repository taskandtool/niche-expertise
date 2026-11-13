# Niche Expertise

**A local guide to one trade in one area that your AI agent builds and keeps
current by chat.** You get a site where people compare each company's
guarantees, current offers and Google rating before they hire.

[![Deploy on Task & Tool](https://taskandtool.com/images/deploy-button.svg)](https://taskandtool.com/accounts/register?starter_app=niche-expertise)

It's made to run on Task & Tool. There, each app has its own computer for
your AI agent. The agent uses the scripts and skills in this repo to find
the businesses, read what each one publishes and build a page for every
company, town and service. The site is built with Hono and Tailwind, its map
with MapLibre and its search with Pagefind.

## Get started

Click the button above, or pick Niche Expertise when you create an app on
[Task & Tool](https://taskandtool.com/starter-apps/niche-expertise). Then
tell the agent the trade and the area in the chat: "Build a niche expertise
site for HVAC companies in North Austin."

## Features

### You see the list and the cost before anything is spent

The agent finds the businesses in Overture Maps or takes a list you give it.
Overture is free. The agent tells you how many it found, how many have
websites, where they are, and what reading them will cost in credits, AI and
time. Then it reads about 20 of them and builds a few pages for you to
check. It reads the rest only after your yes.

### The agent reads each company's site, Google listing and social pages

It gathers what the company publishes and writes one record of facts. A fact
has a short exact quote and its source. Before a deploy, the agent traces
the quotes back to what was gathered. When two sources disagree, the agent
puts both on the page. The agent adds no facts of its own. Readers see a
note on company pages that nobody has verified the facts.

| Source | What the agent gets from it |
|---|---|
| The company's website | Services, guarantees, offers, brands, proof, photos and warranty PDFs |
| Google listing | Rating, review count, hours and a few reviews |
| Facebook, Instagram, LinkedIn, TikTok | Background, photos and posts |
| Meta and Google ad libraries | The ads a company is running now |
| DataForSEO | Every Google review, with its date and rating |

None of the connections is required. With none, the agent works from the
company websites alone.

### Readers can compare guarantees side by side

The agent records a guarantee's length, whether it covers parts or labor,
its conditions and whose it is. Once three companies state a length, the
usual length is the middle one. A company that offers longer gets a note on
best-of lists and on that guarantee's page: "10-year labor guarantee (most
offer 1 year)". A blank in a comparison reads "not stated".

### Readers see only current offers

Once a month the agent checks the companies' Facebook and Instagram posts
and running ads for new offers. Daily, the agent takes down offers that are
past their end date or gone from their source. You can see the ended offers
on the What's new page. Visitors see the change after the next deploy. You
ask for it in the chat.

### Each town and service gets a best-of list

Companies based in that town come first. Next come the best Google ratings.
A rating counts once it has 20 reviews. You can change that number in
`SITE.md`. More reviews give a rating more weight. Above the list is one
line on how it ranks. Nobody can pay for a place. Under the list is a
side-by-side table.

### The agent builds the pages people search for

Besides a page for each company, town and service, the agent builds:

- pages for guarantee kinds and common phrases ("same-day service")
- "A vs B" and "alternatives to A" pages for companies that state at least
  two of the same facts
- a page per brand: the maker's warranty terms and the companies that
  install the brand
- a page of current offers, a list of companies with a map, and a filter by
  ZIP code or distance

The agent keeps a page out of search until it has enough real data. You set
how much in `SITE.md`.

### Readers can call a company from its page

A company page with a phone number has a Call button at the top. The
company's Google rating is there too. You can also send quote requests to
the companies' published emails. That means emailing businesses that never
signed up. The agent turns it on only when you ask. It needs Resend or
Postmark. Businesses can claim their listing, correct it or ask to be
removed. You decide on each request.

### You can schedule refreshes, health checks and audits

When you ask, the agent schedules these jobs:

| Job | When | What it does |
|---|---|---|
| Refresh offers | Monthly | Checks ads and recent posts for new offers |
| Rebuild data | Daily | Retires offers that ended or were taken down at their source. Uses no AI and costs nothing |
| Refresh everything | Quarterly | Re-reads sites, profiles and reviews. Companies with no changes cost no AI |
| Find new businesses | Quarterly | Lists new companies. The agent reads them when you ask |
| Site health | Weekly | Checks the live site for broken links and SEO basics, once it has an address |
| Audit | Monthly | Spot-checks company facts against the live sources and reads Search Console |

### Ask the agent for this week's posts

The agent lists what changed on the site: best-of lists that moved, new
offers, standout guarantees and new "vs" pages. It drafts a Facebook or
LinkedIn post for each. It uses only facts from the page. It files them as
drafts and shows them to you.

### `npm run check` must pass before a deploy

The deploy stops on broken links, a quote that doesn't match its source, an
offer shown as current after it ended, missing titles or structured data,
thin pages open to search, and wording that sounds like AI. `npm test` runs
the repo's 138 tests.

### Skills for each kind of work

| Skill | What it does |
|---|---|
| `read-company` | Reads everything gathered on one company and writes its record |
| `read-brand` | Reads a brand's warranty terms, reviews and news |
| `tidy-names` | Sets what this trade looks for and merges two names for one thing |
| `write-guide` | Writes a guide to a service or guarantee: what is normal here and what to ask |
| `cross-check` | Spot-checks pages against the live sources, and runs the monthly audit |
| `site` | Changes page templates, filters, the map and the correction form |
| `seo` | Best-of lists, "vs" pages, titles and structured data for Google and AI answers |
| `design` | Changes the colors, type and spacing |
| `social-post` | Writes posts in the owner's voice |
| `tropes` | Spots phrases that read as machine-written |
| `forms` `data` | The quote and contact forms, and the database code under them |

## Why run it on Task & Tool

Task & Tool is the easiest place to run it: the agent, the scripts and the
scheduled jobs all run on the app's computer. Each app gets:

- Its own computer for the agent, and a dev address where your team sees
  changes before they go live
- A Postgres database for quote requests and corrections that you can roll
  back to an earlier point in time
- Publishing on your own domain with a free SSL certificate. Only your team
  sees production until you make it public.
- Connections to Google Places, ScrapeCreators, DataForSEO and email. Their
  keys stay out of this repo.
- Scheduled jobs for the refreshes and audits above

## Make it your own

Ask the agent for any change in the chat. To start from your own copy, fork
this repo, change what you like, and start a new app from your fork on Task
& Tool. You can also copy its skills from `.claude/skills/` into another
repo.

## What's in the repo

```
src/              the site: company, area, best-of and comparison pages, forms
scripts/          finding, gathering, checking records, building data, ranking
test/             the tests
design/           the design system
styles/           the Tailwind theme, compiled from the design system
static/           the site's script and icons
.claude/skills/   the 12 skills
SITE.md           your rules: the trade, the area, the audience, the page limits
AGENTS.md         what the agent reads first
PROCESS.md        how the agent starts a guide and keeps it current
ARCHITECTURE.md   why it works the way it does
.taskandtool/     setup for an install on Task & Tool
starter-app.json  what the app needs and its chat suggestions
```

What the agent gathers and writes (`companies.csv`, `raw/`, `records/`,
`data/`, `content/`, `posts/` and the rest) stays out of git. Task & Tool
restores it from backups on a new machine.

## Commands

The agent runs these on the app's computer. With Node 20 or later, you can
run the site on your own computer too.

- `npm run dev` serves the site on localhost:3000 and reloads it on every
  change. Forms need a database in `DATABASE_URL`.
- `npm run check` builds the site and runs every check a deploy must pass.
- `npm test` runs the tests.
- `npm run deploy` updates the database, builds the site, runs the checks
  and publishes it to production. It works only on Task & Tool.

Each command in `AGENTS.md` takes `--help`.

## Third-party tools

- [`tt-crawl`](https://github.com/taskandtool/crawler), our crawler, for
  reading sites and Google listings and taking screenshots.
- `overturemaps` for finding businesses and area boundaries. Overture's
  boundaries are ODbL and need attribution.
- npm packages, MIT: `hono`, `@hono/node-server`,
  `@neondatabase/serverless`, `marked`, `tailwindcss` + `@tailwindcss/cli`,
  `esbuild`, `tsx`, `pg`, `pagefind`; `maplibre-gl` (BSD-3-Clause), `yaml`
  (ISC) and `typescript` (Apache-2.0).

## License

MIT. See `LICENSE`.
