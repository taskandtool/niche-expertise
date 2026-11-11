# Niche Expertise

An independent guide to one trade in one area, built to rank and to be trusted: HVAC in North
Austin, dentists in Leeds, agencies in Denver. Most directories stop at a name and a star rating.
Every page here answers what a customer asks before they call.

- **Guarantees side by side:** who covers labor, for how long, and on what terms.
- **Offers that are live today:** from websites, social posts and running ads, gone the day they end.
- **Local facts no one else has:** "In Round Rock, 14 of 38 companies publish a labor warranty."
- **The pages people search for:** the best in each town and for each service, "A vs B",
  "alternatives to A", and every brand's warranty beside who installs it.
- **A page per company that sells,** with a way to ask it for a quote.
- **Something to post every week:** what changed on the site, turned into post ideas.

This repository *is* the app. On Task & Tool it is cloned onto the app's own machine; it also runs
anywhere with Node 20, Python 3, [tt-crawl](https://github.com/taskandtool/crawler) and `overturemaps`.

## How it works

Tell the AI the trade and the area. It finds every business, shows you the list and the cost, and
builds a sample of pages for you to judge before it does the rest. From then on the site keeps
itself current: new offers go up, ended ones come down, and new businesses are added each quarter.
Anything that costs money waits for your yes.

Connections, none required: Google Places, ScrapeCreators and DataForSEO. Each has its own terms,
which you accept when you connect it.

## Off Task & Tool

`npm install && npm run dev` serves the site, and `npm run build` writes `dist/` and
`build/worker.mjs` (`wrangler.jsonc` deploys them to your own Cloudflare account). Set `DATABASE_URL`
to a Neon database for the contact form; without it the form page says where to write instead.
Gathering what the guides are built from, the pictures and the scheduled runs are Task & Tool's: they
call the connections above through its gateway and run from its scheduler.

## Developing

`npm test` runs the scripts' tests. `npm run dev` serves on localhost:3000.
`npm run check` tests what a visitor would get, and `npm run check -- --built` the built site too.
`SITE_ROOT=<folder>` keeps a sample's working data apart from the code. `PROCESS.md` and
`ARCHITECTURE.md` are for whoever works on the app.

Your data (`companies.csv`, `raw/`, `records/`, `data/`, `content/`, `posts/`) stays out of git and
comes back from backups on a new machine. A pre-push secret scan guards this repository, which holds
no credentials by design.

## License

MIT. See `LICENSE`.
