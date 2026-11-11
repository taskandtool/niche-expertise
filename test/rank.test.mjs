import { test } from "node:test";
import assert from "node:assert/strict";
import { alternatives, gaps, lengthMonths, marketOf, monthsLabel, ranked, standouts, versus } from "../scripts/rank.mjs";

const TODAY = "2026-06-15";
const GATE = { list_companies: 3, rating_reviews: 20, rating_prior: 50, versus_fields: 2 };

/** A built company, as build-data makes one, with only what ranking reads. */
function co(slug, { rating, count, guarantees = [], offers = [], services = ["repair"], priced = false, founded, area = "/areas/tx/round-rock", serves = [], index = true } = {}) {
  return {
    slug,
    name: slug.replace(/-/g, " "),
    path: `/companies/${slug}`,
    index,
    ratings: rating ? [{ platform: "Google", rating, count }] : [],
    guarantees: guarantees.map(([kind, length]) => ({ kind, length })),
    offers: offers.map((title) => ({ title })),
    services: services.map((name) => ({ name, price: priced ? "from $89" : null })),
    background: founded ? { founded } : null,
    locations: [{ areas: area ? [area] : [] }],
    serves: serves.map((a) => ({ area: a })),
  };
}

test("a guarantee's length reads as months from the first length it states", () => {
  assert.equal(lengthMonths("10 years for qualifying new installations"), 120);
  assert.equal(lengthMonths("10–12 years for registered mini-splits"), 120);
  assert.equal(lengthMonths("Ten year labor warranty"), 120);
  assert.equal(lengthMonths("6 months"), 6);
  assert.equal(lengthMonths("15 days"), 0.5);
  assert.equal(lengthMonths("Limited lifetime"), Infinity);
  assert.equal(lengthMonths("3-hour service window"), null, "hours are not a length");
  assert.equal(lengthMonths("call our phone line"), null, "no number inside a word");
  assert.equal(lengthMonths(null), null);
  assert.equal(lengthMonths("forty-five days"), null, "a compound number we can't read is no length, never 5 days");
  assert.equal(lengthMonths("1 year labor; lifetime on the heat exchanger"), 12, "the first length stated wins");
  assert.equal(lengthMonths("labor for the lifetime of your membership"), null, "a membership's lifetime is not for life");
  assert.deepEqual([Infinity, 120, 12, 6, 0.5].map(monthsLabel), ["lifetime", "10 years", "1 year", "6 months", "15 days"]);
  assert.deepEqual(["45 days", "365 days"].map((t) => monthsLabel(lengthMonths(t))), ["45 days", "365 days"], "days that aren't whole months stay days");
});

test("a best-of puts companies based in the area first, then weights rating toward more reviews", () => {
  const list = [
    co("larkspur-heating", { rating: 4.9, count: 400 }),
    co("tiny-five", { rating: 5.0, count: 25 }),
    co("too-few", { rating: 5.0, count: 12 }),
    co("fernway-air", { rating: 4.8, count: 900, area: "/areas/tx/far-town", serves: ["/areas/tx/round-rock"] }),
    co("unread", { rating: 5.0, count: 999, index: false }),
    ...["4.3", "4.4", "4.5"].map((r, i) => co(`listed-${i}`, { rating: Number(r), count: 100, index: false })),
  ];
  const market = marketOf(list, GATE, TODAY);
  assert.ok(market.mean < 4.8, "a market's average, as real ones run");
  const outside = co("pin-outside", { rating: 4.0, count: 50, area: "/areas/tx/county" });
  outside.locations[0].city = "Round Rock";
  const withPin = ranked([...list, outside], market, "/areas/tx/round-rock", "Round Rock");
  assert.ok(withPin.includes("pin-outside") && withPin.indexOf("pin-outside") < withPin.indexOf("fernway-air"), "a Round Rock address counts as based there");
  assert.deepEqual(ranked(list, market, "/areas/tx/round-rock"), ["larkspur-heating", "tiny-five", "too-few", "fernway-air"], "4.9 from 400 beats 5.0 from 25; 12 reviews is under the floor; not based here comes after; a company past no gate is out");
  assert.deepEqual(ranked(list, market), ["larkspur-heating", "tiny-five", "fernway-air", "too-few"], "without an area, a company that only serves it is no longer pushed down");
});

test("standouts and gaps come from facts measured against the companies read", () => {
  const filler = Array.from({ length: 6 }, (_, i) => co(`filler-${i}`, { guarantees: [["labor", "1 year"]] }));
  const larkspur = co("larkspur-heating", { rating: 4.9, count: 400, guarantees: [["labor", "10 years"], ["no-breakdown", "1 year"]], offers: ["$500 off"], founded: 1980 });
  const listed = Array.from({ length: 50 }, (_, i) => co(`listed-${i}`, { services: [], index: false }));
  const all = [larkspur, ...filler, co("quiet", { services: ["repair"] }), ...listed];
  const market = marketOf(all, GATE, TODAY);
  assert.equal(market.guarantees.labor.standardLabel, "1 year");
  assert.equal(market.guarantees.labor.of, 8, "only read companies count");
  assert.deepEqual(
    standouts(larkspur, market, TODAY).map((s) => s.kind),
    ["longer-guarantee", "rare-guarantee", "most-reviewed", "offer"],
  );
  assert.deepEqual(standouts(larkspur, market, TODAY)[0], { kind: "longer-guarantee", guarantee: "labor", length: "10 years", standard: "1 year" });
  assert.deepEqual(gaps(larkspur, market), ["no-prices"]);
  assert.deepEqual(gaps(co("quiet"), market), ["no-prices", "no-guarantee", "no-rating"]);
});

test("a vs page needs two rated companies sharing a service, an area and enough facts; a pair is one page", () => {
  const larkspur = co("larkspur-heating", { rating: 4.9, count: 400, guarantees: [["labor", "10 years"]] });
  const fernway = co("fernway-air", { rating: 4.7, count: 300, guarantees: [["labor", "1 year"]] });
  const elsewhere = co("far-cooling", { rating: 4.8, count: 300, guarantees: [["labor", "1 year"]], area: "/areas/tx/far-town" });
  const unrated = co("no-stars", { guarantees: [["labor", "1 year"]] });
  const thin = co("thin-facts", { rating: 4.6, count: 50 });
  const list = [larkspur, fernway, elsewhere, unrated, thin];
  const pairs = versus(list, marketOf(list, GATE, TODAY), GATE, TODAY);
  assert.deepEqual(pairs, [{
    path: "/vs/fernway-air-vs-larkspur-heating",
    companies: ["fernway-air", "larkspur-heating"],
    fields: ["rating", "guarantees"],
    ahead: [{ field: "rating", slug: "larkspur-heating" }, { field: "guarantee", slug: "larkspur-heating", guarantee: "labor", length: "10 years", other: "1 year" }],
  }]);
});

test("alternatives list who beats a company on something stated, and need enough of them", () => {
  const target = co("larkspur-heating", { rating: 4.5, count: 100, guarantees: [["labor", "1 year"]] });
  const list = [
    target,
    co("fernway-air", { rating: 4.9, count: 300 }),
    co("northgate-hvac", { guarantees: [["labor", "10 years"]] }),
    co("summit-air", { offers: ["Free estimate"] }),
    co("no-better", { rating: 4.0, count: 100 }),
  ];
  const market = marketOf(list, GATE, TODAY);
  const mine = alternatives(list, market, GATE, TODAY).find((a) => a.slug === "larkspur-heating");
  assert.equal(mine.path, "/companies/larkspur-heating/alternatives");
  assert.deepEqual(mine.companies.map((x) => x.slug), ["fernway-air", "summit-air", "northgate-hvac"]);
  assert.deepEqual(mine.companies.find((x) => x.slug === "northgate-hvac").why, [{ kind: "longer-guarantee", guarantee: "labor", length: "10 years", theirs: "1 year" }]);
  assert.equal(mine.index, true);
  const short = alternatives(list.slice(0, 3), market, GATE, TODAY).find((a) => a.slug === "larkspur-heating");
  assert.equal(short.index, false, "two is under the gate");
  const vague = co("vague-air", { guarantees: [["labor", "Labor guaranteed"]] });
  const longer = co("long-labor", { guarantees: [["labor", "10 years"]] });
  const theirs = alternatives([vague, longer], marketOf([vague, longer], GATE, TODAY), GATE, TODAY).find((a) => a.slug === "vague-air");
  assert.deepEqual(theirs.companies, [], "a guarantee stated without a length is still one it has");
});
