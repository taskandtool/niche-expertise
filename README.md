# Niche Expertise

Builds an independent recommendation site for one niche, whichever the owner
chooses: HVAC, dentists, agencies. Most directories hold a name, an address and a
rating. This one gathers everything a person would want to know about each company,
from wherever it is published, and shows it with its source.

- **Comparable guarantees:** length, parts or labor, conditions and whose it is, across a market.
- **Live offers from everywhere:** websites, social posts and running ads. An offer past its date comes down by itself.
- **Local market facts:** "In Round Rock, 14 of 38 companies publish a labor warranty", counted by code.
- **Real proof, with its source:** the company's own pictures, and what customers said and where, each dated.
- **A page that sells, truthfully:** each company gets a focused page with its promise, reviews, offers, guarantees, people and work, all from what it states, and a way to ask it for a quote.
- **The pages people search for:** the best in each town and for each service, "A vs B", "alternatives to A", and each brand's own warranty beside who installs it, each ranked by a method the page states.
- **Links everywhere:** a company leads to its offer, its guarantee, everyone else with it, its brands and its areas.
- **Posts worth sharing:** what changed on the site lately, a new offer or a list that moved, turned into post ideas for the owner's social accounts.

This repository *is* the app. On Task & Tool it is cloned onto the app's own machine; it also runs
anywhere with Node 20, Python 3, [tt-crawl](https://github.com/taskandtool/crawler) and `overturemaps`.

## How it works

Scripts find the businesses (free, from Overture Maps, or your own CSV), crawl their sites and
call whichever sources you have connected, saving everything to files so nothing is paid for twice.
One AI run per company reads what was gathered and writes a record: facts, each with a short exact quote,
which a script traces back to the source. Code builds everything else: statistics, filters, company and area
pages. AI writes only the few guides where an explanation helps. The pages are static, so the machine can sleep while the site serves.

Start by telling the AI which businesses and where. It shows you the list and the cost before spending
anything, reads a sample of about 20 for you to judge, and only then reads the rest. `PROCESS.md` has the
whole run and `ARCHITECTURE.md` the reasoning. Your data (`companies.csv`, `raw/`, `records/`, `data/`,
`content/`, `posts/`) stays out of git and comes back from backups on a new machine.

Sources you can connect, none required: ScrapeCreators (Facebook, Instagram, LinkedIn, TikTok, ad libraries),
Google Places (the listing) and DataForSEO (every Google review). Each has its own terms on storing and
republishing, which you accept when you connect it.

## Developing

`npm test` runs the scripts' tests. `npm run dev` serves on localhost:3000.
`npm run check` tests what a visitor would get, and `npm run check -- --built` the built site too.
`SITE_ROOT=<folder>` keeps a sample's working data apart from the code.

A pre-push secret scan guards this repository. It holds no credentials by design.

## License

MIT. See `LICENSE`.
