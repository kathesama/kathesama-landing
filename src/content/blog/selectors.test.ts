import { describe, expect, it } from 'vitest';
import { blogCatalog } from './catalog';
import {
  estimateReadingMinutes,
  formatBlogDate,
  getArticleNeighbors,
  getFeaturedArticle,
  getOrderedArticles,
} from './selectors';

describe('blog selectors', () => {
  it('orders the complete series 1 through 4 and selects only CDKE as featured', () => {
    const shuffled = [blogCatalog[2]!, blogCatalog[0]!, blogCatalog[3]!, blogCatalog[1]!];
    expect(getOrderedArticles(shuffled).map((article) => article.seriesOrder)).toEqual([1, 2, 3, 4]);
    expect(getFeaturedArticle(shuffled).id).toBe('juana-build-04');
  });

  it('returns stable previous and next articles at every series boundary', () => {
    expect(getArticleNeighbors(blogCatalog, 'building-juana-self-hosted-ai')).toEqual({
      previous: undefined,
      next: blogCatalog[1],
    });
    expect(getArticleNeighbors(blogCatalog, 'juana-orchestration-layer')).toEqual({
      previous: blogCatalog[0],
      next: blogCatalog[2],
    });
    expect(getArticleNeighbors(blogCatalog, 'self-hosted-ai-latency-24-to-2')).toEqual({
      previous: blogCatalog[1],
      next: blogCatalog[3],
    });
    expect(getArticleNeighbors(blogCatalog, 'curiosity-driven-knowledge-enrichment')).toEqual({
      previous: blogCatalog[2],
      next: undefined,
    });
  });

  it('formats dates in UTC so the calendar day cannot shift with host timezone', () => {
    expect(formatBlogDate('2026-05-10T00:05:00Z', 'en')).toBe('May 10, 2026');
    expect(formatBlogDate('2026-05-10T00:05:00Z', 'es')).toBe('10 de mayo de 2026');
  });

  it('estimates at least one minute from normalized prose and ignores syntax and fenced code', () => {
    const prose = Array.from({ length: 220 }, () => 'word').join(' ');
    const markdown = `---\nid: "ignored"\n---\n\n## Heading\n\n${prose}\n\n\`\`\`ts\n${'code '.repeat(500)}\n\`\`\``;
    expect(estimateReadingMinutes(markdown)).toBe(2);
    expect(estimateReadingMinutes('Short local field note.')).toBe(1);
  });

  it('ignores CommonMark fences longer than three characters and shorter fence runs inside', () => {
    const codeWords = Array.from({ length: 500 }, () => 'implementation').join(' ');
    const markdown = [
      'A short field note.',
      '',
      '````md',
      '```',
      codeWords,
      '````',
    ].join('\n');

    expect(estimateReadingMinutes(markdown)).toBe(1);
  });

  it('ignores tilde fenced code and multi-backtick inline code spans', () => {
    const codeWords = Array.from({ length: 500 }, () => 'implementation').join(' ');
    const markdown = [
      'A short note with ``inline ` code`` kept out of the estimate.',
      '',
      '~~~ts',
      codeWords,
      '~~~',
    ].join('\n');

    expect(estimateReadingMinutes(markdown)).toBe(1);
  });
});
