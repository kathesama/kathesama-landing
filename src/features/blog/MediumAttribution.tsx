import type { BlogLanguage, TranslationState } from '../../content/blog/types';

type MediumAttributionProps = {
  language: BlogLanguage;
  sourceUrl: string;
  translation: TranslationState;
};

export function MediumAttribution({
  language,
  sourceUrl,
  translation,
}: MediumAttributionProps) {
  const isSpanishTranslation = language === 'es' && translation === 'local-reviewed';

  return (
    <aside className="medium-attribution" aria-label={language === 'es' ? 'Fuente' : 'Source'}>
      <p>
        {isSpanishTranslation
          ? 'Esta edición es una traducción local revisada del original en inglés.'
          : 'Originally published in English on Medium.'}
      </p>
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
        {language === 'es' ? 'Leer el original en Medium ↗' : 'Read the original on Medium ↗'}
      </a>
    </aside>
  );
}
