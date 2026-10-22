import { mkdir, rm, writeFile, copyFile } from 'node:fs/promises';
import { loadGames, publicData } from '../src/data.mjs';
import { home, detail, guide, shell } from '../src/render.mjs';
const data = (await loadGames()).map(publicData);
const out = new URL('../dist/', import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(new URL('games/', out), { recursive: true });
await mkdir(new URL('data/', out), { recursive: true });
await mkdir(new URL('assets/', out), { recursive: true });
await writeFile(new URL('index.html', out), home(data));
await writeFile(new URL('guide.html', out), guide());
await writeFile(new URL('404.html', out), shell('Page not found — Gaming Lab', '<section class="empty"><h1>404</h1><p>This page is not in the library.</p><a class="button" href="/">Back to the library</a></section>'));
for (const b of data) {
  await writeFile(new URL(`games/${b.game.slug}.html`, out), detail(b, data));
  await writeFile(new URL(`data/${b.game.slug}.json`, out), JSON.stringify(b, null, 2));
}
for (const file of ['style.css', 'client.js', 'favicon.svg']) await copyFile(new URL(`../src/${file}`, import.meta.url), new URL(file, out));
await copyFile(new URL('../src/settings.svg', import.meta.url), new URL('assets/settings.svg', out));
await writeFile(new URL('robots.txt', out), 'User-agent: *\nAllow: /\n# Experimental site; every page has noindex via HTML and HTTP headers.\n');
console.log(`Built ${data.length} game pages, index, guide, 404 and public JSON. Internal audit data excluded.`);
