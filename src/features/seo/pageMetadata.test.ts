import { describe, expect, it } from 'vitest';
import { blogCatalog } from '../../content/blog/catalog';
import {
  buildArticleMetadata,
  buildBlogIndexMetadata,
  serializeJsonLd,
} from './pageMetadata';

describe('page metadata builders', () => {
  it.each(['en', 'es'] as const)('builds localized self-canonical blog metadata for %s', (language) => {
    const metadata = buildBlogIndexMetadata(language);

    expect(metadata.title).toContain(language === 'es' ? 'Notas de campo' : 'Field notes');
    expect(metadata.description).toContain(language === 'es' ? 'Decisiones' : 'Architecture');
    expect(metadata.canonical).toBe(`https://kathesama.ar/blog?lang=${language}`);
    expect(metadata.alternates).toEqual({
      en: 'https://kathesama.ar/blog?lang=en',
      es: 'https://kathesama.ar/blog?lang=es',
      'x-default': 'https://kathesama.ar/blog?lang=en',
    });
    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      locale: language === 'es' ? 'es_AR' : 'en_US',
      url: metadata.canonical,
      title: metadata.title,
      description: metadata.description,
    });
    expect(metadata.openGraph.image).toMatch(/^https:\/\/kathesama\.ar\/images\/blog\//);
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      image: metadata.openGraph.image,
    });
    expect(metadata.jsonLd).toBeUndefined();
  });

  it.each(blogCatalog.flatMap((article) => (['en', 'es'] as const).map((language) => ({ article, language }))))(
    'builds complete BlogPosting metadata for $article.slug in $language',
    ({ article, language }) => {
      const metadata = buildArticleMetadata(article, language);
      const canonical = `https://kathesama.ar/blog/${article.slug}?lang=${language}`;

      expect(metadata.title).toContain(article.title[language]);
      expect(metadata.description).toBe(article.summary[language]);
      expect(metadata.canonical).toBe(canonical);
      expect(metadata.canonical).not.toBe(article.sourceUrl);
      expect(metadata.alternates).toEqual({
        en: `https://kathesama.ar/blog/${article.slug}?lang=en`,
        es: `https://kathesama.ar/blog/${article.slug}?lang=es`,
        'x-default': `https://kathesama.ar/blog/${article.slug}?lang=en`,
      });
      expect(metadata.openGraph).toMatchObject({
        type: 'article',
        locale: language === 'es' ? 'es_AR' : 'en_US',
        url: canonical,
        title: metadata.title,
        description: article.summary[language],
        image: `https://kathesama.ar${article.coverPath}`,
      });
      expect(metadata.twitter).toMatchObject({
        card: 'summary_large_image',
        title: metadata.title,
        description: article.summary[language],
        image: `https://kathesama.ar${article.coverPath}`,
      });
      expect(metadata.jsonLd).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title[language],
        description: article.summary[language],
        datePublished: article.publishedAt,
        inLanguage: language,
        image: `https://kathesama.ar${article.coverPath}`,
        isBasedOn: article.sourceUrl,
        author: {
          '@type': 'Person',
          name: 'Katherine E. Aguirre',
        },
        isPartOf: {
          '@type': 'CreativeWorkSeries',
          position: article.seriesOrder,
        },
      });
    },
  );

  it('serializes JSON-LD without allowing script termination', () => {
    const serialized = serializeJsonLd({ value: '</script><script>alert(1)</script>' });

    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('</script>');
    expect(JSON.parse(serialized)).toEqual({ value: '</script><script>alert(1)</script>' });
  });
});
