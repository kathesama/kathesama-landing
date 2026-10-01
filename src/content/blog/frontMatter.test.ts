import { describe, expect, it } from 'vitest';
import { FrontMatterError, parseBlogDocument } from './frontMatter';

const validFrontMatter = `---
id: "juana-build-01"
slug: "building-juana-self-hosted-ai"
language: "en"
sourceLanguage: "en"
sourcePlatform: "medium"
sourceUrl: "https://medium.com/@kathesama/example-c5a60ad26791"
sourcePostId: "c5a60ad26791"
publishedAt: "2026-03-14T21:22:40Z"
translation: "original"
---`;

describe('parseBlogDocument', () => {
  it('parses the exact flat contract and returns the body separately', () => {
    const parsed = parseBlogDocument(
      `${validFrontMatter}\n\n## First lesson\n\nLocal AI needs careful boundaries.`,
      'article.en.md',
    );

    expect(parsed.frontMatter).toEqual({
      id: 'juana-build-01',
      slug: 'building-juana-self-hosted-ai',
      language: 'en',
      sourceLanguage: 'en',
      sourcePlatform: 'medium',
      sourceUrl: 'https://medium.com/@kathesama/example-c5a60ad26791',
      sourcePostId: 'c5a60ad26791',
      publishedAt: '2026-03-14T21:22:40Z',
      translation: 'original',
    });
    expect(parsed.body).toBe('## First lesson\n\nLocal AI needs careful boundaries.');
  });

  it.each([
    ['missing opening delimiter', validFrontMatter.replace(/^---\n/, '')],
    ['missing closing delimiter', validFrontMatter.replace(/\n---$/, '')],
    ['duplicate field', validFrontMatter.replace('slug: ', 'id: "duplicate"\nslug: ')],
    ['unknown field', validFrontMatter.replace('\n---', '\nextra: "no"\n---')],
  ])('rejects %s', (_label, source) => {
    expect(() => parseBlogDocument(source, 'article.en.md')).toThrow(FrontMatterError);
  });

  it.each([
    ['unquoted scalar', 'id: juana-build-01'],
    ['object value', 'id: {"unsafe":true}'],
    ['numeric value', 'id: 42'],
    ['YAML alias', 'id: *article'],
    ['YAML tag', 'id: !js/function "return process"'],
  ])('rejects non-contract value: %s', (_label, replacement) => {
    const source = validFrontMatter.replace('id: "juana-build-01"', replacement);
    expect(() => parseBlogDocument(source, 'article.en.md')).toThrow(FrontMatterError);
  });

  it.each(['__proto__', 'prototype', 'constructor'])(
    'rejects prototype-pollution field %s',
    (field) => {
      const source = validFrontMatter.replace('\n---', `\n${field}: "unsafe"\n---`);
      expect(() => parseBlogDocument(source, 'article.en.md')).toThrow(FrontMatterError);
    },
  );

  it.each([
    ['en', 'local-reviewed'],
    ['es', 'original'],
  ])('rejects language %s with translation %s', (language, translation) => {
    const source = validFrontMatter
      .replace('language: "en"', `language: "${language}"`)
      .replace('translation: "original"', `translation: "${translation}"`);
    expect(() => parseBlogDocument(source, 'article.en.md')).toThrow(FrontMatterError);
  });

  it('never evaluates JavaScript-like input and keeps errors body-free', () => {
    const marker = 'SENSITIVE_BODY_MARKER';
    const source = validFrontMatter.replace(
      'id: "juana-build-01"',
      'id: (() => globalThis.compromised = true)()',
    );

    let error: unknown;
    try {
      parseBlogDocument(`${source}\n\n${marker}`, 'article.en.md');
    } catch (caught) {
      error = caught;
    }

    expect(globalThis).not.toHaveProperty('compromised');
    expect(error).toBeInstanceOf(FrontMatterError);
    expect(String(error)).toContain('article.en.md');
    expect(String(error)).not.toContain(marker);
  });
});
