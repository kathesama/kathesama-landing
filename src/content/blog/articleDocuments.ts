import { parseBlogDocument } from './frontMatter';
import type { ParsedBlogDocument } from './types';

const articleSources = import.meta.glob('../../../content/blog/articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const articleDocuments: ParsedBlogDocument[] = Object.entries(articleSources)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([fileName, source]) => parseBlogDocument(source, fileName));

export function getArticleDocument(
  articleId: string,
  language: 'en' | 'es',
): ParsedBlogDocument | undefined {
  return articleDocuments.find(
    (document) =>
      document.frontMatter.id === articleId && document.frontMatter.language === language,
  );
}
