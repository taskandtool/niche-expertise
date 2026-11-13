# Niche Expertise

**A local guide to one trade in one area. You build it and keep it up to
date by chatting with your AI agent.** You get a site where people compare
each company's guarantees, current offers and Google rating before they
hire.

[![Deploy on Task & Tool](https://taskandtool.com/images/deploy-button.svg)](https://taskandtool.com/accounts/register?starter_app=niche-expertise)

![The North Austin HVAC Guide's homepage and Larkspur Heating & Air's page on a phone](https://taskandtool.com/images/starter-apps/niche-expertise.webp)

It's made to run on Task & Tool. Each app there has its own computer for
your AI agent. The agent uses the scripts and skills in this repo to find
the businesses, read what each one publishes and build a page for every
company, town and service. The site is built with Hono and Tailwind, its map
with MapLibre and its search with Pagefind.

## Get started

Click the button above, or pick Niche Expertise when you create an app on
[Task & Tool](https://taskandtool.com/starter-apps/niche-expertise). Then
tell the agent the trade and the area in the chat: "Build a niche expertise
site for HVAC companies in North Austin."

See it in use on the [Niche Expertise
page](https://taskandtool.com/starter-apps/niche-expertise).

## Features

### You see the company list and the cost first

The agent finds the businesses in Overture Maps or takes a list you give it.
Overture is free. The agent tells you how many it found, how many have
websites, where they are, and what reading them will cost in credits, AI and
time. Then it reads about 20 of them and builds a few pages for you to
check. It reads the rest when you tell it to.

### The agent reads each company's site, Google listing and social pages

It gathers what the company publishes and writes down the facts in one
record. A fact has a short exact quote and its source. Before a deploy, the
agent checks each quote against what it gathered. Where two sources differ,
the agent puts both on the page. The agent adds no facts of its own. Each
company page has a note: nobody has verified its facts.

| Source | What the agent gets from it |
|---|---|
| The company's website | Services, guarantees, offers, brands, proof, photos and warranty PDFs |
| Google listing | Rating, review count, hours and a few reviews |
| Facebook, Instagram, LinkedIn, TikTok | Background, photos and posts |
| Meta and Google ad libraries | The ads a company is running now |
| DataForSEO | Every Google review with its date and rating |

None of the connections is required. With none, the agent works from the
company websites alone.

### Readers can compare guarantees side by side

The agent records a guarantee's length, whether it covers parts or labor,
its conditions and whether the company or the maker gives it. Once three
companies state a length, the agent takes the middle one as the usual
length. A company that offers longer gets a note on best-of lists and on
that guarantee's page: "10-year labor guarantee (most offer 1 year)". Where
a company doesn't state something, readers see "not stated" in comparisons.

<img src="https://taskandtool.com/images/marketing/north-austin-guide-labor.webp" width="420" alt="Who goes further: the labor guarantee each HVAC company offers, in years">

### Current offers only

Once a month the agent checks the companies' Facebook and Instagram posts
and running ads for new offers. Every day the agent takes down offers that
are past their end date or gone from their source. You can see the ended
offers on the What's new page. Visitors see the change once you ask the
agent to deploy.

<img src="https://taskandtool.com/images/marketing/north-austin-guide-offers.webp" width="420" alt="Current offers from HVAC companies and the date each one ends">

### Best-of lists by town and service

On a town's list, the agent puts companies based in that town first, then
ranks by Google rating. It counts a rating once the company has 20 reviews.
You can change that number in `SITE.md`. The more reviews a rating has, the
more weight the agent gives it. Above the list is one line on how the list
is ranked. Nobody can pay for a place. Under the list is a side-by-side
table.

<img src="https://taskandtool.com/images/marketing/north-austin-guide-round-rock.webp" width="420" alt="Best HVAC companies in Round Rock, ranked by Google rating">

### Pages for the searches people make

Besides a page for each company, town and service, the agent builds:

- pages for guarantee kinds and common phrases ("same-day service")
- "A vs B" and "alternatives to A" pages for companies that state at least
  two of the same facts
- a page per brand: the maker's warranty terms and the companies that
  install the brand
- a page of current offers, a list of companies with a map, and a filter by
  ZIP code or distance

The agent keeps a page out of search until the page has enough data. You set
how much in `SITE.md`.

### Readers can call a company from its page

A company page with a phone number has a Call button at the top. The
company's Google rating is there too. Readers can also send a quote request
to a company's published email. That means emailing businesses that never
signed up. The agent sets up these emails only when you ask. They need
Resend or Postmark. Businesses can claim their listing, correct it or ask to
be removed. You decide on each request.

### Scheduled refreshes, health checks and audits

When you ask, the agent schedules these jobs:

| Job | When | What the agent does |
|---|---|---|
| Refresh offers | Monthly | Checks ads and recent posts for new offers |
| Rebuild data | Daily | Takes down offers that ended or are gone from their source. No AI and no cost |
| Refresh everything | Quarterly | Re-reads sites, profiles and reviews. Companies with no changes cost no AI |
| Find new businesses | Quarterly | Lists new companies and reads them when you ask |
| Site health | Weekly | Once the site has an address, checks it for broken links and SEO basics |
| Audit | Monthly | Spot-checks company facts against the live sources and reads Search Console |

### Ask the agent for this week's posts

The agent lists the week's changes: moves on best-of lists, new offers,
standout guarantees and new "vs" pages. It drafts a Facebook or LinkedIn
post for each. It uses only facts from the page and shows you the drafts.

### Checks before every deploy

The agent can't deploy the site with broken links, a quote that doesn't
match its source, an offer shown as current after it ended, missing titles
or structured data, thin pages open to search, or AI-sounding wording.

### Skills in this repo

| Skill | What the agent uses it for |
|---|---|
| `read-company` | Reading everything gathered on one company and writing its record |
| `read-brand` | Reading a brand's warranty terms, reviews and news |
| `tidy-names` | Choosing what to look for in this trade and merging two names for one thing |
| `write-guide` | Writing a guide to a service or guarantee: what is normal here and what to ask |
| `cross-check` | Spot-checking pages against the live sources and running the monthly audit |
| `site` | Changing page templates, filters, the map and the correction form |
| `seo` | Best-of lists, "vs" pages, titles and structured data for Google and AI answers |
| `design` | Changing the colors, type and spacing |
| `social-post` | Writing posts in the owner's voice |
| `tropes` | Finding machine-sounding phrases |
| `forms` `data` | The quote and contact forms, and the database code under them |

## Why run it on Task & Tool

Task & Tool is the easiest place to run it: the agent runs the scripts and
scheduled jobs on the app's computer. Each app has:

- Its own computer for the agent
- A dev address where your team sees changes before you publish them
- Access to the project's Postgres database for quote requests and
  corrections. You can roll it back to an earlier point in time.
- Publishing on your own domain with a free SSL certificate. Only your team
  sees production until you make it public.
- Connections to Google Places, ScrapeCreators, DataForSEO and email. We
  hold their keys.
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
`data/`, `content/`, `posts/` and the rest) is not in git. We restore it
from backups on a new machine.

## Commands

The agent runs these on the app's computer. With Node 20 or later, you can
run the site on your own computer too.

- `npm run dev`: serve the site on localhost:3000 with live reload. Forms
  need a database in `DATABASE_URL`.
- `npm run check`: build the site and run every check that must pass before
  a deploy.
- `npm test`: run the tests.
- `npm run deploy`: update the database, build the site, run the checks and
  publish it to production. You can run it only on Task & Tool.

`AGENTS.md` lists more commands. You can pass `--help` to any of them.

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
