import { describe, expect, it } from 'vitest';
import { resolveLanguage, setLanguageInSearch } from './language';

describe('resolveLanguage', () => {
  it('prefers a valid URL language', () => {
    expect(resolveLanguage('?lang=es', 'en', 'en-US')).toBe('es');
  });

  it('falls back from an invalid URL language to a valid stored preference', () => {
    expect(resolveLanguage('?lang=pt', 'es', 'en-US')).toBe('es');
  });

  it('falls back from invalid URL and storage values to the browser language', () => {
    expect(resolveLanguage('?lang=pt', 'pt', 'es-AR')).toBe('es');
  });

  it('falls back to the browser language when no earlier preference exists', () => {
    expect(resolveLanguage('', null, 'es-AR')).toBe('es');
  });

  it('uses English when no supported language can be resolved', () => {
    expect(resolveLanguage('?lang=pt', null, 'pt-BR')).toBe('en');
  });
});

describe('setLanguageInSearch', () => {
  it('preserves unrelated query parameters', () => {
    expect(setLanguageInSearch('?ref=medium&lang=en', 'es')).toBe(
      '?ref=medium&lang=es',
    );
  });
});
