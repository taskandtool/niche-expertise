import { test } from "node:test";
import assert from "node:assert/strict";
import { guideHtml } from "../src/guide.ts";

test("a guide keeps its words and safe links, and loses HTML and unsafe links", () => {
  const html = guideHtml(`## Ask\n\nSee [the list](/services/repair) and [them](https://a.example).\n\n<form action="https://evil.test"><input></form>\n\n<meta http-equiv="refresh" content="0;url=https://evil.test">\n\n[click](javascript:alert(1)) <a href='javascript:alert(2)'>x</a> ![p](https://evil.test/p.png) [far](//evil.test)`);
  assert.match(html, /<a href="\/services\/repair">the list<\/a>/);
  assert.match(html, /<a href="https:\/\/a\.example">them<\/a>/);
  assert.match(html, /click/);
  assert.doesNotMatch(html, /<form|<meta|javascript:|<img|evil\.test/);
});
