---
name: read-brand
description: "Reads one equipment brand's gathered pages into records/brands/<brand>.md: the maker's warranty terms with quotes, registration rules, and picked review and news links. Use after brands.mjs gather, or when asked to read or re-read a brand. Not for companies (read-company)."
---

# Read one brand

Done when `records/brands/<brand>.md` exists and `node scripts/brands.mjs check <brand>`
passes. Then run `node scripts/build-data.mjs` to put it on the brand page.

Read `raw/brands/<brand>/site/pages/` and any converted documents (the maker's own
warranty pages), then `raw/brands/<brand>/search/reviews.md` and `news.md`.

```yaml
---
name: Northwind
site: https://www.northwind.example
warranty:
  - { covers: parts, length: 10 years, condition: "registered within 60 days of install", quote: "10-year parts limited warranty when registered within 60 days", url: https://www.northwind.example/warranty }
  - { covers: compressor, length: lifetime, condition: "Elite series only", quote: "Lifetime compressor warranty on Elite series", url: https://www.northwind.example/warranty }
registration: { days: 60, quote: "Register within 60 days of installation", url: https://www.northwind.example/register }
reviews:
  - { title: "Northwind heat pump review: two winters in", url: https://homeguide.example/northwind-review, where: homeguide.example }
news:
  - { title: "Northwind adds a variable-speed line", url: https://hvacnews.example/northwind-line, where: hvacnews.example }
---
```

- **Take warranty terms only from the maker's own pages.** Give each a short exact quote
  and the page it's on. `covers` is the part in plain words; `length` is as the page states
  it; `condition` is there only where the page sets one. If a warranty costs extra, the
  cost is a condition.
- **List the default terms first.** If a term needs registration, say so in `condition`.
  If the page gives the unregistered term, add it as its own line.
- **Pick reviews and news links from the searches only,** never from the maker's own pages,
  forums or ads. Up to 4 of each: independent reviews that test or compare the equipment,
  and news a buyer would care about (a recall, a new line, a warranty change). Copy each
  title exactly as the search shows it. If too few qualify, leave the list out rather than
  pad it.
- Labor coverage the maker sells is a warranty line. Labor coverage an installer gives
  goes on that company's record.
