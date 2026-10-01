import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { blogCatalog } from '../src/content/blog/catalog';
import {
  buildArchitectureMetadata,
  buildArticleMetadata,
  buildBlogIndexMetadata,
  renderMetadataHead,
  siteOrigin,
} from '../src/features/seo/pageMetadata';

type RenderRoute = (url: string) => Promise<string>;

export interface PrerenderOptions {
  outputDir: string;
  template: string;
  render: RenderRoute;
}

export const blogPrerenderRoutes = [
  '/blog',
  ...blogCatalog.map((article) => `/blog/${article.slug}`),
] as const;

export const publicPrerenderRoutes = ['/architecture', ...blogPrerenderRoutes] as const;

const robotsPolicy = `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function metadataForRoute(route: string) {
  if (route === '/architecture') return buildArchitectureMetadata('en');
  if (route === '/blog') return buildBlogIndexMetadata('en');

  const slug = route.slice('/blog/'.length);
  const article = blogCatalog.find((candidate) => candidate.slug === slug);
  if (!article) throw new Error(`Cannot prerender unknown blog route: ${route}`);
  return buildArticleMetadata(article, 'en');
}

export function buildPrerenderedDocument(
  template: string,
  appHtml: string,
  route: string,
): string {
  const metadata = metadataForRoute(route);
  const withoutFallbackMetadata = template
    .replace(/<title(?:\s[^>]*)?>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/i, '');
  const withMetadata = withoutFallbackMetadata.replace(
    '</head>',
    `${renderMetadataHead(metadata)}</head>`,
  );
  const withLanguage = withMetadata.replace(/<html(?:\s+lang=["'][^"']*["'])?/i, '<html lang="en"');
  const rootPattern = /<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>/i;
  if (!rootPattern.test(withLanguage)) throw new Error('Vite template is missing #root');

  return withLanguage.replace(rootPattern, `<div id="root">${appHtml}</div>`);
}

export function generateSitemapXml(): string {
  const entries = publicPrerenderRoutes.flatMap((route) =>
    (['en', 'es'] as const).map((language) => {
      const url = `${siteOrigin}${route}?lang=${language}`;
      const enUrl = `${siteOrigin}${route}?lang=en`;
      const esUrl = `${siteOrigin}${route}?lang=es`;
      return [
        '  <url>',
        `    <loc>${escapeXml(url)}</loc>`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enUrl)}" />`,
        `    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(esUrl)}" />`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(enUrl)}" />`,
        '  </url>',
      ].join('\n');
    }),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

async function writeHtml(path: string, html: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, html, 'utf8');
}

export async function prerenderPublicRoutes({
  outputDir,
  template,
  render,
}: PrerenderOptions): Promise<void> {
  for (const route of publicPrerenderRoutes) {
    const appHtml = await render(`${route}?lang=en`);
    if (!appHtml.trim()) throw new Error(`SSR returned empty HTML for ${route}`);
    const html = buildPrerenderedDocument(template, appHtml, route);
    const relativeRoute = route.slice(1);

    await Promise.all([
      writeHtml(join(outputDir, `${relativeRoute}.html`), html),
      writeHtml(join(outputDir, relativeRoute, 'index.html'), html),
    ]);
  }

  await Promise.all([
    writeFile(join(outputDir, 'sitemap.xml'), generateSitemapXml(), 'utf8'),
    writeFile(join(outputDir, 'robots.txt'), robotsPolicy, 'utf8'),
  ]);
}

async function run(): Promise<void> {
  const projectRoot = resolve(import.meta.dirname, '..');
  const outputDir = join(projectRoot, 'dist');
  const template = await readFile(join(outputDir, 'index.html'), 'utf8');
  const serverEntryUrl = pathToFileURL(join(projectRoot, '.ssr-blog', 'entry-server.js')).href;
  const serverModule = (await import(serverEntryUrl)) as { render: RenderRoute };

  await prerenderPublicRoutes({ outputDir, template, render: serverModule.render });
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  run().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
