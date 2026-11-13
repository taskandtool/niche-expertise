# Niche Expertise: architecture

`niche-expertise` is the app's name. This is the design we build and check against as we go;
change it when the build teaches us something. `PROCESS.md` covers how the app runs once
it exists.

## What it is

An app that builds independent recommendations for the businesses in one niche: HVAC, dentists,
agencies, whatever the owner chooses. It gathers everything a person would want to know
about each company from wherever it is published, and organizes it so someone can:

- **Browse companies** with filters, including by area.
- **Browse offers** and promotions running now.
- **Browse by what matters:** a service, a brand, a guarantee, a phrase like "same-day
  install".
- **See the proof:** logos, reviews, testimonials, awards, photos of the team and the work,
  and the company's background.
- **Understand the market:** what usually comes with a job, what is normal, who offers what,
  here in this area.

The owner chooses the niche, the area and the sources. Nothing in the pipeline may assume
one kind of business.

## What makes it different

Most directories hold a name, an address and a rating. This one is worth visiting for what
none of them put together:

1. **Comparable guarantees.** Length, parts or labor, conditions, and whose it is, across a
   whole market.
2. **Live offers from every source:** websites, social posts and running ads. A
   company's ad in the Meta or Google ad library shows what it is promoting right now, which
   its website often does not.
3. **Local market facts.** "In Round Rock, 14 of 38 companies publish a labor warranty." Each
   area's page has figures of its own.
4. **Real proof, shown with its source.** The company's own photos, what customers said and
   where, every fact dated.
5. **Links everywhere.** A company leads to its offer, its guarantee kind, everyone else with
   that guarantee, the brands they install and the areas they serve.

## Compared with the Wiki

The two apps share a method and differ in what they are for, so they are separate
repositories. Each starts from the same scripts and rules, and shared code gets extracted
only once both are proven.

| | Wiki | Niche Expertise |
|---|---|---|
| **Main page** | A topic or idea | A company, service, guarantee, offer or area |
| **What people do** | Read and explore | Filter, compare and choose |
| **Unit of AI work** | One source | One company, across everything gathered on it |
| **What AI produces** | A dense rewrite | Structured facts, each with its evidence |
| **What AI writes for readers** | Almost every page | A company's background, deep dives and guides. Code builds the rest |
| **Sources per item** | One | Many: site, Google, social, ads, reviews, data providers |
| **Pictures** | None | Logos, team, work |
| **Old information** | Worth keeping, as it shows change | Wrong, so it expires and retires |
| **Vocabulary** | Topics, free form | Fields set per niche, plus services, guarantees and brands |
| **Numbers** | Rare | Central, always counted by code |
| **Geography** | None | Central: areas, ZIP codes, service areas |
| **Cost of an error** | A misquote | A named business misrepresented, or a bad purchase |
| **Main SEO risk** | Scaled AI pages | Doorway pages for cities |

**From the Wiki:** one fresh AI run per unit, a sample before the full run, scripts for
anything mechanical, `tick` and the job design, quote checks, a publish gate, Pagefind and
the static site.

**From Company Brain:** `SITE.md` as the owner's rules, `log.md`, raw files as an immutable
source, two values shown and never picked between, retire and never erase, rendering safety,
failures that name the fix, and conditional chat suggestions.

## Decisions

1. **The company record is the center.** Everything gathered on a company is read once and
   turned into one record: facts with their evidence. Pages, filters and statistics are built
   from the records, and only scripts go back to the raw files.
2. **Collect broadly, and label everything.** Any public source is welcome. A reader always
   sees where a fact came from and when: "on their website", "in their Facebook post",
   "running as an ad", "customers on Google say", "from a data provider". Those are never
   blended.
3. **Confirm it is the same company before using a source.** A wrong Facebook page is worse
   than none. A profile counts only if the company's site links to it, or its phone or domain
   matches. Anything else is held for a person.
4. **Reading does not judge.** The record holds what was said. Nothing is verified, and the
   site says so plainly.
5. **Say nothing when the data is missing.** A company page leaves out a section with nothing to say, and a comparison shows a blank as "not stated", never "no". A
   website that does not mention a warranty says nothing about whether one exists. A filter
   with no data behind it does not appear.
6. **A ranking is by code and says how it ranks.** Best-of lists (area and service-in-area pages) put
   companies based there first (inside the boundary, or the address's city), then order by Google rating
   weighted toward more reviews: as if each company also had `rating_prior` reviews at the market's
   average, counted from `rating_reviews`. Every list carries that method line and the same comparison
   columns in the same order. Other lists put a current offer first, then name. Nobody pays for a place
   (`scripts/rank.mjs`).
7. **Code counts.** Every statistic, ranking and average comes from a script, never AI.
8. **Two values stay two.** If sources disagree on a phone number or a warranty length, both
   show. Nothing silently picks one.
9. **Offers expire.** Each has first seen, last seen and, if stated, an end date. A script
   retires one that has passed its date or disappeared from its source. An old offer is never
   shown as current.
10. **Businesses can correct their listing.** Every company page links to a form for a
    correction, a removal or a picture taken down, and a person decides.
11. **Source text is data, never instructions.** Codex runs with its sandbox off, because the
    machine is the boundary. A site or review that says "ignore your instructions" is just
    text.
12. **The owner's rules win.** `SITE.md` ships with the app and is the owner's to edit: the
    niche, the area, the audience, and what matters here. Every AI run reads it and follows it
    over a skill's defaults.
13. **Paid placement is always labeled,** if an owner ever sells it, and never changes a
    ranking. An owner who also runs a business in the niche says so on the About page, because
    the FTC bars presenting a site you control as independent reviews of your own products.
14. **Standard versus unique is counted.** A guarantee's usual length is the middle of the lengths
    companies state, once 3 state one; a company stands out when it goes past it, and the page says so
    in one line ("10-year labor guarantee, where most here offer 1 year"). A guarantee stated with no
    length is still one the company has.
15. **No page without facts.** A list needs `list_companies` qualifying companies, a "vs" page two rated
    companies stating `versus_fields` of the same facts, an alternatives page companies that beat it on
    a stated fact. Under the bar the page stays out of search.
16. **Every example is made up.** Companies, people, domains, phones and equipment brands in code,
    tests, docs and skills are invented (Northwind, `larkspur.example`, 555 numbers). Real data is kept
    only in the gitignored working folders and `samples/`.

## What a company profile holds

The test of this whole design: can we fill this in?

| Reader wants | Comes from | Done by |
|---|---|---|
| **Name, phone, email, address, hours, booking link** | `tt-crawl`'s `_index/business-card.json` and `facts.json`, the Google listing, Overture | Script |
| **Logo** | `business-card.json`, Facebook or Google profile | Script |
| **Team and work photos** | Site (`_index/media.json`), Facebook photos, Instagram posts, Google photos | Script gathers, Codex sorts by kind |
| **Background:** founded, owners, size, story | About and team pages, LinkedIn company page, Facebook profile | Codex, with evidence |
| **Services and prices where stated** | Site, documents | Codex |
| **Guarantees and warranties** | Site, warranty PDFs (`tt-crawl docs`) | Codex |
| **Offers and promotions** | Site, Facebook and Instagram posts, Meta and Google ad libraries, reviews | Script gathers, Codex reads |
| **Brands they work with** | Site, posts | Codex |
| **Reviews and ratings** | Google, Trustpilot, Tripadvisor and others through connections; ratings shown on the site | Script gathers; code counts; Codex finds what they praise and complain about |
| **Testimonials** | `_index/reviews.json`, video and case-study pages | Script, labeled as chosen by the company |
| **Other proof:** awards, certifications, licenses, memberships, dealer status, press, client logos, years in business | Site, documents, posts | Codex |
| **Social presence** | `same_as` in `business-card.json`, then each profile | Script |
| **Where it works** | Address, stated service areas, locations | Script and Codex |

## Sources

Each is a connection the owner holds, and each has its own terms on storing and republishing,
which the owner accepts when connecting it. Google's are the strictest. A company page links
back to the original.

| Source | What it gives | Through |
|---|---|---|
| **The company's site** | Nearly everything above | `tt-crawl` (no connection) |
| **Linked documents** | Warranty terms, price lists, brochures | `tt-crawl docs` |
| **Overture Maps** | Finding businesses: names, sites, phones, categories, locations | `overturemaps`, free |
| **Google listing** | Rating, review count, a few reviews, hours, photos | `google-places`, `tt-crawl places` |
| **All Google reviews** | The full set, with dates and ratings | `dataforseo` |
| **Trustpilot, Tripadvisor, Yelp** | Not built. Add one when a niche relies on it | `dataforseo` or `apify` |
| **Facebook** | Profile, photos, posts | `scrapecreators` (`/v1/facebook/profile`, `/profile/photos`, `/profile/posts`) |
| **Instagram, TikTok** | Profile and posts | `scrapecreators` |
| **LinkedIn** | Company background and size | `scrapecreators` (`/v1/linkedin/company`) |
| **Running ads** | What it is promoting right now | `scrapecreators` (`/v1/facebook/adLibrary/company/ads`, `/v1/google/company/ads`) |
| **Business data** | Listings, categories, firmographics | `dataforseo`, `apollo` |
| **The owner** | A CSV or broker export, additions in chat, licensing board lists | Import |

Fetching runs with no AI, one company at a time, resuming after a stop, and saves everything to
files so a source is never paid for twice. Media URLs from vendors expire, so pictures are
downloaded when found.

### Pictures

- `tt-crawl` runs with `--images brand`, which fetches the logo, the og:image, the photographs
  most pages show and gallery pictures. `_index/media.json` lists each with its kind, alt text,
  the page and the heading beside it.
- Vendor pictures are added beside them.
- **A picture is looked at once.** `scripts/images.mjs` hashes each, drops tiny ones and near-copies, and draws the rest small on numbered sheets. The AI
  describes each, and the words stay in `raw/<company>/images.json`, keyed by the hash, so a re-crawl never pays to look again and code picks the record's `media` from them: the company's own
  pictures, people first, 12 at most.
- `web_photos.py`, from the brand skill, resizes the keepers for the web.
- A company page keeps about 12 pictures at most. Each shows with its source, and alt text from
  the page or the AI run. A national site would outgrow static files, and pictures would
  move to R2.

### Reviews

On by default where the owner has connections. An AI run reads a company's reviews and records what
they praise and complain about and which services they mention, with short quotes. A script does all
counting. Ranking for "best for replacement" uses reviews that mention replacement and always shows
the count, since 4.9 from 12 is not 4.7 from 800. A company with too few relevant reviews says so and
is not ranked. A rating is shown per platform, never merged into a score of ours.

## Geography

This is the site's main way in, so it gets real data:

- **Areas are a hierarchy:** state, metro, county, city, neighborhood and ZIP. Boundaries come from
  Overture's divisions, which are ODbL and need attribution. Coverage below county level is uneven, so an
  area that has no boundary is left out.
- **ZIP codes come from public Census files, with no AI.** `scripts/zips.mjs` answers which ZIPs make up a city or county and which city a ZIP is in, from
  the 2020 relationship files saved once to `raw/geo/`. A ZIP belongs to a place when at least 10% of either lies in the other. A company works in a ZIP when
  it is based there, or based in or names a city it belongs to; the list's ZIP filter also takes companies within 20 miles. Each ZIP with companies has a page, open to search
  under the same gate as an area, and only the first of several sharing one list of companies.
- **Every company gets its areas by code:** a point-in-polygon check on each location.
- **Service areas are separate.** The AI run records the cities and ZIP codes a site lists, and code
  matches them to areas. "Based nearby" and "says it serves your area" always show separately, because
  websites are inconsistent.
- **Several locations are normal:** a record holds a list of them, each placed on its own.
- **National or online:** a `scope` filter, for niches like agencies.
- **Filters run in the browser:** distance from a ZIP code, or an area chosen from the hierarchy.
- **A map** with MapLibre shows companies and service areas, and each area page shows coverage. It always
  has a list beside it.

Each area gets its own statistics from code: how many companies, which guarantees are common, brands
installed, offers running. Those local figures are what make an area page worth reading and keep it from
being a doorway.

## Who does what

The test: if the same input should always give the same answer, a script does it. If it takes
understanding, Codex does it, with its normal tools.

| Work | Done by |
|---|---|
| Finding businesses, removing duplicates, matching by phone and domain | Script |
| Crawling, and contact details and testimonials from the crawl | `tt-crawl` |
| Calling vendors, saving results, downloading pictures | Script |
| Confirming a profile is the right company | Script, with close calls to a person |
| Placing companies in areas, distance, map data | Script |
| What is pending, who has what, what comes next | Script |
| Creating and removing jobs as work starts and ends | Script |
| Retiring expired offers, spotting changed sources | Script |
| Statistics, rankings, filters, every company, list and area page | Script |
| Quotes, dates, links, SEO, field values | Script |
| Reading what was gathered and writing the record, sorting pictures | Codex |
| Choosing a niche's fields, merging names like two spellings of a brand | Codex and the owner |
| Writing deep dives, guides and what to ask before you hire | Codex |
| What to build, what to publish, whether quality is good enough, corrections | The owner |

**Existing tools come first.** This app adds five scripts the AI runs (under "Scripts").

| Need | Already exists |
|---|---|
| Finding businesses, free | The `overturemaps` command |
| Crawling a site, with its pictures | `tt-crawl brand --external --images brand`, or `pages` for all of it |
| Contact details, social links, ratings, conflicting values | `tt-crawl`'s `_index/business-card.json` and `facts.json` |
| Testimonials on a company's own site | `tt-crawl`'s `_index/reviews.json` |
| Warranty PDFs, price lists and brochures | `tt-crawl docs` |
| A company's Google listing | `tt-crawl places`, with the `google-places` connection |
| Hashing, near-copies, small sheets, choosing pictures from their descriptions, web-ready photos | `images.mjs`, `web_photos.py` |
| Checking a live site | `tt-crawl audit` |
| Seeing and measuring pages at phone and desktop widths | `tt-crawl shoot`, `tt-crawl measure` |
| Reading files | Codex's shell and file tools |
| Jobs, activity, deliverables, deploy, connections | The bridge, `~/tools/taskandtool.py` |
| The correction form | The `forms` skill, on the project's database |
| AI tells | `tropes.mjs`, copied from the skills repository |
| Noticing changed files | The logic in Company Brain's `brain_status.py` |
| A site's build and its checks | The Website app's `scripts/build.ts` and `scripts/check.mjs` |
| Search | The Pagefind command, run over `dist/` |

## The pipeline

| Stage | Done by | Reads | Writes |
|---|---|---|---|
| 1. Find businesses | Script | Overture, an import or a connection | `companies.csv` |
| 2. Crawl each site | `tt-crawl`, through a script | `companies.csv` | `raw/<company>/site/` |
| 3. Gather from other sources, confirming each match | Script | The crawl's social links, `companies.csv` | `raw/<company>/<source>/`, pictures |
| 4. Read each company, one run each | Codex | `raw/<company>/`, `SITE.md`, `fields.yaml` | `records/<company>.md` |
| 5. Check each record, in the same run | Script | `raw/`, `records/` | Pass, or findings to fix |
| 6. Build the data | Script | `records/`, `aliases.yaml`, area boundaries | `data/`, resized pictures |
| 7. Tidy names | Codex and the owner | `data/` | `aliases.yaml` |
| 8. Write deep dives and guides | Codex | `data/`, `records/` | `content/` |
| 9. Link and cross-check | Script and Codex | `content/`, `data/` | Links and findings |
| 10. Build and deploy | Script | `data/`, `content/` | `dist/`, production |

Stages 2 to 7 run first on a sample of about 20 companies. That is when the niche's `fields.yaml` gets
written, so the full run looks for the right things.

## Files

```text
SITE.md            the owner's rules: niche, area, audience, what matters here
fields.yaml        what to look for in this niche, agreed on the sample
log.md             append-only: what each pass read, wrote and changed
companies.csv      every business found, with its source, website, locations and state
raw/<company>/
  site/            tt-crawl's folder, including _index/, images/ and docs/
  facebook/  instagram/  linkedin/  ads/  reviews/   vendor results, as saved
  matches.json     which profiles were confirmed as this company, and why
records/           <company>.md: one company's facts and their evidence
aliases.yaml       names that are one thing: services, brands, guarantees
data/              built by script: companies, services, guarantees, brands, offers, keywords,
                   areas, statistics; JSON for the site, one file per filterable list
content/           what AI writes: deep dives, guides
src/  styles/  static/  the site: Hono templates, Tailwind, charts, map
scripts/           the pipeline's and the site's scripts, all Node
.claude/skills/    one skill per kind of AI work; Codex sees them too
.taskandtool/setup.sh  dependencies and the web service; after-setup.sh adds tt-crawl and overturemaps
starter-app.json   the manifest: `ready` is the web service, `needs` suggests connections
```

`companies.csv`, `raw/`, `records/`, `data/` and `content/` are the owner's working knowledge. As in Company
Brain, they stay out of the app's git repository and come back from platform backups on a replacement machine.

### `fields.yaml`

What a record looks for in this niche. A run proposes it from the sample and the owner edits it, so nothing about
HVAC or dentists is hardcoded:

```yaml
services:
  - replacement: a whole system replaced
  - repair: fixing an existing system
guarantee_kinds: [workmanship, parts, labor, satisfaction, price match, on-time]
offer_kinds: [discount, free estimate, financing, seasonal, bundle, referral]
proof_kinds: [award, certification, license, membership, dealer status, press]
details:
  - brands: which makes they install
  - financing: whether they offer it, and the terms
```

### A company record

Front matter holds what a script reads. A script fills in contact details and ratings from the raw files, so a run
only writes what takes understanding. There is no fixed template for the body, which holds anything worth knowing
beyond this.

```yaml
---
name: Example Heating & Air
website: https://example.com
crawled: 2026-11-04
locations:
  - { address: "...", lat: 30.27, lng: -97.74 }
serves: [Austin, Round Rock]        # only what a source says
scope: local                        # local, national or online, when clear
background:
  summary: Family-run since 1998, three generations, 40 staff.
  founded: 1998
  people: [{ name: Maria Lopez, role: owner }]
  evidence: [{ quote: "Serving Austin since 1998", url: https://example.com/about }]
services:
  - { name: replacement, quote: "Full system replacement in one day", url: https://example.com/replacement }
guarantees:
  - kind: labor
    length: lifetime
    covers: labor on new installs
    conditions: annual maintenance plan required
    whose: company                  # company or manufacturer
    quote: "Lifetime labor guarantee with any maintenance plan"
    url: https://example.com/warranty
offers:
  - kind: discount
    title: $500 off a new system
    ends: 2026-12-31
    conditions: installs over $8,000
    source: facebook_ad             # site, facebook_post, instagram_post, facebook_ad, google_ad, review
    quote: "$500 off any new system through December"
    url: https://facebook.com/ads/library/?id=123
brands:
  - { name: Northwind, quote: "We install Northwind and Halvorsen", url: https://example.com/brands }
proof:
  - { kind: award, title: Best of Austin 2025, quote: "...", url: https://example.com/awards }
keywords: [same-day install, family-owned]
reviews:
  praise: [{ theme: on time, words: [on time, punctual], quote: "They showed up exactly when they said" }]
  complaints: [{ theme: slow follow-up, words: [call back], quote: "..." }]
  services: [{ name: replacement, words: [replaced, new system] }]
media:
  - { file: site/images/team-1.jpg, kind: team, alt: The install crew beside their van, url: https://example.com/about }
---
```

**Guarantees need these details.** "Lifetime warranty" hides a lot: how long, parts or labor, what conditions apply,
and whether it is the company's own or the manufacturer's passed along. That breakdown is what makes them comparable,
and a detail the source leaves out stays out.

## Pages

Most of the site is built by code from the data. AI writes only where an explanation helps.

| Page | URL | Made by | What it does | In search results |
|---|---|---|---|---|
| **Home** | `/` | Code | "What do you need?" search, where you are, ways to browse, popular and new | Yes |
| **Browse hub** | `/companies`, `/offers`, `/services`, `/guarantees`, `/brands`, `/areas`, `/topics` | Code | Each list with counts, filters and a plain hierarchy to walk | Yes |
| **Company** | `/companies/<name>` | Code, from the record | One argument, top to bottom: the promise and a real photo, reviews, offers, guarantees, services, work, people, the request, then where and the details. Cards stay short, "Terms apply" links out where a record holds conditions, and the page's sources are listed together at its foot; a section with nothing to say is left out | With enough real data |
| **Offer list** | `/offers`, `/offers/<kind>` | Code | Offers running now, filterable by service, kind, area, source and ending soon | Yes, while it has live offers |
| **Service** | `/services/<name>` | AI and code | The deep dive: what usually comes with it, what is normal, what to ask, then live statistics and who offers it | Once it passes the publish gate |
| **Guarantee kind** | `/guarantees/<kind>` | Code, with an AI intro | Who offers it, the usual length, who goes further, how the terms compare | Once it passes the publish gate |
| **Brand** | `/brands/<name>` | Code | Who installs it, and where | Once it passes the publish gate |
| **Phrase** | `/topics/<phrase>` | Code | Everyone using a phrase that matters, such as "same-day install" | Once it passes the publish gate |
| **Area** | `/areas/<state>/<city>` | Code | The best-of for the place: the answer, the method line, the ranked list with a reason and a gap per company, the side-by-side table, then everyone there and a map. Ranking is `scripts/rank.mjs` | Only past the gate below |
| **Service in an area** | `/areas/<state>/<city>/<service>` | Code | The same best-of, narrowed to one service | Only past the gate below |
| **X vs Y** | `/vs/<a>-vs-<b>` | Code | Who leads on each fact both state, then the table. Only for rated rivals sharing a service and an area, with 2 or more shared facts | Yes, once built |
| **Alternatives** | `/companies/<name>/alternatives` | Code | Nearby companies that beat it on a stated fact, each with what | With 3 or more |
| **Compare** | `/compare?...` | Code | Up to three companies side by side | No |
| **Search** | `/search?...` | Code | Filtered results; a shareable address | No |
| **What's new** | `/new` | Code | New companies, new offers and ended offers, from the ledger `build-data.mjs` keeps in `.pipeline/seen.json` | Yes |
| **About** | `/about` | Owner and AI | Where the data comes from, what is not verified, how ranking works, how to correct a listing | Yes |

**Every link works both ways:** company to offer to guarantee kind to the other companies with it, and on to brands and
areas. That is the main way to explore.

**Filters:**

- *Companies:* area, distance, stated service area, service, guarantee kind and its details, brand, current offers,
  financing, review rating and count per platform, years in business, has photos.
- *Offers:* kind, service, area, source, ending soon.
- Each only appears when enough companies have that data, and every filtered view has a shareable address.

**Popular and hot.** Before there is traffic, code ranks services by how many companies promote them, offers by how recent
they are, and which are running as ads. Then Search Console (already a connection) shows what people search for, and on-site
searches with no results show what to add next. Reader events through a Worker come last, and calls or comparisons count for
more than clicks, since whatever is at the top gets clicked most.

**Visuals:** charts of how common each guarantee or term is, by code, in the `dataviz` skill's style, plus the map. Each has
a phone layout, and the text stays.

## The site

- **Hono and pre-rendering, from the Website Starter App.** Every page builds to static HTML, served from Cloudflare. The
  machine can sleep while the site serves.
- **Search opens on every page,** with Command K, `/` or the header's button: an instant index by type (`/filters/search.json`: offers, services, guarantees, companies, areas, ZIP codes, brands), with Pagefind adding words inside pages on a built site. `/search` stays for a link or no JavaScript. Service, guarantee, brand and area filtering runs in `static/site.js`.
- **Filters and distance run in the browser** over a small JSON file per list, built by code. A filter appears once 10% of the companies read have that data. One metro area's few hundred
  companies fit easily, so the first version needs no search server.
- **Source text never runs as code.** Pages show text the owner does not control. HTML renders as plain text, a link with a
  scheme other than web, mail or phone goes nowhere, and names lose their angle brackets. `npm run check` fails on anything
  that slips by.
- **A Worker and the project's database for the correction form and quote requests.** Reader events or a much larger area would be next.
- **A company page is a sales page where every claim is true.** A reader sees why to pick this company and how to ask.
  The rules: stars only from a platform's real number, a "free" only where the company says so, a headline and
  checkmarks only as a quote backs them (`pitch`, traced by `check-record.mjs`), a named person only beside a picture that names them. Records still hold every condition and quote; a page shows only the ones a reader needs there. `npm run check` runs `tropes` over the templates and what the AI wrote for a page. The review band shows
  4 and 5 star reviews and says so, with a link to all of them. A complaint shows only as a real trend: 5 or more reviews, at least 5% of those read, from at
  least 50 read. Google's API gives 5 reviews a company, so no complaint shows without a full review source. One unhappy review out of 1,800 never shows as a complaint.
- **Google's terms are unsettled for production.** Google's Places policies require crediting each photo's author and linking each photo and review to Google Maps, and a photo's name can't be cached. As far as checked, the Service Terms cache only coordinates (30 days) and place IDs, and keep Places content to a Google map, while this site builds static pages and draws on OpenFreeMap. So ratings, reviews and photos from Google are fine in a local sample, and need a person to read those terms, and likely a change, before publishing. `images.mjs google` is a fallback for a company with fewer than 6 real pictures of its own, and a page keeps to the rating, the count and a few quotes. Map points come from Overture and ZIP codes from the Census, so neither depends on Google.
- **A record's lists are for a reader.** An offer is one deal a customer could ask for, however many pages repeat it, titled in about 6 words; `check-record.mjs` refuses more than 12, or a title over 10 words. Guarantees keep every sentence in the record, and `src/guarantees.ts` merges them by kind into one card with lines. Kinds in `fields.yaml` are filters and differ by niche; nothing in the code knows any one of them.
- **The first photo has a person in it** when a saved description says one is there, and never a close-up if anything else will do, all from the words the AI saved.
- **Quote requests.** `src/leads.tsx` saves each request first, then sends it to the address the company publishes, with the visitor as reply-to.
  That emails businesses that never signed up, so `forward_leads` in `SITE.md` is off until the owner says yes, and it needs Resend or Postmark. A
  page shows the form only when it can deliver, and call buttons otherwise. `no_leads: true` in a record stops them for one business. Check
  your local rules on unsolicited business email before turning it on.
- **Size.** Cloudflare lists 20,000 files per Worker version on its free plan and 100,000 on paid, 25 MiB per file. Its Workers
  for Platforms page lists no limit. 300 companies at 12 pictures is about 3,600 files, plus pages and Pagefind. Plan for under
  20,000 until a real deploy says otherwise.

## SEO

- Static HTML with a unique title and description, stable URLs, a canonical tag, and a `sitemap.xml` split by page type.
- **A real hierarchy.** Browse hubs lead to areas, services and companies, with breadcrumbs throughout. Google's doorway policy
  contrasts similar pages with a "clearly defined, browseable hierarchy", so this is what we want it to find.
- **Titles from data:** "14 Austin HVAC companies with a lifetime labor guarantee". Each is true and specific because code wrote it.
- **Structured data:** `LocalBusiness` on company pages with `logo`, `image`, `sameAs`, `geo`, `areaServed` and hours. `ItemList` on
  lists. `Article` and `BreadcrumbList` on deep dives.
- **No review or rating markup.** Google says not to aggregate ratings from other sites, and that ratings must come directly from
  users. Ratings show on the page, without the markup.
- **No `llms.txt` and no AI-only markup.** Google says AI features need none. What AI answers quote is the answer first, a table,
  a method line, a real updated date (it moves only when the page's facts do) and sources: the `seo` skill.
- **Brand pages** carry the maker's own warranty terms, quoted from its pages, beside what each installer adds, with independent
  reviews and news. The searches go through ScrapeCreators: DataForSEO's Google results come back as redirect links Google
  throttles, and its Bing results were off-topic.
- **Pictures:** real alt text, sensible sizes, each on a page that explains it.
- **The publish gate is about doorway pages.** Google's policy names pages targeted at specific cities and similar pages closer to
  search results than a real hierarchy. So an area page, or a service in an area, stays `noindex` and out of the sitemap until it has
  enough companies with real data and its own statistics. A page differing only by city name never qualifies. Filter, search and
  compare pages are never indexed.
- **A company page with only a name and address stays out of search.**
- **Release in waves.** The strongest deep dives and lists first, then more as they prove themselves in Search Console.
- `npm run check` tests all of this before a deploy, and `tt-crawl audit` tests the live site.

## On the machine

The app runs on its sprite, like every Starter App. The repository is the app, cloned to `~/app`. Dev is the `web` service on the team
address. Production is `npm run deploy`, and only a person can make it public.

### Scripts

Five the AI runs, all Node, each one command per workflow, following the `agent-scripts` skill: usage, plain output, exit codes, tests, and
the `data` skill's `cli.mjs` for arguments and errors. They reach vendors through the gateway and the platform through the bridge's
commands. A failure names the fix: the file and line, what is wrong, and what to write or run instead.

| Script | Does |
|---|---|
| `companies.mjs` | `find`: a niche and area from Overture, an import or a connection, duplicates removed, then counts and an estimate. `crawl`: pending sites through `tt-crawl`. `gather`: every other source the owner has connected, confirming each match, with `--confirm` since it spends credits. `refresh`: what is due again. All resume after a stop |
| `pipeline.mjs` | The state of everything. `status`: what is pending at each stage. `queue`: what to work on, such as `--sample 20`, `--all` or `--pages`. `next`: claims one item with a lock, so jobs never take the same one. `done`: marks it. `tick`: see below |
| `check-record.mjs` | Every quote appears in its cited raw file, ignoring case and spacing. URLs are from this company's sources. Field values are in `fields.yaml`. A quote from `_index/common.md`, the text every page repeats, may cite any page. Dates are real. Pictures exist. Nothing comes from a source `matches.json` holds or rejects |
| `build-data.mjs` | Everything in `data/`: lists, links both ways, areas, statistics and rankings, applying aliases. Fills contact details and ratings into `data/`, leaving records as the AI wrote them, keeps each company's and offer's first-seen date in a ledger, since a re-read would lose it from a record, resizes pictures, retires expired offers, decides which pages pass the publish gate |
| `scripts/check.mjs` | `npm run check`, adapted from the Website app: links, orphans, the publish gate, SEO, quotes traced to `raw/`, `tropes` on AI-written text, no private text and no unsafe HTML or links in `dist/` |

Behind them: `lib.mjs` (files, the CSV, the lock, the bridge), `merge.mjs`, `gather.mjs`, `evidence.mjs` and `geo.mjs`; and the usual site scripts (`build.ts`, `dev.mjs`, `content.mjs`, `migrate.ts`, `test.mjs`, `forms`, `apply-design.mjs`). `web_photos.py` is a copy from the `brand` skill, the one file this app needs of it.

### Skills

Codex is the agent we build on. Skills live in `.claude/skills/`, and each turn links them so Codex and Claude Code both see them. Each stays
short and holds only what takes judgment. It is written with the `agent-instructions` skill and tested against a bare prompt.

| Skill | When | What it covers |
|---|---|---|
| `read-company` | One company at a time | Reading everything gathered, writing the record with evidence, sorting pictures |
| `tidy-names` | After a batch of companies | `fields.yaml` on the sample, merging names in `aliases.yaml` |
| `write-guide` | One deep dive or guide at a time | The writing standard, using the statistics, attribution |
| `cross-check` | Before a first deploy and in the audit | Spot-checks, missing links, Search Console |
| `site` | Changing how the site works | Templates, filters, map, charts, SEO |

`tropes` and the Website app's `design` skill (with its `design/system.yaml` record) are copied, and `forms` and `data` for the correction form.
The shared `writing` skill does not fit: it writes business copy from one owner's facts.

Starting a niche is mostly running scripts, so it gets no skill. AGENTS.md routes that ask to `PROCESS.md` Part 1, routes other asks to the right
skill, and lists each script in one line.

### Answering in chat

The owner can ask about the market. The AI answers from `data/` and `records/`, and an answer that took real synthesis can become a guide through
`write-guide`, under the same checks.

### Manifest

`starter-app.json` suggests the `scrapecreators`, `google-places` and `dataforseo` connections, and shows suggestions in an empty chat based on which
files exist: choose a niche while `companies.csv` is missing, write guides once `data/` exists and `content/` has none, and deploy once pages exist.

### Scheduled jobs

Facts from `Workers.RunScheduledJob`, `Jobs` and the `schedule-job` skill that shape this design:

- A command job can use the gateway and the bridge, but not AI, because the AI token exists only during a turn. It gets 30 minutes and keeps 10,000
  characters of output.
- A prompt job opens a new chat each run and lasts until the turn ends. It uses the app's model.
- **An app runs 3 jobs at once, counting commands and prompts together.** A job over that waits and tries again each minute. A job never overlaps
  itself.
- A recurring job runs at most every 15 minutes. An app holds 25 recurring jobs.
- One-off jobs stay listed on the Jobs tab for good, so one per company would bury it.
- When computer time or AI credit runs out, runs are skipped and Jobs says why.

So AI work runs as a few recurring jobs that each take the next item, and one command job runs the machinery:

| Job | Type | When | Does |
|---|---|---|---|
| Run the pipeline | Command | Every 15 minutes, only while work is queued | `pipeline.mjs tick` |
| Read next company | Prompt, 2 copies | Every 15 minutes, only while companies are queued | `pipeline.mjs next company`, then `read-company` |
| Write next guide | Prompt, 1 | Every 15 minutes, only while guides are queued | `pipeline.mjs next guide`, then `write-guide` |
| Refresh offers | Command | Monthly, or weekly if the owner wants | `companies.mjs refresh --offers`: ads and recent posts. Companies with new offers are queued |
| Refresh everything | Command | Quarterly | `companies.mjs refresh --all`: sites, profiles, reviews. Companies with changes are queued |
| Rebuild data | Command | Daily, once deployed | `build-data.mjs` retires expired offers. Deploying stays the owner's. Each offer's expiry also runs in the browser, so one past its date comes off a page built before then |
| Find new businesses | Command | Quarterly | `companies.mjs find`; new ones wait until a person queues them, since reading them spends money |
| Site health | Command | Weekly, once deployed | `tt-crawl audit`. A failure shows on Jobs and in Activity, with no AI |
| Audit | Prompt | Monthly | The `cross-check` skill; each run costs a full AI turn |

**`pipeline.mjs tick`** moves the queue along with no AI. It carries on a refresh that outlasted its job, from a saved list of what is finished, so no company is paid for twice. It crawls and gathers what is pending (stopping before the job's 30 minutes), adds the read
jobs when companies are ready, rebuilds `data/` when reading finishes, queues the guides new data touched, adds the write job, removes each job when its
queue is empty, appends to `log.md`, posts activity, schedules itself when work arrives without a queue, as from a refresh, and removes itself when nothing is left. It only works through what was queued, so a person's
`pipeline.mjs queue` is the gate before a sample or a whole area.

Two read jobs at 15-minute ticks handle up to 8 companies an hour, about 38 hours for 300 companies, and leave a slot for `tick`. The machine sleeps between
runs, and deleting the jobs stops everything at once.

## Cost

Measured on 13 HVAC companies with `read-company` at medium effort: about 55,000 tokens each, from 20,000 for a company with no site to 84,000. At the
prices in `lib/task_tool/ai/pricing.ex`, before any cache discount, that is about **$0.15 to $0.20 a company on GPT-6.1 Sol, or $45 to $60 for 300**.

**Sol is the model to use.** On one company, the same skill found 19 offers and 12 usable pictures on Sol, and 4 offers and 1 picture on GPT-6 Luna, which also filed a
24-hour response promise under the wrong kind. Luna is far cheaper and passes `check-record`, because that check proves a quote exists and not that the
record is complete. The evidence is two companies in one niche, so test again where a niche's sites read very differently.

**Gathering** runs about 10 ScrapeCreators credits per company across Facebook, Instagram, LinkedIn and both ad libraries, or about 3,000 credits for 300
companies. Its price per credit is reported at $1.88 to $5 per 1,000, so about $6 to $15. Full review sets through `dataforseo` add to that, priced
per review or per run. The estimate step reports the real figure before anything is spent.

Crawling costs machine time and no AI. Refreshing only re-reads companies with changes. Company and list pages cost no AI at all, so a large site stays cheap.
The expensive pages are the few deep dives, at about $0.10 each on Sol.

## Build order

Each step ends with something we can look at before starting the next. Steps 1 to 5 run in a folder on a computer with `codex exec`; only steps 6 and 8 need a real
machine.

1. **Find, crawl and gather.** `companies.mjs` on one niche and one area, then about 10 companies across every source. Look at: is the list right, are the matches
   right, and how much did each source actually add?
2. **Read by hand.** The `read-company` skill on those companies, next to a bare prompt. Look at: did it find guarantees, offers, proof and background, did it keep
   conditions, did it sort pictures well, and does the skill beat the bare prompt? Everything rests on this step.
3. **Check.** `check-record.mjs`, and a person comparing a few records with the real sources. Look at: what is missed or misread, then fix the skill.
4. **Data and areas.** `fields.yaml`, `tidy-names`, `build-data.mjs`, area boundaries. Look at: are the statistics interesting, do companies fall in the right areas,
   and do the figures hold up?
5. **One company page and one deep dive from markdown.** With no site yet. Look at: would someone about to hire find it useful?
6. **Site.** Company, offer, browse and area pages, filters, Pagefind, SEO, `npm run check`, deployed to the team.
7. **Visuals.** Charts and the map.
8. **Jobs.** `pipeline.mjs`'s `next`, `done` and `tick`, and the recurring jobs, on a real machine with a small area.
9. **Packaging.** The correction form, `setup.sh`, `starter-app.json`, AGENTS.md, the repository and the listing.

## What the first sample answered

Thirteen HVAC companies north of Austin, in November 2026.

1. **What each source adds.** Not known beyond the site and the Google listing: no ScrapeCreators or DataForSEO key was held, so those paths ran only against a fake gateway built from the vendors' docs. Run them on a real sample before relying on them.
2. **Match rates.** Google listings: 11 of 13 matched by phone or site, one held for a phone mismatch and one naming a different site. Social and ad matches are unmeasured for the same reason.
3. **Crawl depth.** Of 12 sites, 10 gave real pages at a limit of 40, one refused the crawler and one rendered almost nothing. An independent check of two records found the misses came from reading, not from pages left uncrawled, but a larger site may still hold more past the limit. How long a site takes wasn't measured.
4. **Overture's coverage.** 134 HVAC businesses in the box, 117 with a website. Whether it finds every small business hasn't been checked against another list.
5. **Overture, checked.** Its Places theme holds about 88 million places, roughly 60 million from Meta, then BrightQuery, Microsoft, Foursquare and others. Its own guide warns of "duplicates, a high junk rate, and low property completeness". `confidence` is only the likelihood a place exists. Monthly releases stay up 60 days. So it finds who may exist; a read or a Google lookup decides who belongs. On this sample Google's types don't settle it: nearly every HVAC company is a `general_contractor`, with no HVAC type, though its operating status and a clearly wrong type (pest control) still help.
6. **The publish gate's numbers.** Left at their defaults: 163 of 230 pages passed on 13 companies. Tune them on a whole area, where most pages carry more companies.
7. **Is there enough here?** Yes for this niche: 10 of 13 companies publish a guarantee and an offer, and 79 offers were live on one day.

Text only inside a picture, such as a warranty badge, stays out, because a record's facts need a quote a script can trace.

Two lessons for running `codex exec` in a script: close stdin (`</dev/null`), or it waits forever when the prompt is an argument, and give each comparison run its own working folder, since it works wherever it starts.
