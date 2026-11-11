// The machine entry: static files, then the app. `npm run dev` runs this under a
// watcher beside the Tailwind watcher, so an edit is live on the next refresh.
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono, type Context } from "hono";
import app from "./app";
import { notFoundPage } from "./public";
import { ROOT } from "./data";
import { relative } from "node:path";

const port = Number(process.env.PORT ?? 3000);
const server = new Hono();
// While the site is being built its files change: the browser asks again each time.
const fresh = (_path: string, c: Context) => c.header("Cache-Control", "no-cache");
server.use("/*", serveStatic({ root: "./static", onFound: fresh }));
// The lists the browser filters: the same files the build copies to dist/filters/.
server.use("/filters/*", serveStatic({ root: relative(process.cwd(), `${ROOT}/data`) || ".", rewriteRequestPath: (p) => p.replace(/^\/filters/, ""), onFound: fresh }));
server.use("/media/*", serveStatic({ root: relative(process.cwd(), `${ROOT}/static`) || ".", onFound: fresh }));
server.route("/", app);
server.notFound(notFoundPage);

serve({ fetch: server.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`niche-expertise listening on http://localhost:${info.port}`);
});
