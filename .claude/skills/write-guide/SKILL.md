---
name: write-guide
description: "Writes one deep dive or guide for a service or guarantee kind: what usually comes with it, what is normal here, what varies and what to ask before hiring, using the build's figures. Use after pipeline.mjs next guide, or when asked to write or rewrite a guide. Not for company pages, which code builds."
---

# Write one guide

Done when `content/<kind>/<slug>.md` exists (`kind` is `service` or `guarantee`), `npm run
check` finds nothing in it, and `node scripts/pipeline.mjs done guide <slug>` has marked it.

Read `SITE.md` first, then this item's entry in `data/services.json` or
`data/guarantees.json` and the records of the companies in it. The site shows the list of
who offers what under your words, so don't repeat it. Write what the list can't say: what usually
comes with this, what is normal here, what varies, and what to ask before hiring.

- **You never state a number.** The build fills in figures from data: write `{{count}}` of
  `{{total}}` companies, `{{percent}}%`, and for a service `{{with_price}}`, for a guarantee
  `{{with_conditions}}`. The check fails on any digit that describes this market. That keeps the figures current.
- **Write for someone about to hire.** Attribute what companies offer ("several companies here…"). Never write "records", "recorded", "claims" or "published": those words describe our method and mean nothing to the reader.
- **Use what the records say, plus plain explanation of the trade.** General knowledge of the trade is fine if it is true everywhere and helps a reader decide. Never claim a
  law, a price or a standard you can't source.
- **Name no company as better.** Link to one only to show a term.
- 300 to 700 words, under two to four `##` headings, starting with what the reader wants to know.

Draft: "When it comes to choosing an installer, a solid guarantee is a crucial factor that offers peace of mind." <!-- tropes-allow -->

Rewrite: "A labor guarantee covers the installer's work. The manufacturer's warranty covers the parts. {{count}} of {{total}} companies here guarantee their labor for more than a year. Before you hire, ask whether it needs a yearly service to stay valid."

`npm run check` runs the shared `tropes` skill over it. Fix the specific thing it names.
