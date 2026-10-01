import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { articleDocuments } from './articleDocuments';
import { blogCatalog } from './catalog';
import { canonicalArticles, canonicalBlogAssetPaths, validateBlogContent } from './validation';

const projectRoot = resolve(import.meta.dirname, '../../..');

interface MarkdownNode {
  type: string;
  children?: MarkdownNode[];
  depth?: number;
  value?: string;
}

function nodeText(node: MarkdownNode): string {
  if (typeof node.value === 'string') return node.value;
  return node.children?.map(nodeText).join('') ?? '';
}

function headingOutline(markdown: string): Array<{ depth: number; text: string }> {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MarkdownNode;
  const headings: Array<{ depth: number; text: string }> = [];
  const walk = (node: MarkdownNode): void => {
    if (node.type === 'heading' && node.depth) {
      headings.push({ depth: node.depth, text: nodeText(node) });
    }
    node.children?.forEach(walk);
  };
  walk(tree);
  return headings;
}

function structuralCounts(markdown: string): Record<string, number> {
  const counts = { heading: 0, list: 0, code: 0, image: 0, link: 0 };
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MarkdownNode;
  const walk = (node: MarkdownNode): void => {
    if (node.type in counts) counts[node.type as keyof typeof counts] += 1;
    node.children?.forEach(walk);
  };
  walk(tree);
  return counts;
}

describe('authored blog corpus', () => {
  it('matches the exact canonical four-article matrix', () => {
    expect(blogCatalog.map((article) => ({
      id: article.id,
      slug: article.slug,
      publishedAt: article.publishedAt,
      sourcePostId: article.sourcePostId,
      sourceUrl: article.sourceUrl,
      seriesOrder: article.seriesOrder,
      featured: article.featured,
    }))).toEqual(canonicalArticles);
    expect(blogCatalog.map((article) => article.title.en)).toEqual([
      'I’m Building a Personal AI That Lives on My PC — Here’s What I’ve Learned So Far',
      'I Gave My Local AI a Brain: How I Designed the Orchestration Layer',
      'From 24 Seconds to 2: How I Optimized Response Times in a Self-Hosted AI Assistant',
      'When Your AI Has Photographic Memory But No Understanding: Designing Curiosity-Driven Knowledge Enrichment',
    ]);
    expect(blogCatalog.map((article) => article.seriesOrder)).toEqual([1, 2, 3, 4]);
    expect(blogCatalog.filter((article) => article.featured).map((article) => article.id)).toEqual([
      'juana-build-04',
    ]);
    expect(blogCatalog[3]?.coverAlt).toEqual({
      en: 'Figure: CDKE Architecture — Knowledge Map feeds domain awareness into the Curiosity Loop; the Interest Vector governs what the loop is allowed to investigate; both connect to the underlying RAG pipeline via ingestion, gap detection, and Planner integration.',
      es: 'Figura: Arquitectura de CDKE — Knowledge Map aporta conciencia del dominio al Curiosity Loop; Interest Vector gobierna qué puede investigar el bucle; ambos se conectan con el pipeline RAG subyacente mediante ingesta, detección de vacíos e integración con Planner.',
    });
  });

  it('contains exactly one complete English/Spanish pair for every article', () => {
    expect(articleDocuments).toHaveLength(8);
    for (const article of blogCatalog) {
      const pair = articleDocuments.filter((document) => document.frontMatter.id === article.id);
      expect(pair.map((document) => document.frontMatter.language).sort()).toEqual(['en', 'es']);
      expect(pair.find((document) => document.frontMatter.language === 'en')?.frontMatter.translation)
        .toBe('original');
      expect(pair.find((document) => document.frontMatter.language === 'es')?.frontMatter.translation)
        .toBe('local-reviewed');
    }
  });

  it('keeps headings, lists, code, images, and links structurally aligned in every language pair', () => {
    for (const article of blogCatalog) {
      const english = articleDocuments.find(
        (document) => document.frontMatter.id === article.id && document.frontMatter.language === 'en',
      );
      const spanish = articleDocuments.find(
        (document) => document.frontMatter.id === article.id && document.frontMatter.language === 'es',
      );
      expect(english, `${article.id} English document`).toBeDefined();
      expect(spanish, `${article.id} Spanish document`).toBeDefined();
      expect(structuralCounts(english!.body), article.id).toEqual(structuralCounts(spanish!.body));
    }
  });

  it('uses an ArticleHeader-compatible heading outline without duplicate article titles', () => {
    for (const document of articleDocuments) {
      const article = blogCatalog.find((candidate) => candidate.id === document.frontMatter.id)!;
      const headings = headingOutline(document.body);
      expect(headings.length, `${document.fileName} headings`).toBeGreaterThan(0);
      expect(headings[0]?.depth, `${document.fileName} first heading`).toBe(2);
      expect(headings.some((heading) => heading.depth === 1), `${document.fileName} h1`).toBe(false);
      expect(
        headings.some((heading, index) => index > 0 && heading.depth - headings[index - 1]!.depth > 1),
        `${document.fileName} heading jump`,
      ).toBe(false);
      expect(
        headings.some((heading) => heading.text.trim() === article.title[document.frontMatter.language]),
        `${document.fileName} duplicated title`,
      ).toBe(false);
    }
  });

  it('validates the real authored documents and all canonical local assets', () => {
    const assetPaths = canonicalBlogAssetPaths.map((path) => `public${path}`);
    expect(assetPaths.every((path) => existsSync(resolve(projectRoot, path)))).toBe(true);
    expect(validateBlogContent({ catalog: blogCatalog, documents: articleDocuments, assetPaths }))
      .toEqual({ articleCount: 4, documentCount: 8, imageCount: 11 });
  });

  it('keeps source evidence private and canonical Markdown free of unsafe placeholders', () => {
    expect(existsSync(resolve(projectRoot, 'content/blog/source/medium-feed-2026-09-30.xml'))).toBe(true);
    expect(existsSync(resolve(projectRoot, 'content/blog/source/source-inventory.json'))).toBe(true);
    expect(existsSync(resolve(projectRoot, 'public/content/blog/source'))).toBe(false);
    expect(existsSync(resolve(projectRoot, 'src/content/blog/source'))).toBe(false);

    for (const document of articleDocuments) {
      expect(document.body).not.toMatch(/medium\.com\/_\/stat|[?&]source=rss|<[^>]+>|(?:javascript|data):/i);
      expect(document.body).not.toMatch(/\b(?:TODO|TRANSLATE ME|PLACEHOLDER)\b/);
      expect(document.body).not.toMatch(/!\[[^\]]*\]\(https?:\/\//i);
    }
  });
});
