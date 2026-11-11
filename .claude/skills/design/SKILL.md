---
name: design
description: "Changes the directory's look: the design record, colours, type and spacing. Use for change the look, it looks generic, new colours or fonts. Not for how pages work (site) or a company's facts."
---

# Design

The look is one record, `design/system.yaml`, compiled by `npm run apply-design` into
`styles/theme.css`, `DESIGN.md` and `src/fonts.ts`; it refuses a broken record. Read
`DESIGN.md`, then change the record, never those files. `references/authoring.md` holds its shape.

Markup uses Tailwind utilities in the tokens only: no hex value, no Tailwind default colour,
no classes of the site's own in `styles/`. A value the tokens lack is added to the record.
A company's own colours never come into the page: every page is the directory's.

Done when `npm run check` passes and `tt-crawl shoot /` and `tt-crawl shoot /companies` look
right at both widths, with text legible and nothing cut off. Look at the rendered page, never the code.
