import { blogCatalog } from '../../content/blog/catalog';
import type { BlogCatalogItem, BlogLanguage } from '../../content/blog/types';

export const siteOrigin = 'https://kathesama.ar';

type AlternateLanguage = BlogLanguage | 'x-default';

export interface PageMetadataDescriptor {
  title: string;
  description: string;
  canonical: string;
  alternates: Record<AlternateLanguage, string>;
  openGraph: {
    title: string;
    description: string;
    image: string;
    type: 'website' | 'article';
    locale: 'en_US' | 'es_AR';
    url: string;
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image: string;
  };
  jsonLd?: Record<string, unknown>;
}

function absoluteUrl(path: string): string {
  return new URL(path, siteOrigin).toString();
}

function localizedUrl(pathname: string, language: BlogLanguage): string {
  return `${siteOrigin}${pathname}?lang=${language}`;
}

function buildAlternates(pathname: string): Record<AlternateLanguage, string> {
  return {
    en: localizedUrl(pathname, 'en'),
    es: localizedUrl(pathname, 'es'),
    'x-default': localizedUrl(pathname, 'en'),
  };
}

function buildSocialMetadata(
  title: string,
  description: string,
  canonical: string,
  image: string,
  language: BlogLanguage,
  type: 'website' | 'article',
): Pick<PageMetadataDescriptor, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      title,
      description,
      image,
      type,
      locale: language === 'es' ? 'es_AR' : 'en_US',
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image,
    },
  };
}

export function buildBlogIndexMetadata(language: BlogLanguage): PageMetadataDescriptor {
  const copy = {
    en: {
      title: 'Field notes from building JuanaIA | Kathesama',
      description:
        'Architecture decisions, performance investigations, and the path from remembering information to understanding it.',
    },
    es: {
      title: 'Notas de campo construyendo JuanaIA | Kathesama',
      description:
        'Decisiones de arquitectura, investigaciones de rendimiento y el camino desde recordar información hasta comprenderla.',
    },
  } as const;
  const canonical = localizedUrl('/blog', language);
  const featured = blogCatalog.find((article) => article.featured) ?? blogCatalog[0]!;
  const image = absoluteUrl(featured.coverPath);

  return {
    ...copy[language],
    canonical,
    alternates: buildAlternates('/blog'),
    ...buildSocialMetadata(
      copy[language].title,
      copy[language].description,
      canonical,
      image,
      language,
      'website',
    ),
  };
}

export function buildArchitectureMetadata(language: BlogLanguage): PageMetadataDescriptor {
  const copy = {
    en: {
      title: 'JuanaIA systems atlas | Kathesama',
      description:
        'Explore the public, security-conscious architecture of JuanaIA: system boundaries, request flows, memory, RAG, tools, observability, and design decisions.',
    },
    es: {
      title: 'Atlas de sistemas de JuanaIA | Kathesama',
      description:
        'Explora la arquitectura pública y consciente de la seguridad de JuanaIA: límites, solicitudes, memoria, RAG, herramientas, observabilidad y decisiones de diseño.',
    },
  } as const;
  const canonical = localizedUrl('/architecture', language);
  const image = absoluteUrl(
    '/images/blog/curiosity-driven-knowledge-enrichment/cdke-architecture.png',
  );

  return {
    ...copy[language],
    canonical,
    alternates: buildAlternates('/architecture'),
    ...buildSocialMetadata(
      copy[language].title,
      copy[language].description,
      canonical,
      image,
      language,
      'website',
    ),
  };
}

export function buildArticleMetadata(
  article: BlogCatalogItem,
  language: BlogLanguage,
): PageMetadataDescriptor {
  const pathname = `/blog/${article.slug}`;
  const canonical = localizedUrl(pathname, language);
  const title = `${article.title[language]} | Kathesama`;
  const description = article.summary[language];
  const image = absoluteUrl(article.coverPath);

  return {
    title,
    description,
    canonical,
    alternates: buildAlternates(pathname),
    ...buildSocialMetadata(title, description, canonical, image, language, 'article'),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title[language],
      description,
      datePublished: article.publishedAt,
      inLanguage: language,
      image,
      url: canonical,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonical,
      },
      author: {
        '@type': 'Person',
        name: 'Katherine E. Aguirre',
        url: siteOrigin,
      },
      isPartOf: {
        '@type': 'CreativeWorkSeries',
        '@id': `${siteOrigin}/blog#juanaia-build-log`,
        name: 'The JuanaIA build log',
        position: article.seriesOrder,
      },
      isBasedOn: article.sourceUrl,
    },
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMetadataHead(metadata: PageMetadataDescriptor): string {
  const alternateLinks = Object.entries(metadata.alternates)
    .map(
      ([language, href]) =>
        `<link rel="alternate" hreflang="${language}" href="${escapeHtml(href)}" data-kathesama-meta="alternate-${language}">`,
    )
    .join('');
  const jsonLd = metadata.jsonLd
    ? `<script type="application/ld+json" data-kathesama-meta="json-ld">${serializeJsonLd(metadata.jsonLd)}</script>`
    : '';

  return [
    `<title data-kathesama-meta="title">${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" data-kathesama-meta="description">`,
    `<link rel="canonical" href="${escapeHtml(metadata.canonical)}" data-kathesama-meta="canonical">`,
    alternateLinks,
    `<meta property="og:title" content="${escapeHtml(metadata.openGraph.title)}" data-kathesama-meta="og-title">`,
    `<meta property="og:description" content="${escapeHtml(metadata.openGraph.description)}" data-kathesama-meta="og-description">`,
    `<meta property="og:image" content="${escapeHtml(metadata.openGraph.image)}" data-kathesama-meta="og-image">`,
    `<meta property="og:type" content="${metadata.openGraph.type}" data-kathesama-meta="og-type">`,
    `<meta property="og:locale" content="${metadata.openGraph.locale}" data-kathesama-meta="og-locale">`,
    `<meta property="og:url" content="${escapeHtml(metadata.openGraph.url)}" data-kathesama-meta="og-url">`,
    `<meta name="twitter:card" content="${metadata.twitter.card}" data-kathesama-meta="twitter-card">`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.twitter.title)}" data-kathesama-meta="twitter-title">`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.twitter.description)}" data-kathesama-meta="twitter-description">`,
    `<meta name="twitter:image" content="${escapeHtml(metadata.twitter.image)}" data-kathesama-meta="twitter-image">`,
    jsonLd,
  ].join('');
}
