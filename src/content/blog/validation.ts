import type {
  BlogCatalogItem,
  BlogLanguage,
  BlogValidationInput,
  BlogValidationSummary,
  ParsedBlogDocument,
} from './types';
import { canonicalBlogAssetPaths } from './assets';
export { canonicalBlogAssetPaths } from './assets';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

interface CanonicalArticle {
  id: string;
  slug: string;
  publishedAt: string;
  sourcePostId: string;
  sourceUrl: string;
  seriesOrder: number;
  featured: boolean;
}

export interface BlogValidationIssue {
  code: string;
  subject: string;
}

export const canonicalArticles: readonly CanonicalArticle[] = [
  {
    id: 'juana-build-01',
    slug: 'building-juana-self-hosted-ai',
    publishedAt: '2026-03-14T21:22:40Z',
    sourcePostId: 'c5a60ad26791',
    sourceUrl:
      'https://medium.com/@kathesama/im-building-a-personal-ai-that-lives-on-my-pc-here-s-what-i-ve-learned-so-far-c5a60ad26791',
    seriesOrder: 1,
    featured: false,
  },
  {
    id: 'juana-build-02',
    slug: 'juana-orchestration-layer',
    publishedAt: '2026-04-08T16:14:22Z',
    sourcePostId: 'c5eb39f8c320',
    sourceUrl:
      'https://medium.com/@kathesama/i-gave-my-local-ai-a-brain-how-i-designed-the-orchestration-layer-c5eb39f8c320',
    seriesOrder: 2,
    featured: false,
  },
  {
    id: 'juana-build-03',
    slug: 'self-hosted-ai-latency-24-to-2',
    publishedAt: '2026-04-30T16:58:14Z',
    sourcePostId: '2085faacab7f',
    sourceUrl:
      'https://medium.com/@kathesama/from-24-seconds-to-2-how-i-optimized-response-times-in-a-self-hosted-ai-assistant-2085faacab7f',
    seriesOrder: 3,
    featured: false,
  },
  {
    id: 'juana-build-04',
    slug: 'curiosity-driven-knowledge-enrichment',
    publishedAt: '2026-05-10T05:08:08Z',
    sourcePostId: 'c6e711c0ff8a',
    sourceUrl:
      'https://medium.com/@kathesama/when-your-ai-has-photographic-memory-but-no-understanding-designing-curiosity-driven-knowledge-c6e711c0ff8a',
    seriesOrder: 4,
    featured: true,
  },
] as const;

export class BlogContentValidationError extends Error {
  constructor(public readonly issues: BlogValidationIssue[]) {
    super(`Blog content validation failed with ${issues.length} issue(s)`);
    this.name = 'BlogContentValidationError';
  }
}

const utcTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const genericAlt = /^(image|img|photo|picture|diagram|figure|screenshot|imagen|foto|diagrama|figura|captura)(\s+\d+)?$/i;
const unsafeContentPatterns = [
  /medium\.com\/_\/stat/i,
  /[?&]source=rss/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:access[_-]?token|api[_-]?key|secret)\s*[:=]\s*[A-Za-z0-9._-]{20,}/i,
];
const sensitiveParameterName = /(?:^|[_-])(?:access[_-]?token|token|api[_-]?key|key|auth|credential|password|passwd|secret|signature|sig)(?:$|[_-])/i;

interface MarkdownNode {
  type: string;
  children?: MarkdownNode[];
  url?: string;
  identifier?: string;
  alt?: string;
  value?: string;
}

interface ParsedMarkdown {
  definitions: Map<string, string>;
  images: Array<{ alt: string; target: string }>;
  links: string[];
  unresolvedReferences: number;
  containsRawHtml: boolean;
}

function normalizedAssetPath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

function normalizedReferenceLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseMarkdown(body: string): ParsedMarkdown {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body) as MarkdownNode;
  const definitions = new Map<string, string>();
  const images: ParsedMarkdown['images'] = [];
  const links: string[] = [];
  let unresolvedReferences = 0;
  let containsRawHtml = false;

  const walkDefinitions = (node: MarkdownNode): void => {
    if (node.type === 'definition' && node.identifier && node.url) {
      const label = normalizedReferenceLabel(node.identifier);
      if (!definitions.has(label)) definitions.set(label, node.url);
    }
    node.children?.forEach(walkDefinitions);
  };
  walkDefinitions(tree);

  const resolveReference = (node: MarkdownNode): string | undefined =>
    node.identifier ? definitions.get(normalizedReferenceLabel(node.identifier)) : undefined;
  const walkContent = (node: MarkdownNode): void => {
    if (node.type === 'html') containsRawHtml = true;
    if (node.type === 'link' && node.url) links.push(node.url);
    if (node.type === 'image' && node.url) {
      images.push({ alt: node.alt ?? '', target: node.url });
    }
    if (node.type === 'linkReference') {
      const target = resolveReference(node);
      if (target) links.push(target);
      else unresolvedReferences += 1;
    }
    if (node.type === 'imageReference') {
      const target = resolveReference(node);
      if (target) images.push({ alt: node.alt ?? '', target });
      else unresolvedReferences += 1;
    }
    node.children?.forEach(walkContent);
  };
  walkContent(tree);

  return { definitions, images, links, unresolvedReferences, containsRawHtml };
}

function isSafeLinkTarget(target: string): boolean {
  if (target.startsWith('#')) return true;
  if (target.startsWith('//')) return false;
  try {
    const isLocalPath = target.startsWith('/') && !target.startsWith('//');
    const isAbsoluteHttpUrl = /^https?:\/\//i.test(target);
    if (!isLocalPath && !isAbsoluteHttpUrl) return false;
    const url = new URL(target, 'https://kathesama.ar');
    if (!isLocalPath && url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    if ([...url.searchParams.keys()].some((name) => sensitiveParameterName.test(name))) {
      return false;
    }
    return isLocalPath || url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizedSourceTarget(target: string): string | null {
  if (!/^https?:\/\//i.test(target)) return null;

  try {
    const url = new URL(target);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    return `${url.host.toLowerCase()}${pathname}`;
  } catch {
    return null;
  }
}

const canonicalSourceTargets = new Set(
  canonicalArticles.map((article) => normalizedSourceTarget(article.sourceUrl)),
);

function isCanonicalSelfSourceTarget(target: string): boolean {
  const normalized = normalizedSourceTarget(target);
  return normalized !== null && canonicalSourceTargets.has(normalized);
}

function publishedSourceIssues(paths: string[]): BlogValidationIssue[] {
  const issues: BlogValidationIssue[] = [];
  for (const rawPath of paths) {
    const path = normalizedAssetPath(rawPath);
    const lowerPath = path.toLowerCase();
    const fileName = lowerPath.split('/').at(-1) ?? '';
    const leaksImportOutput = lowerPath.split('/').includes('.blog-import');
    const leaksSourceDirectory = lowerPath.includes('/content/blog/source/');
    const leaksInventory = fileName === 'source-inventory.json';
    const leaksFeed = /^medium-feed[^/]*\.xml$/.test(fileName);
    if (
      (lowerPath.startsWith('public/') || lowerPath.startsWith('dist/')) &&
      (leaksImportOutput || leaksSourceDirectory || leaksInventory || leaksFeed)
    ) {
      issues.push({ code: 'public.source-leak', subject: path });
    }
  }
  return issues;
}

export function validateNoPublishedSourceArtifacts(paths: string[]): void {
  const issues = publishedSourceIssues(paths);
  if (issues.length > 0) throw new BlogContentValidationError(issues);
}

function isValidUtcTimestamp(value: string): boolean {
  return utcTimestamp.test(value) && !Number.isNaN(Date.parse(value));
}

function hasLocalizedText(item: BlogCatalogItem): boolean {
  return (
    item.title.en.trim().length > 0 &&
    item.title.es.trim().length > 0 &&
    item.summary.en.trim().length >= 40 &&
    item.summary.es.trim().length >= 40 &&
    item.tags.en.length > 0 &&
    item.tags.es.length > 0 &&
    item.tags.en.every((tag) => tag.trim().length > 0) &&
    item.tags.es.every((tag) => tag.trim().length > 0) &&
    item.coverAlt.en.trim().length > 8 &&
    item.coverAlt.es.trim().length > 8 &&
    item.coverAlt.en.trim() !== item.coverAlt.es.trim() &&
    !genericAlt.test(item.coverAlt.en.trim()) &&
    !genericAlt.test(item.coverAlt.es.trim())
  );
}

function documentsForArticle(
  documents: ParsedBlogDocument[],
  id: string,
): ParsedBlogDocument[] {
  return documents.filter((document) => document.frontMatter.id === id);
}

function sameCanonicalMetadata(
  document: ParsedBlogDocument,
  article: CanonicalArticle,
): boolean {
  const frontMatter = document.frontMatter;
  const expectedTranslation = frontMatter.language === 'en' ? 'original' : 'local-reviewed';
  return (
    frontMatter.id === article.id &&
    frontMatter.slug === article.slug &&
    frontMatter.sourceLanguage === 'en' &&
    frontMatter.sourcePlatform === 'medium' &&
    frontMatter.sourceUrl === article.sourceUrl &&
    frontMatter.sourcePostId === article.sourcePostId &&
    frontMatter.publishedAt === article.publishedAt &&
    frontMatter.translation === expectedTranslation
  );
}

function validateImages(
  documents: ParsedBlogDocument[],
  assetPaths: string[],
  issues: BlogValidationIssue[],
): Set<string> {
  const referenced = new Set<string>();
  const altByPath = new Map<string, Map<BlogLanguage, string>>();
  const assets = new Set(assetPaths.map(normalizedAssetPath));

  const registerImage = (
    document: ParsedBlogDocument,
    alt: string,
    target: string,
  ): void => {
    const expectedPrefix = `/images/blog/${document.frontMatter.slug}/`;

    if (
      !target.startsWith(expectedPrefix) ||
      target.includes('..') ||
      target.includes('?') ||
      target.includes('#')
    ) {
      issues.push({ code: 'image.path', subject: document.fileName });
      return;
    }

    referenced.add(target);
    if (!assets.has(`public${target}`)) {
      issues.push({ code: 'image.missing', subject: target });
    }
    if (alt.length < 8 || genericAlt.test(alt) || /\.(?:png|jpe?g|gif|webp)$/i.test(alt)) {
      issues.push({ code: 'image.alt', subject: document.fileName });
    }

    const translations = altByPath.get(target) ?? new Map<BlogLanguage, string>();
    translations.set(document.frontMatter.language, alt);
    altByPath.set(target, translations);
  };

  for (const document of documents) {
    const parsed = parseMarkdown(document.body);
    for (const image of parsed.images) {
      registerImage(document, image.alt.trim(), image.target);
    }
  }

  for (const [path, translations] of altByPath) {
    const en = translations.get('en');
    const es = translations.get('es');
    if (!en || !es || en === es) {
      issues.push({ code: 'image.alt', subject: path });
    }
  }

  if (referenced.size !== canonicalBlogAssetPaths.length || assets.size !== canonicalBlogAssetPaths.length) {
    issues.push({ code: 'image.count', subject: 'blog-images' });
  }

  const canonicalReferences = new Set<string>(canonicalBlogAssetPaths);
  const canonicalAssets = new Set(canonicalBlogAssetPaths.map((path) => `public${path}`));
  if (
    [...referenced].some((path) => !canonicalReferences.has(path)) ||
    canonicalBlogAssetPaths.some((path) => !referenced.has(path)) ||
    [...assets].some((path) => !canonicalAssets.has(path)) ||
    [...canonicalAssets].some((path) => !assets.has(path))
  ) {
    issues.push({ code: 'image.canonical', subject: 'blog-images' });
  }

  return referenced;
}

function validateDocumentSafety(
  document: ParsedBlogDocument,
  issues: BlogValidationIssue[],
): void {
  const parsed = parseMarkdown(document.body);
  if (
    parsed.containsRawHtml ||
    unsafeContentPatterns.some((pattern) => pattern.test(document.body))
  ) {
    issues.push({ code: 'content.unsafe', subject: document.fileName });
  }

  for (const image of parsed.images) {
    if (!image.target.startsWith('/images/blog/') || !isSafeLinkTarget(image.target)) {
      issues.push({ code: 'content.unsafe', subject: document.fileName });
    }
  }

  for (const target of parsed.links) {
    if (!isSafeLinkTarget(target)) {
      issues.push({ code: 'link.unsafe', subject: document.fileName });
      if (/^(?:javascript|data):/i.test(target)) {
        issues.push({ code: 'content.unsafe', subject: document.fileName });
      }
    }
    if (isCanonicalSelfSourceTarget(target)) {
      issues.push({ code: 'link.self-source', subject: document.fileName });
    }
  }

  for (const target of parsed.definitions.values()) {
    if (!isSafeLinkTarget(target)) {
      issues.push({ code: 'link.unsafe', subject: document.fileName });
    }
  }
  if (parsed.unresolvedReferences > 0) {
    issues.push({ code: 'link.reference', subject: document.fileName });
  }
}

export function validateBlogContent(input: BlogValidationInput): BlogValidationSummary {
  const issues: BlogValidationIssue[] = [];
  const catalogIds = input.catalog.map((item) => item.id);
  const canonicalIds = canonicalArticles.map((item) => item.id);

  if (input.catalog.length !== canonicalArticles.length) {
    issues.push({ code: 'catalog.count', subject: 'catalog' });
  }
  if (new Set(catalogIds).size !== catalogIds.length) {
    issues.push({ code: 'catalog.duplicate', subject: 'catalog' });
  }
  if (
    catalogIds.some((id) => !canonicalIds.includes(id)) ||
    canonicalIds.some((id) => !catalogIds.includes(id))
  ) {
    issues.push({ code: 'catalog.canonical', subject: 'catalog' });
  }
  if (
    input.documents.length !== canonicalArticles.length * 2 ||
    input.documents.some((document) => !canonicalIds.includes(document.frontMatter.id))
  ) {
    issues.push({ code: 'document.pair', subject: 'documents' });
  }

  for (const canonical of canonicalArticles) {
    const item = input.catalog.find((candidate) => candidate.id === canonical.id);
    if (!item) continue;

    const canonicalFields: (keyof CanonicalArticle)[] = [
      'id',
      'slug',
      'publishedAt',
      'sourcePostId',
      'sourceUrl',
      'seriesOrder',
    ];
    if (canonicalFields.some((field) => item[field] !== canonical[field])) {
      issues.push({ code: 'catalog.canonical', subject: item.id });
    }
    if (item.featured !== canonical.featured) {
      issues.push({ code: 'catalog.featured', subject: item.id });
    }
    if (!isValidUtcTimestamp(item.publishedAt)) {
      issues.push({ code: 'date.invalid', subject: item.id });
    }
    if (!hasLocalizedText(item)) {
      issues.push({ code: 'catalog.localized', subject: item.id });
    }
    if (
      !item.coverPath.startsWith(`/images/blog/${item.slug}/`) ||
      item.coverPath.includes('..')
    ) {
      issues.push({ code: 'image.path', subject: item.id });
    }

    const articleDocuments = documentsForArticle(input.documents, item.id);
    const languages = articleDocuments.map((document) => document.frontMatter.language);
    if (
      articleDocuments.length !== 2 ||
      languages.filter((language) => language === 'en').length !== 1 ||
      languages.filter((language) => language === 'es').length !== 1
    ) {
      issues.push({ code: 'document.pair', subject: item.id });
    }
    for (const document of articleDocuments) {
      if (!sameCanonicalMetadata(document, canonical)) {
        issues.push({ code: 'document.metadata', subject: document.fileName });
      }
      if (!isValidUtcTimestamp(document.frontMatter.publishedAt)) {
        issues.push({ code: 'date.invalid', subject: document.fileName });
      }
      if (document.body.trim().length < 80) {
        issues.push({ code: 'document.body', subject: document.fileName });
      }
      validateDocumentSafety(document, issues);
    }
  }

  const ordered = [...input.catalog].sort((a, b) => a.seriesOrder - b.seriesOrder);
  for (let index = 1; index < ordered.length; index += 1) {
    if (Date.parse(ordered[index - 1]!.publishedAt) >= Date.parse(ordered[index]!.publishedAt)) {
      issues.push({ code: 'date.order', subject: ordered[index]!.id });
    }
  }

  const referencedImages = validateImages(input.documents, input.assetPaths, issues);
  for (const item of input.catalog) {
    if (!referencedImages.has(item.coverPath)) {
      issues.push({ code: 'image.missing', subject: item.coverPath });
    }
  }

  issues.push(...publishedSourceIssues(input.assetPaths));

  if (issues.length > 0) {
    throw new BlogContentValidationError(issues);
  }

  return {
    articleCount: input.catalog.length,
    documentCount: input.documents.length,
    imageCount: referencedImages.size,
  };
}
