import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogCatalog } from '../src/content/blog/catalog';
import { prerenderPublicRoutes } from './prerender-public-routes';

const template = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Fallback</title><link rel="stylesheet" href="/assets/site.css"></head><body><div id="root"></div><script type="module" src="/assets/site.js"></script></body></html>`;

describe('prerenderPublicRoutes', () => {
  it('writes English public routes in both clean URL forms with metadata and body HTML', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'kathesama-prerender-'));

    await prerenderPublicRoutes({
      outputDir,
      template,
      render: async (url) => `<main data-route="${url}"><h1>Rendered ${url}</h1></main>`,
    });

    const routes = [
      '/architecture',
      '/blog',
      ...blogCatalog.map((article) => `/blog/${article.slug}`),
    ];
    for (const route of routes) {
      const relative = route.slice(1);
      const flat = await readFile(join(outputDir, `${relative}.html`), 'utf8');
      const nested = await readFile(join(outputDir, relative, 'index.html'), 'utf8');
      for (const html of [flat, nested]) {
        expect(html).toContain(`<main data-route="${route}?lang=en">`);
        expect(html).toContain('data-kathesama-meta="canonical"');
        expect(html).toContain(`https://kathesama.ar${route}?lang=en`);
        expect(html).toContain('hreflang="es"');
        expect(html).toContain('/assets/site.css');
        expect(html).toContain('/assets/site.js');
      }
      if (route.startsWith('/blog/')) expect(flat).toContain('application/ld+json');
      if (route === '/architecture') {
        expect(flat).toContain('JuanaIA systems atlas | Kathesama');
      }
    }
  });

  it('emits escaped bilingual sitemap alternates and a sitemap-aware robots policy without source artifacts', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'kathesama-prerender-'));

    await prerenderPublicRoutes({
      outputDir,
      template,
      render: async (url) => `<main>${url}</main>`,
    });

    const sitemap = await readFile(join(outputDir, 'sitemap.xml'), 'utf8');
    const robots = await readFile(join(outputDir, 'robots.txt'), 'utf8');
    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(sitemap).toContain('https://kathesama.ar/blog?lang=en');
    expect(sitemap).toContain('https://kathesama.ar/blog?lang=es');
    expect(sitemap).toContain('https://kathesama.ar/architecture?lang=en');
    expect(sitemap).toContain('https://kathesama.ar/architecture?lang=es');
    expect(sitemap).toContain('hreflang="x-default"');
    expect(robots).toContain('Sitemap: https://kathesama.ar/sitemap.xml');

    const publicText = `${sitemap}\n${robots}\n${await readFile(join(outputDir, 'blog.html'), 'utf8')}`;
    expect(publicText).not.toMatch(/<rss|source-inventory|cdn-images-1\.medium\.com|source=rss/i);
  });
});
