import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished portfolio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Aditya Kumar — AI &amp; Backend Software Engineer<\/title>/i);
  assert.match(html, /I build systems/);
  assert.match(html, /scale &amp; heal/);
  assert.match(html, /Work that reached/);
  assert.match(html, /Automated Job Application System/);
  assert.match(html, /href="https:\/\/drive\.google\.com\/file\/d\/1OJ-TCUjlttRgMqDw7UB4nr96Z6fGtAiQ\/view\?usp=sharing"/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.doesNotMatch(html, /Codex is working|Your site is taking shape|codex-preview/i);
});

test("ships the portfolio assets and accessibility fallbacks", async () => {
  const [page, css, layout, resume] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/Aditya_Kumar_Resume.pdf", import.meta.url)),
  ]);

  assert.match(page, /dynamic\(\(\) => import\("\.\/components\/SceneCanvas"\)/);
  assert.match(page, /<main id="main">/);
  assert.match(page, /ReducedMotionFallback/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.core-fallback/);
  assert.match(css, /fallback-sakura/);
  assert.match(layout, /images:\s*\["\/og\.png"\]/);
  assert.equal(resume.subarray(0, 4).toString(), "%PDF");
  await access(new URL("../public/og.png", import.meta.url));
});
