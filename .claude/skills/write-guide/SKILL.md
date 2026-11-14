---
name: write-guide
description: "Writes one deep dive or guide for a service or guarantee kind: what usually comes with it, what is normal here, what varies and what to ask before hiring, with figures the build fills in. Use after pipeline.mjs next guide, or when asked to write or rewrite a guide. Not for company pages (code builds those)."
---

# Write one guide

Done when `content/<kind>/<slug>.md` exists (`kind` is `service` or `guarantee`), `npm run
check` finds nothing in it, and `node scripts/pipeline.mjs done guide <slug>` has marked it.

Read `SITE.md` first, then this item's entry in `data/services.json` or
`data/guarantees.json` and the records of the companies in it. Below your words, the page
already lists who offers what. Don't repeat that list. Write what a list can't say: what
usually comes with this, what is normal here, what varies, and what to ask before hiring.

- **Never write a number about this market.** Use the placeholders the build fills from
  data: `{{count}}` of `{{total}}` companies, `{{percent}}%`, and for a service
  `{{with_price}}`, for a guarantee `{{with_conditions}}`. The check fails on any digit that
  describes this market. With placeholders, the figures stay current.
- **Write for someone about to hire.** Say who offers what ("several companies here…"). Never write "records", "recorded", "claims" or "published": they are words for our method and mean nothing to the reader.
- **Use what the records say, and explain the trade plainly.** General knowledge of the trade is fine if it is true everywhere and helps a reader decide. Never claim a
  law, a price or a standard you can't source.
- **Name no company as better.** Link to one only to show a term.
- 300 to 700 words, under two to four `##` headings. Start with what the reader wants to know.

Draft: "When it comes to choosing an installer, a solid guarantee is a crucial factor that offers peace of mind." <!-- tropes-allow -->

Rewrite: "A labor guarantee covers the installer's work. The manufacturer's warranty covers the parts. {{count}} of {{total}} companies here guarantee their labor for more than a year. Before you hire, ask whether the guarantee needs a yearly service to stay valid."

`npm run check` runs the shared `tropes` scan over the guide. Fix the specific thing it names.
