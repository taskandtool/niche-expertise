---
name: cross-check
description: "Spot-checks company pages against live sources, reads guides for anything the data doesn't support, finds missing pages and links, and reads Search Console. Use before a first deploy, when asked if the data is right, and for the monthly audit."
---

# Cross-check

Done when what you could fix is fixed and logged, and what needs a person is in one deliverable.

First read the latest `raw/audit/_latest.json` and `git log`-free `log.md` tail. In the monthly job,
stop early if nothing has changed and nothing is wrong.

1. **Spot-check.** Pick ten companies at random from `data/companies.json`. For each, open a few facts'
   `url` and compare: guarantee conditions, whether an offer is current, whose a warranty is. A misread is
   fixed in the record, and if the skill led to it, in the `read-company` skill too.
2. **Names.** The `tidy-names` skill's "After a batch".
3. **Guides.** Read each in `content/`. Anything the data doesn't support comes out. Add links between related guides.
4. **Missing pages.** `data/guides.json` entries with `enough: true` and no file: `node scripts/pipeline.mjs queue --pages`.
5. **Search Console** (a connection, if held): which pages are seen, which ignored, what people search for that the
   site doesn't answer, and where thin pages hurt. `SITE.md`'s `gate` numbers are the owner's to change.
6. **Report.** One `python3 ~/tools/taskandtool.py post-activity` line for what changed, one deliverable for what
   needs a person (the work skill).

A business's correction or removal comes in through the `contact` form: `node scripts/forms.mjs submissions --form contact`.
A business that wants no quote requests gets `no_leads: true` in its record. A person decides each. A correction goes in the record with `corrected: YYYY-MM-DD` on the item, which keeps it through later reads
unless the source changes. A removal: set the company's `state` to `removed` in `companies.csv`. A picture taken down: `node scripts/images.mjs hide <company> <file>`, then `images.mjs apply <company>`.
