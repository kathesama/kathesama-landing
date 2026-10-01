import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { blogCatalog } from '../../content/blog/catalog';
import { PageMetadata } from './PageMetadata.tsx';
import {
  buildArchitectureMetadata,
  buildArticleMetadata,
  buildBlogIndexMetadata,
} from './pageMetadata';

describe('PageMetadata', () => {
  beforeEach(() => {
    document.head.innerHTML = '<title>Fallback</title><meta name="description" content="Fallback">';
  });

  it('owns one stable set of localized title, canonical, hreflang, OG, and Twitter tags', () => {
    const { rerender } = render(<PageMetadata metadata={buildBlogIndexMetadata('en')} />);

    expect(document.head.querySelectorAll('title')).toHaveLength(1);
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('[data-kathesama-meta]')).toHaveLength(16);
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://kathesama.ar/blog?lang=en',
    );
    expect(document.head.querySelector('link[hreflang="es"]')).toHaveAttribute(
      'href',
      'https://kathesama.ar/blog?lang=es',
    );

    rerender(<PageMetadata metadata={buildBlogIndexMetadata('es')} />);

    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://kathesama.ar/blog?lang=es',
    );
    expect(document.head.querySelector('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      'es_AR',
    );
  });

  it('replaces article JSON-LD and removes it when returning to the blog index', () => {
    const firstArticle = blogCatalog[0]!;
    const secondArticle = blogCatalog[1]!;
    const { rerender } = render(
      <PageMetadata metadata={buildArticleMetadata(firstArticle, 'en')} />,
    );

    const originalScript = document.head.querySelector('script[type="application/ld+json"]');
    expect(originalScript).toHaveTextContent(firstArticle.title.en);
    expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);

    rerender(<PageMetadata metadata={buildArticleMetadata(secondArticle, 'es')} />);
    expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
    expect(document.head.querySelector('script[type="application/ld+json"]')).toHaveTextContent(
      secondArticle.title.es,
    );

    rerender(<PageMetadata metadata={buildBlogIndexMetadata('en')} />);
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull();
    expect(document.head.querySelectorAll('[data-kathesama-meta="canonical"]')).toHaveLength(1);
  });

  it('builds localized canonical and social metadata for the public architecture atlas', () => {
    const english = buildArchitectureMetadata('en');
    const spanish = buildArchitectureMetadata('es');

    expect(english.title).toBe('JuanaIA systems atlas | Kathesama');
    expect(english.canonical).toBe('https://kathesama.ar/architecture?lang=en');
    expect(english.alternates.es).toBe('https://kathesama.ar/architecture?lang=es');
    expect(english.openGraph.type).toBe('website');
    expect(spanish.title).toBe('Atlas de sistemas de JuanaIA | Kathesama');
    expect(spanish.canonical).toBe('https://kathesama.ar/architecture?lang=es');
    expect(spanish.openGraph.locale).toBe('es_AR');
  });

  it('restores the global title and description after leaving a blog route', () => {
    const globalTitle = 'Kathesama — Privacy-First AI Infrastructure';
    const globalDescription = 'JuanaIA — a fully self-hosted personal AI assistant.';
    document.head.innerHTML = `<title data-kathesama-meta="title">${globalTitle}</title><meta name="description" content="${globalDescription}" data-kathesama-meta="description">`;

    const { unmount } = render(
      <PageMetadata metadata={buildArticleMetadata(blogCatalog[0]!, 'en')} />,
    );
    expect(document.title).toContain('I’m Building a Personal AI');

    unmount();

    expect(document.title).toBe(globalTitle);
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      globalDescription,
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('restores global metadata when hydration starts from prerendered article metadata', () => {
    const articleMetadata = buildArticleMetadata(blogCatalog[0]!, 'en');
    document.head.innerHTML = `<title data-kathesama-meta="title">${articleMetadata.title}</title><meta name="description" content="${articleMetadata.description}" data-kathesama-meta="description"><link rel="canonical" href="${articleMetadata.canonical}" data-kathesama-meta="canonical">`;

    const { unmount } = render(<PageMetadata metadata={articleMetadata} />);
    unmount();

    expect(document.title).toBe('Kathesama — Privacy-First AI Infrastructure');
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'JuanaIA — a fully self-hosted personal AI assistant. Built by Katherine E. Aguirre.',
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });
});
