export const supportedLanguages = ['en', 'es'] as const;

export type Language = (typeof supportedLanguages)[number];

export function isLanguage(value: string | null): value is Language {
  return value === 'en' || value === 'es';
}

export function resolveLanguage(
  search: string,
  storedLanguage: string | null,
  browserLanguage: string,
): Language {
  const queryLanguage = new URLSearchParams(search).get('lang');

  if (isLanguage(queryLanguage)) return queryLanguage;
  if (isLanguage(storedLanguage)) return storedLanguage;
  if (browserLanguage.toLowerCase().startsWith('es')) return 'es';

  return 'en';
}

export function setLanguageInSearch(
  search: string,
  language: Language,
): string {
  const params = new URLSearchParams(search);
  params.set('lang', language);

  return `?${params.toString()}`;
}
