// What needs a server: the correction form, quote requests and the 404 page. All the Worker
// carries, so it stays small whatever the size of the site. Web APIs only.
import { Hono, type Context } from "hono";
import type { Child } from "hono/jsx";
import { raw } from "hono/html";
import { fromNeon } from "./data/neon";
import { envVar } from "./data/env";
import { embedForm, formRoutes } from "./forms/routes";
import { LEAD_FORM, leadRoutes } from "./leads";
import { Band, render, site } from "./shell";

export const CONTACT_FORM = "contact";

const getDb = (c: Context) => fromNeon(envVar(c, "DATABASE_URL"));
const hasDb = (c: Context) => Boolean(envVar(c, "DATABASE_URL"));

const shell = (path: string, heading: string, body: Child) =>
  render(
    { path, title: heading, description: heading, index: false },
    <Band class="py-section">
      <h1 class="font-display text-display">{heading}</h1>
      <div class="mt-4 max-w-content">{body}</div>
    </Band>,
  );

const app = new Hono();

const forms = formRoutes(getDb, { source: "niche-expertise", page: (c, heading, body) => String(shell(c.req.path, heading, body)) });
app.use("/forms/*", async (c, next) => (hasDb(c) && !c.req.path.startsWith(`/forms/${LEAD_FORM}`) ? next() : c.notFound()));
app.route("/", leadRoutes(getDb, hasDb, shell));
app.route("/", forms);

app.get("/contact", async (c) => {
  const form = hasDb(c) ? await embedForm(c, getDb(c), CONTACT_FORM).catch((e: unknown) => {
    console.error("/contact: the form could not load:", e);
    return null;
  }) : null;
  const heading = "Contact us";
  return c.html(
    shell(
      "/contact",
      heading,
      <>
        <p class="text-lede text-ink-2">Claim your listing, ask for a correction or a removal, or ask us anything. A person reads each one.</p>
        <div class="mt-6">
          {form ?? <p>The form isn't open yet.{site.contactEmail ? <> Write to <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> instead.</> : null}</p>}
        </div>
        {raw(`<script>(function(){var q=new URLSearchParams(location.search);var n=q.get("company");var i=document.querySelector('[name="company"]');if(n&&i&&!i.value)i.value=n;var s=document.querySelector('[name="ask"]');if(q.get("ask")==="claim"&&s)s.value="Claim this listing"})()</script>`)}
      </>,
    ),
  );
});

export const notFoundPage = (c: Context) =>
  c.html(
    shell(
      "/404",
      "That page isn't here",
      <p>
        It may have moved, or an offer may have ended. Try <a href="/companies">the companies</a> or <a href="/offers">current offers</a>.
      </p>,
    ),
    404,
  );
app.notFound(notFoundPage);

export default app;
