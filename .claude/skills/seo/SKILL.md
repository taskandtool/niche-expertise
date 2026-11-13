---
name: seo
description: "Makes pages rank in Google and get quoted by AI answers (ChatGPT, AI Overviews, Perplexity): titles, the opening answer, best-of lists, X vs Y, alternatives, tables, method lines, dates, structured data, links, which pages exist. Use for search or AI visibility, or a new page type. Not for the look (design)."
---

# Search and AI answers

A page ranks and gets quoted for the same reason: its first lines answer the
search with facts nobody else has put together, laid out so a person or a
model can lift one sentence. Google says AI Overviews and AI Mode need nothing
beyond ordinary SEO. Studies of ChatGPT's local answers find expert best-of
lists among the most cited sources. That is the page this site makes.

Done when `npm run check` passes and the page reads right, cold, to someone
who just searched its title.

## Which pages exist

The gate in `data/pages.json` (built by `scripts/build-data.mjs`) decides which
pages are open to search; never open one by hand. Google's scaled content
policy treats many generated pages that add nothing as spam, and it can take
down the whole site. A page per city, service and brand with nothing to
compare is how sites like this get hit. So a page exists only when its
companies have facts to set side by side.

## Every page

- **Title in the searcher's words, place included:** "Best AC repair in
  Round Rock", "Larkspur Heating vs Fernway Air", "Alternatives to Larkspur
  Heating". The description says what the page compares, with a number.
- **The answer in the first two sentences, with numbers from `data/`:** "Of
  31 HVAC companies in Round Rock, 6 guarantee their labor for more than a
  year. Larkspur Heating and Fernway Air go furthest, at 10 years." Each
  sentence stands alone (no "as above") so it can be quoted alone.
- **A table for anything compared:** the same columns in the same order on
  every page of a kind. A blank reads "not stated".
- **A method line:** what it ranks on, how many companies were checked,
  when. "Ranked by Google rating with at least 20 reviews, then review
  count, among companies with an address in Round Rock. 31 checked, updated
  November 2026."
- **A visible updated date** matching `dateModified`. It changes only when
  the page's facts change. AI answers favour recent pages. A date moved
  without a change is false.
- **Sources on every claim:** a quote links to where it was said, and a
  rating names its platform ("4.8 from 1,240 Google reviews"). Adding
  statistics, quotations and sources raised a page's visibility in AI
  answers by up to about 40% in the GEO study (KDD 2024).
- **In the HTML:** the answer, the table and the ranked list are in the
  pre-rendered page. Filters and the map in `static/site.js` are extras on
  top.
- **Linked both ways:** each row links to the company page. Each company
  page links to the lists, comparisons and alternatives it appears on.
  `npm run check` fails a page nothing links to.

## Best-of lists

Google's guidance on ranked lists: say why each pick is there, with evidence
and measurements, what sets it apart, its drawbacks, who it suits best, and
enough on the list itself to stand alone.

- **The order comes from code,** by the method line, the same method for
  every list of a kind. Never from an AI's judgement.
- **Address first:** for a local search, having an address in the place
  mattered most to whether ChatGPT showed a business. Then rating with depth:
  4.9 from 400 reviews outranks 5.0 from 12, and a rating counts only above
  the build's review floor.
- **One "why" per row, from facts:** "Longest labor guarantee here: 10
  years, where most offer 1." And the honest gap: "No prices posted."
- **"Best for" labels where a fact earns one:** "Best for financing: 0% for
  18 months", "Fastest response: 2-hour promise".
- **No score of ours, and no review or rating markup.** The ranking is an
  order with its reason shown, not a number.

## X vs Y, and alternatives

- **X vs Y** is built only for companies people would weigh against each
  other: the same service and area, both through the gate. The table comes
  first, then a verdict by need: "Larkspur for the longer guarantee, Fernway
  if you want financing." Name an overall winner only when the facts make
  one.
- **Alternatives to X** is for someone who searched a company's name. Give
  X's facts in a line, then the nearby companies that beat it on something
  stated, each with that thing.
- **Guarantees:** "standard" is what at least half the companies offer. Show
  who goes past it, by how much.
- **Brands:** the manufacturer's own terms (warranty length, registration
  rules), cited to its page, then what each installer adds on top. For
  example, Northwind gives 10 years on parts, and Larkspur adds 10 years of
  labor.

## Structured data

`npm run check` fails a page without it, and fails any rating markup.

- `BreadcrumbList` everywhere. `ItemList` on lists. `LocalBusiness` on
  company pages with name, address, phone, url, geo and `sameAs`. `Article`
  with `dateModified` on guides.
- Every field matches the visible text.
- **Never `AggregateRating` or `Review`:** Google forbids marking up ratings
  gathered from other sites, and the ratings here are Google's.
- **Skip `FAQPage`:** Google shows FAQ results only for government and health
  sites. `ItemList` carousels show only for courses, movies, recipes and
  restaurants, but `ItemList` still describes the page.
- No `llms.txt` or other AI files: Google says none are needed.

## What gets a site like this penalized

- A page for a search we have no facts for, or a copy with only the city
  swapped.
- Several near-identical sites run to hide scale (named in Google's spam
  policy). Each niche site uses only its own data.
- Filler an AI wrote to make a page longer. `npm run check` runs the
  `tropes` scan over the copy.

## Measuring

Search Console's Performance report counts AI Overviews and AI Mode with
everything else. Once a month, ask ChatGPT and Perplexity the niche-and-place
question a few times and note the sources under each answer. Answers change
from one ask to the next, so one ask proves nothing. Where the research came
from: `references/sources.md`.
