import { formatBlogDate } from '../../content/blog/selectors';
import type { BlogCatalogItem, BlogLanguage, TranslationState } from '../../content/blog/types';

type ArticleHeaderProps = {
  article: BlogCatalogItem;
  language: BlogLanguage;
  readingMinutes: number;
  translation: TranslationState;
};

const labels = {
  en: {
    eyebrow: 'KATHESAMA / FIELD NOTES',
    issue: 'Juana build note',
    original: 'English original',
    translation: 'Locally reviewed translation',
    readingTime: (minutes: number) => `${minutes} min read`,
  },
  es: {
    eyebrow: 'KATHESAMA / NOTAS DE CAMPO',
    issue: 'Bitácora de construcción de Juana',
    original: 'Original en inglés',
    translation: 'Traducción local revisada',
    readingTime: (minutes: number) => `${minutes} min de lectura`,
  },
} as const;

export function ArticleHeader({
  article,
  language,
  readingMinutes,
  translation,
}: ArticleHeaderProps) {
  const copy = labels[language];

  return (
    <header className="article-header">
      <aside className="article-metadata" aria-label={language === 'es' ? 'Metadatos del artículo' : 'Article metadata'}>
        <p className="article-issue">
          {copy.issue} · {String(article.seriesOrder).padStart(2, '0')}
        </p>
        <time dateTime={article.publishedAt}>{formatBlogDate(article.publishedAt, language)}</time>
        <p>{copy.readingTime(readingMinutes)}</p>
        <p className="article-translation-state">
          {translation === 'original' ? copy.original : copy.translation}
        </p>
        <ul className="article-tags" aria-label={language === 'es' ? 'Etiquetas' : 'Tags'}>
          {article.tags[language].map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </aside>
      <div className="article-heading">
        <p className="section-header">{copy.eyebrow}</p>
        <h1>{article.title[language]}</h1>
        <p className="article-summary">{article.summary[language]}</p>
      </div>
    </header>
  );
}
