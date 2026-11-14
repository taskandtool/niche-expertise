---
name: cross-check
description: "Spot-checks company pages against live sources, reads guides for anything the data doesn't support, finds missing pages and links, and reads Search Console. Use before a first deploy, when asked if the data is right, and for the monthly audit."
---

# Cross-check

Done when what you could fix is fixed and logged, and what needs a person is in one deliverable.

First read `raw/audit/_latest.json` and the end of `log.md`. In the monthly job, stop early if
nothing has changed and nothing is wrong.

1. **Spot-check.** Pick ten companies at random from `data/companies.json`. For each, open a few facts'
   `url` and compare: guarantee conditions, whether an offer is current, whose a warranty is. Fix a
   misread in the record. If the `read-company` skill led to it, fix the skill too.
2. **Names.** The `tidy-names` skill's "After a batch".
3. **Guides.** Read each guide in `content/`. Cut anything the data doesn't support, and add links
   between related guides.
4. **Missing pages.** For `data/guides.json` entries with `enough: true` and no file, run
   `node scripts/pipeline.mjs queue --pages`.
5. **Search Console**, if the connection is held: which pages people see in search and which get no
   impressions, what people search for that no page answers, and which thin pages rank poorly. Only
   the owner changes the `gate` numbers in `SITE.md`.
6. **Report.** One `python3 ~/tools/taskandtool.py post-activity` line for what changed, one deliverable
   for what needs a person (the work skill).

Businesses ask for corrections and removals through the `contact` form:
`node scripts/forms.mjs submissions --form contact`. A person decides each request. Write a
correction into the record with `corrected: YYYY-MM-DD` on the item. It stays through later reads
unless the source changes. For a removal, set the company's `state` to `removed` in `companies.csv`.
If a business wants no quote requests, set `no_leads: true` in its record. To take down a picture,
run `node scripts/images.mjs hide <company> <file>`, then `images.mjs apply <company>`.
