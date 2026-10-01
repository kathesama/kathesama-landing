export type BlogLanguage = 'en' | 'es';

export type TranslationState = 'original' | 'local-reviewed';

export type Localized<T> = Record<BlogLanguage, T>;

export interface BlogFrontMatter {
  id: string;
  slug: string;
  language: BlogLanguage;
  sourceLanguage: 'en';
  sourcePlatform: 'medium';
  sourceUrl: string;
  sourcePostId: string;
  publishedAt: string;
  translation: TranslationState;
}

export interface ParsedBlogDocument {
  fileName: string;
  frontMatter: BlogFrontMatter;
  body: string;
}

export interface BlogCatalogItem {
  id: string;
  slug: string;
  publishedAt: string;
  sourcePostId: string;
  sourceUrl: string;
  seriesOrder: number;
  featured: boolean;
  title: Localized<string>;
  summary: Localized<string>;
  tags: Localized<string[]>;
  coverPath: string;
  coverAlt: Localized<string>;
}

export interface BlogValidationInput {
  catalog: BlogCatalogItem[];
  documents: ParsedBlogDocument[];
  assetPaths: string[];
}

export interface BlogValidationSummary {
  articleCount: number;
  documentCount: number;
  imageCount: number;
}
