import type { BlogCatalogItem, BlogLanguage } from './types';

const wordsPerMinute = 200;

type Fence = {
  character: '`' | '~';
  length: number;
};

function stripFencedCodeBlocks(markdown: string): string {
  let openFence: Fence | undefined;

  return markdown
    .split(/\r?\n/)
    .map((line) => {
      if (openFence) {
        const closingRun = line.match(/^ {0,3}(`+|~+)[\t ]*$/)?.[1];
        if (
          closingRun &&
          closingRun[0] === openFence.character &&
          closingRun.length >= openFence.length
        ) {
          openFence = undefined;
        }
        return '';
      }

      const opening = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (!opening) return line;

      const run = opening[1]!;
      const character = run[0] as Fence['character'];
      const info = opening[2] ?? '';
      if (character === '`' && info.includes('`')) return line;

      openFence = { character, length: run.length };
      return '';
    })
    .join('\n');
}

function stripInlineCodeSpans(markdown: string): string {
  let result = '';
  let cursor = 0;

  while (cursor < markdown.length) {
    if (markdown[cursor] !== '`') {
      result += markdown[cursor];
      cursor += 1;
      continue;
    }

    const openingStart = cursor;
    while (markdown[cursor] === '`') cursor += 1;
    const openingLength = cursor - openingStart;
    let searchCursor = cursor;
    let closingEnd = -1;

    while (searchCursor < markdown.length) {
      const candidateStart = markdown.indexOf('`', searchCursor);
      if (candidateStart < 0) break;
      let candidateEnd = candidateStart;
      while (markdown[candidateEnd] === '`') candidateEnd += 1;
      if (candidateEnd - candidateStart === openingLength) {
        closingEnd = candidateEnd;
        break;
      }
      searchCursor = candidateEnd;
    }

    if (closingEnd < 0) {
      result += markdown.slice(openingStart, cursor);
      continue;
    }

    result += ' ';
    cursor = closingEnd;
  }

  return result;
}

export function getOrderedArticles(catalog: readonly BlogCatalogItem[]): BlogCatalogItem[] {
  return [...catalog].sort((left, right) => left.seriesOrder - right.seriesOrder);
}

export function getFeaturedArticle(catalog: readonly BlogCatalogItem[]): BlogCatalogItem {
  const featured = catalog.filter((article) => article.featured);
  if (featured.length !== 1) {
    throw new Error(`Expected exactly one featured article, received ${featured.length}`);
  }
  return featured[0]!;
}

export function getArticleNeighbors(
  catalog: readonly BlogCatalogItem[],
  slug: string,
): { previous: BlogCatalogItem | undefined; next: BlogCatalogItem | undefined } {
  const ordered = getOrderedArticles(catalog);
  const index = ordered.findIndex((article) => article.slug === slug);
  if (index < 0) return { previous: undefined, next: undefined };
  return { previous: ordered[index - 1], next: ordered[index + 1] };
}

export function formatBlogDate(publishedAt: string, language: BlogLanguage): string {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-AR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(publishedAt));
}

export function estimateReadingMinutes(markdown: string): number {
  const withoutFrontMatter = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const normalized = stripInlineCodeSpans(stripFencedCodeBlocks(withoutFrontMatter))
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s*/gm, '')
    .replace(/[\\*_~`>#|]/g, ' ');
  const words = normalized.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
