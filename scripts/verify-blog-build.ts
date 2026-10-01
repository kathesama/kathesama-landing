import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { blogCatalog } from '../src/content/blog/catalog';
import { publicPrerenderRoutes } from './prerender-public-routes';

const forbiddenPublicPatterns = [
  { pattern: /<rss/i, label: 'RSS payload' },
  { pattern: /source-inventory(?:\.json)?/i, label: 'source inventory' },
  { pattern: /medium-feed-[^"'\s<]*/i, label: 'Medium feed artifact' },
  { pattern: /cdn-images-1\.medium\.com/i, label: 'remote Medium image' },
  { pattern: /source=rss/i, label: 'RSS source marker' },
  { pattern: /\/_\/stat(?:\b|[/?#])/i, label: 'Medium tracking endpoint' },
];

async function collectTextFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return collectTextFiles(path);
      return /\.(?:html|js|css|json|xml|txt)$/i.test(entry.name) ? [path] : [];
    }),
  );
  return paths.flat();
}

function assertIncludes(content: string, expected: string, file: string): void {
  if (!content.includes(expected)) throw new Error(`${file} is missing ${expected}`);
}

export async function verifyBlogBuild(outputDir = resolve('dist')): Promise<void> {
  for (const route of publicPrerenderRoutes) {
    const relative = route.slice(1);
    const paths = [join(outputDir, `${relative}.html`), join(outputDir, relative, 'index.html')];
    const article = blogCatalog.find((candidate) => route.endsWith(candidate.slug));

    for (const path of paths) {
      const html = await readFile(path, 'utf8');
      assertIncludes(html, '<div id="root">', path);
      assertIncludes(html, 'data-kathesama-meta="canonical"', path);
      assertIncludes(html, `https://kathesama.ar${route}?lang=en`, path);
      assertIncludes(html, 'hreflang="es"', path);
      assertIncludes(html, '/assets/', path);
      const routeClass = article
        ? 'class="article-body"'
        : route === '/architecture'
          ? 'class="architecture-page"'
          : 'class="blog-index-page"';
      assertIncludes(html, routeClass, path);
      if (article) assertIncludes(html, 'type="application/ld+json"', path);
    }
  }

  const sitemap = await readFile(join(outputDir, 'sitemap.xml'), 'utf8');
  const robots = await readFile(join(outputDir, 'robots.txt'), 'utf8');
  assertIncludes(sitemap, '?lang=en', 'sitemap.xml');
  assertIncludes(sitemap, '?lang=es', 'sitemap.xml');
  assertIncludes(sitemap, 'hreflang="x-default"', 'sitemap.xml');
  assertIncludes(robots, 'Sitemap: https://kathesama.ar/sitemap.xml', 'robots.txt');

  const textFiles = await collectTextFiles(outputDir);
  for (const path of textFiles) {
    const content = await readFile(path, 'utf8');
    const forbidden = forbiddenPublicPatterns.find(({ pattern }) => pattern.test(content));
    if (forbidden) throw new Error(`${path} contains forbidden public data: ${forbidden.label}`);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  verifyBlogBuild()
    .then(() => console.log('Public build verified: 6 prerendered routes, sitemap, robots, no source leakage.'))
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
