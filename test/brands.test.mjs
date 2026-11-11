import { test } from "node:test";
import assert from "node:assert/strict";
import { folder } from "./fixture.mjs";

/** A built brand with its maker's warranty page and one review search, gathered. */
function gathered() {
  const f = folder();
  f.put("data/brands.json", [{ name: "Northwind", slug: "northwind", path: "/brands/northwind", count: 3, index: true, companies: [] }]);
  f.put("raw/brands/northwind/brand.json", { name: "Northwind", searched: "2026-06-01", site: "https://www.northwind.example", pages: 1 });
  f.put("raw/brands/northwind/site/pages/warranty.md", '---\nurl: "https://www.northwind.example/warranty"\ntitle: "Warranty"\n---\n\n- 10 years on covered components\n\nRegister within 60 days of installation.\n');
  f.put("raw/brands/northwind/search/reviews.json", { query: "Northwind HVAC reviews", items: [{ title: "Northwind heat pump review", url: "https://homeguide.example/northwind", where: "homeguide.example", snippet: "" }] });
  f.put("raw/brands/northwind/search/reviews.md", "# Google: Northwind HVAC reviews\n\n## Northwind heat pump review\nurl: https://homeguide.example/northwind\nwhere: homeguide.example\n");
  return f;
}

const record = (body) => `---\nname: Northwind\nsite: https://www.northwind.example\n${body}\n---\n`;

test("brands list says what is gathered and read for each brand", async () => {
  const f = gathered();
  const r = await f.run("brands.mjs", ["list"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Northwind \(northwind\): 3 installers; gathered 2026-06-01 from https:\/\/www\.northwind\.example, 1 pages; not read/);
});

test("a brand record passes when every quote and link traces to what was gathered", async () => {
  const f = gathered();
  f.put("records/brands/northwind.md", record(`warranty:
  - { covers: parts, length: 10 years, quote: "10 years on covered components", url: "https://www.northwind.example/warranty" }
registration: { days: 60, quote: "Register within 60 days of installation", url: "https://www.northwind.example/warranty" }
reviews:
  - { title: "Northwind heat pump review", url: "https://homeguide.example/northwind", where: homeguide.example }`));
  const r = await f.run("brands.mjs", ["check", "northwind"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 brand records clean/);
});

test("an invented quote, a link the searches never found, or a changed title each fail", async () => {
  const f = gathered();
  f.put("records/brands/northwind.md", record(`warranty:
  - { covers: parts, length: 20 years, quote: "20 years on everything", url: "https://www.northwind.example/warranty" }
reviews:
  - { title: "Best review ever", url: "https://made-up.example/review", where: made-up.example }
  - { title: "A better title", url: "https://homeguide.example/northwind", where: homeguide.example }`));
  const r = await f.run("brands.mjs", ["check", "northwind"]);
  assert.equal(r.status, 1);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /warranty\[0\]: quote not found/);
  assert.match(r.stderr, /reviews\[0\]: https:\/\/made-up\.example\/review is not one the searches found/);
  assert.match(r.stderr, /reviews\[1\]: its title is "Northwind heat pump review"/);
  assert.match(r.stderr, /Try: /);
});

test("gather previews and spends nothing without --confirm, and needs ScrapeCreators", async () => {
  const f = folder();
  f.put("data/brands.json", [{ name: "Northwind", slug: "northwind", path: "/brands/northwind", count: 3, index: true, companies: [] }]);
  const none = await f.run("brands.mjs", ["gather"]);
  assert.equal(none.status, 1);
  assert.match(none.stderr, /ScrapeCreators is not connected/);
  assert.match(none.stderr, /request-connection scrapecreators/);
  f.put("bridge.py", 'import json\nprint(json.dumps({"connections": [{"provider": "scrapecreators", "slug": "sc", "gateway_url": "x"}]}))\n');
  const plan = await f.run("brands.mjs", ["gather"], { TT_BRIDGE: `${f.dir}/bridge.py` });
  assert.equal(plan.status, 0, plan.stderr);
  assert.match(plan.stdout, /1 brands, 3 ScrapeCreators credits/);
  assert.match(plan.stdout, /Nothing was spent. If the owner said yes: node scripts\/brands.mjs gather --confirm/);
  const bad = await f.run("brands.mjs", ["gather", "--brand", "northwind", "--site", "not-a-url", "--confirm"], { TT_BRIDGE: `${f.dir}/bridge.py` });
  assert.equal(bad.status, 2, "a bad --site is refused before any search is paid for");
  assert.match(bad.stderr, /--site is the maker's address/);
});
