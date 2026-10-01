import { describe, expect, it } from 'vitest';
import {
  isSafeArticleLink,
  isSafeBlogImageSource,
  localizeInternalHref,
} from './urlSafety';

describe('blog URL safety', () => {
  it.each([
    [
      '/blog/building-juana-self-hosted-ai',
      'es',
      '/blog/building-juana-self-hosted-ai?lang=es',
    ],
    ['/architecture?lens=trust', 'en', '/architecture?lens=trust&lang=en'],
    ['/blog/post?lang=es#part-2', 'en', '/blog/post?lang=en#part-2'],
  ] as const)('localizes application link %s for %s', (href, language, expected) => {
    expect(localizeInternalHref(href, language)).toBe(expected);
  });

  it.each([
    'https://medium.com/@kathesama',
    '//medium.com/@kathesama',
    '#request-flow',
  ])('does not reinterpret non-application link %s', (href) => {
    expect(localizeInternalHref(href, 'es')).toBe(href);
  });

  it.each([
    '/\\evil.example/path',
    '/%5cevil.example/path',
    '/%255cevil.example/path',
    '//evil.example/path',
    '/%2f%2fevil.example/path',
    '/%252f%252fevil.example/path',
    '/blog/%2e%2e/private',
    '/blog/%252e%252e/private',
    '/blog/%2e%252e/private',
    '/blog/%E0%A4%A',
    'https:\\evil.example/path',
  ])('rejects ambiguous or browser-normalized internal link %s', (href) => {
    expect(isSafeArticleLink(href)).toBe(false);
  });

  it.each([
    '/architecture?lang=en',
    '/blog/juana-orchestration-layer?lang=es#request-flow',
    '#request-flow',
    'https://medium.com/@kathesama',
    'http://example.com/reference',
  ])('accepts an unambiguous application or HTTP(S) link %s', (href) => {
    expect(isSafeArticleLink(href)).toBe(true);
  });

  it('allows only exact canonical article image paths', () => {
    expect(
      isSafeBlogImageSource(
        '/images/blog/juana-orchestration-layer/figure-02.png',
      ),
    ).toBe(true);

    for (const src of [
      '/images/blog/juana-orchestration-layer/not-published.png',
      '/images/blog/juana-orchestration-layer/%66igure-02.png',
      '/images/blog/juana-orchestration-layer/%252e%252e/private.png',
      '/images/blog/juana-orchestration-layer/%5cprivate.png',
      '/images/blog/juana-orchestration-layer/figure-02.png?source=rss',
      '//evil.example/image.png',
    ]) {
      expect(isSafeBlogImageSource(src)).toBe(false);
    }
  });
});
