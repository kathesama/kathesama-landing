import { describe, expect, it } from 'vitest';
import type {
  BlogCatalogItem,
  BlogValidationInput,
  ParsedBlogDocument,
} from './types';
import {
  BlogContentValidationError,
  canonicalArticles,
  canonicalBlogAssetPaths,
  validateBlogContent,
  validateNoPublishedSourceArtifacts,
} from './validation';

const imagePaths = [...canonicalBlogAssetPaths];

function localizedBody(slug: string, language: 'en' | 'es'): string {
  const descriptions =
    language === 'en'
      ? ['System boundary', 'Request flow', 'Local assistant result', 'Latency evidence']
      : ['Límite del sistema', 'Flujo de solicitudes', 'Resultado del asistente local', 'Evidencia de latencia'];
  const images = imagePaths.filter((path) => path.includes(`/${slug}/`));
  const prose =
    language === 'en'
      ? 'This reviewed local article explains the architecture, its trade-offs, and the evidence collected while building Juana.'
      : 'Este artículo local revisado explica la arquitectura, sus decisiones y la evidencia reunida durante la construcción de Juana.';

  return [
    '## Field notes',
    '',
    prose,
    '',
    ...images.flatMap((path, index) => [
      `![${descriptions[index] ?? `${descriptions[0]} ${index + 1}`}](${path})`,
      '',
    ]),
    '[Documentation](https://example.com/guide)',
  ].join('\n');
}

function createValidInput(): BlogValidationInput {
  const catalog: BlogCatalogItem[] = canonicalArticles.map((article) => ({
    ...article,
    title: {
      en: `Original title ${article.seriesOrder}`,
      es: `Título traducido ${article.seriesOrder}`,
    },
    summary: {
      en: 'A substantial English summary of the engineering lessons in this article.',
      es: 'Un resumen sustancial en español de las lecciones técnicas del artículo.',
    },
    tags: {
      en: ['Local AI', 'Architecture'],
      es: ['IA local', 'Arquitectura'],
    },
    coverPath: imagePaths.find((path) => path.includes(`/${article.slug}/`))!,
    coverAlt: {
      en: `Architecture evidence for article ${article.seriesOrder}`,
      es: `Evidencia de arquitectura del artículo ${article.seriesOrder}`,
    },
  }));

  const documents: ParsedBlogDocument[] = catalog.flatMap((article) =>
    (['en', 'es'] as const).map((language) => ({
      fileName: `${article.slug}.${language}.md`,
      frontMatter: {
        id: article.id,
        slug: article.slug,
        language,
        sourceLanguage: 'en',
        sourcePlatform: 'medium',
        sourceUrl: article.sourceUrl,
        sourcePostId: article.sourcePostId,
        publishedAt: article.publishedAt,
        translation: language === 'en' ? 'original' : 'local-reviewed',
      },
      body: localizedBody(article.slug, language),
    })),
  );

  return {
    catalog,
    documents,
    assetPaths: imagePaths.map((path) => `public${path}`),
  };
}

function expectInvalid(input: BlogValidationInput, issueCode: string): void {
  try {
    validateBlogContent(input);
    throw new Error('Expected validation to fail');
  } catch (error) {
    expect(error).toBeInstanceOf(BlogContentValidationError);
    expect((error as BlogContentValidationError).issues.map((issue) => issue.code)).toContain(
      issueCode,
    );
  }
}

describe('validateBlogContent', () => {
  it('accepts the exact four-article, eight-document, eleven-image contract', () => {
    expect(validateBlogContent(createValidInput())).toEqual({
      articleCount: 4,
      documentCount: 8,
      imageCount: 11,
    });
  });

  it('rejects missing, duplicate, or non-canonical catalog items and featured state', () => {
    const missing = createValidInput();
    missing.catalog.pop();
    expectInvalid(missing, 'catalog.count');

    const duplicate = createValidInput();
    duplicate.catalog[1]!.id = duplicate.catalog[0]!.id;
    expectInvalid(duplicate, 'catalog.duplicate');

    const nonCanonical = createValidInput();
    nonCanonical.catalog[0]!.sourcePostId = 'changed';
    expectInvalid(nonCanonical, 'catalog.canonical');

    const unknownId = createValidInput();
    unknownId.catalog[0]!.id = 'unknown-article';
    expectInvalid(unknownId, 'catalog.canonical');

    const featured = createValidInput();
    featured.catalog[0]!.featured = true;
    expectInvalid(featured, 'catalog.featured');
  });

  it('requires one English and one Spanish document with matching source metadata', () => {
    const missingPair = createValidInput();
    missingPair.documents.pop();
    expectInvalid(missingPair, 'document.pair');

    const mismatch = createValidInput();
    mismatch.documents[0]!.frontMatter.sourceUrl = 'https://medium.com/wrong';
    expectInvalid(mismatch, 'document.metadata');

    const extra = createValidInput();
    extra.documents.push({
      ...structuredClone(extra.documents[0]!),
      fileName: 'unexpected.en.md',
      frontMatter: { ...extra.documents[0]!.frontMatter, id: 'unexpected' },
    });
    expectInvalid(extra, 'document.pair');
  });

  it('requires valid UTC dates and chronological stable series order', () => {
    const invalidDate = createValidInput();
    invalidDate.catalog[0]!.publishedAt = '2026-03-14';
    expectInvalid(invalidDate, 'date.invalid');

    const wrongOrder = createValidInput();
    wrongOrder.catalog[0]!.seriesOrder = 2;
    wrongOrder.catalog[1]!.seriesOrder = 1;
    expectInvalid(wrongOrder, 'catalog.canonical');
  });

  it('requires complete localized metadata and substantive bodies', () => {
    const localized = createValidInput();
    localized.catalog[0]!.summary.es = '';
    expectInvalid(localized, 'catalog.localized');

    const body = createValidInput();
    body.documents[0]!.body = 'Too short';
    expectInvalid(body, 'document.body');
  });

  it('requires exactly eleven present slug-local images with reviewed localized alt text', () => {
    const count = createValidInput();
    count.assetPaths.pop();
    expectInvalid(count, 'image.count');

    const traversal = createValidInput();
    traversal.documents[0]!.body += '\n![Unsafe](../../secret.png)';
    expectInvalid(traversal, 'image.path');

    const missing = createValidInput();
    missing.assetPaths[0] = 'public/images/blog/other/missing.png';
    expectInvalid(missing, 'image.missing');

    const genericAlt = createValidInput();
    genericAlt.documents[0]!.body = genericAlt.documents[0]!.body.replace(
      '![System boundary]',
      '![image]',
    );
    expectInvalid(genericAlt, 'image.alt');
  });

  it('enforces the exact canonical asset names and per-article distribution', () => {
    const input = createValidInput();
    const expected = '/images/blog/building-juana-self-hosted-ai/figure-03.png';
    const replacement = '/images/blog/building-juana-self-hosted-ai/figure-99.png';
    input.assetPaths = input.assetPaths.map((path) =>
      path === `public${expected}` ? `public${replacement}` : path,
    );
    input.documents = input.documents.map((document) => ({
      ...document,
      body: document.body.replaceAll(expected, replacement),
    }));

    expectInvalid(input, 'image.canonical');
  });

  it.each([
    '<script>alert(1)</script>',
    '<iframe src="https://example.com"></iframe>',
    '<p onclick="alert(1)">unsafe</p>',
    '![Remote](https://cdn-images-1.medium.com/image.png)',
    '![Data](data:image/png;base64,abc)',
    '[Bad](javascript:alert(1))',
    '-----BEGIN PRIVATE KEY-----',
    'access_token=abcdefghijklmnopqrstuvwxyz123456',
    'https://medium.com/_/stat?event=post.clientViewed',
    '![Tracked](/images/blog/building-juana-self-hosted-ai/figure-01.png?source=rss)',
  ])('rejects unsafe content: %s', (unsafe) => {
    const input = createValidInput();
    input.documents[0]!.body += `\n\n${unsafe}`;
    expectInvalid(input, 'content.unsafe');
  });

  it('rejects non-HTTP external links', () => {
    const input = createValidInput();
    input.documents[0]!.body += '\n[Mail](mailto:someone@example.com)';
    expectInvalid(input, 'link.unsafe');
  });

  it('rejects protocol-relative inline links while accepting local paths and anchors', () => {
    const unsafe = createValidInput();
    unsafe.documents[0]!.body += '\n[External host](//evil.example/path)';
    expectInvalid(unsafe, 'link.unsafe');

    const safe = createValidInput();
    safe.documents[0]!.body += '\n[Local article](/blog/local) and [Section](#field-notes)';
    expect(validateBlogContent(safe).articleCount).toBe(4);
  });

  it.each(['mailto:someone@example.com', 'javascript:alert(1)', 'ftp://example.com/file']) (
    'rejects unsafe Markdown reference-link target %s',
    (target) => {
      const input = createValidInput();
      input.documents[0]!.body += `\n\n[Unsafe reference][unsafe]\n\n[unsafe]: ${target}`;
      expectInvalid(input, 'link.unsafe');
    },
  );

  it('accepts HTTP(S) reference links and treats undefined references as CommonMark text', () => {
    const safe = createValidInput();
    safe.documents[0]!.body +=
      '\n\n[Safe reference][documentation]\n\n[documentation]: https://example.com/docs';
    expect(validateBlogContent(safe).articleCount).toBe(4);

    const missing = createValidInput();
    missing.documents[0]!.body += '\n\n[Missing reference][not-defined]';
    expect(validateBlogContent(missing).articleCount).toBe(4);
  });

  it('rejects protocol-relative reference targets while accepting local references', () => {
    const unsafe = createValidInput();
    unsafe.documents[0]!.body +=
      '\n\n[External reference][external]\n\n[external]: //evil.example/path';
    expectInvalid(unsafe, 'link.unsafe');

    const safe = createValidInput();
    safe.documents[0]!.body +=
      '\n\n[Local reference][local]\n\n[local]: /blog/local';
    expect(validateBlogContent(safe).articleCount).toBe(4);
  });

  it.each([
    (sourceUrl: string) => `[Own article](${sourceUrl}?source=series#part-1)`,
    (sourceUrl: string) =>
      `[Own article][part-one]\n\n[part-one]: ${sourceUrl}?source=series#part-1`,
    (sourceUrl: string) => `[Own article][]\n\n[own article]: ${sourceUrl}`,
    (sourceUrl: string) => `[Own article]\n\n[own article]: ${sourceUrl}`,
  ])('rejects canonical own-article links in every parsed Markdown form', (bodyLink) => {
    const input = createValidInput();
    input.documents[0]!.body += `\n\n${bodyLink(canonicalArticles[1]!.sourceUrl)}`;
    expectInvalid(input, 'link.self-source');
  });

  it('allows canonical source URLs in frontmatter and third-party Medium body links', () => {
    const input = createValidInput();
    input.documents[0]!.body +=
      '\n\n[Research](https://medium.com/@ryanbgoldberg/retrieval-augmented-curiosity-2d3dc374e08f)';

    expect(validateBlogContent(input).articleCount).toBe(4);
  });

  it('uses CommonMark destinations for balanced, escaped, and angle-bracket links', () => {
    const safe = createValidInput();
    safe.documents[0]!.body += [
      '',
      '[Balanced](https://example.com/a_(b))',
      '[Escaped](https://example.com/a\\(b\\))',
      '[Angle](<https://example.com/a_(b)>)',
    ].join('\n');
    expect(validateBlogContent(safe).articleCount).toBe(4);

    const unsafe = createValidInput();
    unsafe.documents[0]!.body += '\n[Unsafe angle](<mailto:someone@example.com>)';
    expectInvalid(unsafe, 'link.unsafe');
  });

  it('resolves CommonMark shortcut and collapsed references before validating targets', () => {
    const shortcut = createValidInput();
    shortcut.documents[0]!.body +=
      '\n\n[Unsafe shortcut]\n\n[unsafe shortcut]: //evil.example/path';
    expectInvalid(shortcut, 'link.unsafe');

    const collapsed = createValidInput();
    collapsed.documents[0]!.body +=
      '\n\n[Unsafe collapsed][]\n\n[unsafe collapsed]: mailto:someone@example.com';
    expectInvalid(collapsed, 'link.unsafe');
  });

  it('resolves canonical local image references with angle-bracket destinations', () => {
    const input = createValidInput();
    const imagePath = canonicalBlogAssetPaths[0];
    input.documents = input.documents.map((document) => {
      if (document.frontMatter.slug !== 'building-juana-self-hosted-ai') return document;
      const alt = document.frontMatter.language === 'en' ? 'System boundary' : 'Límite del sistema';
      return {
        ...document,
        body: document.body.replace(
          `![${alt}](${imagePath})`,
          `![${alt}][first-figure]\n\n[first-figure]: <${imagePath}>`,
        ),
      };
    });

    expect(validateBlogContent(input).imageCount).toBe(11);
  });

  it.each([
    'https://user:password@example.com/private',
    'https://example.com/path?access_token=do-not-persist',
    '/blog/local?api_key=do-not-persist',
    '/blog/local?token=do-not-persist',
    'relative/path',
    '../parent/path',
  ])('rejects userinfo or sensitive parameters in Markdown links: %s', (target) => {
    const input = createValidInput();
    input.documents[0]!.body += `\n[Sensitive destination](${target})`;
    expectInvalid(input, 'link.unsafe');
  });

  it('rejects RSS fixtures and source inventories in public or dist asset paths', () => {
    const input = createValidInput();
    input.assetPaths.push('public/content/blog/source/source-inventory.json');
    expectInvalid(input, 'public.source-leak');
  });

  it.each([
    'public/nested/.blog-import/content/blog/articles/draft.en.md',
    'public/content/blog/source/medium-feed-2026-09-30.xml',
    'dist/deep/content/blog/source/source-inventory.json',
    'dist/.blog-import/public/images/blog/draft.png',
  ])('rejects recursively discovered published source artifact %s', (path) => {
    expect(() => validateNoPublishedSourceArtifacts([path])).toThrow(
      BlogContentValidationError,
    );
  });
});
