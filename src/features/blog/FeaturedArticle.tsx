import { Link } from 'react-router-dom';
import { formatBlogDate, getFeaturedArticle } from '../../content/blog/selectors';
import type { BlogCatalogItem, BlogLanguage } from '../../content/blog/types';

type FeaturedArticleProps = {
  catalog: readonly BlogCatalogItem[];
  language: BlogLanguage;
};

const copy = {
  en: {
    eyebrow: 'Featured field note',
    issue: 'Issue',
    topic: 'Knowledge systems',
    action: 'Read the field note',
  },
  es: {
    eyebrow: 'Nota de campo destacada',
    issue: 'Edición',
    topic: 'Sistemas de conocimiento',
    action: 'Leer la nota de campo',
  },
} as const;

export function FeaturedArticle({ catalog, language }: FeaturedArticleProps) {
  const article = getFeaturedArticle(catalog);
  const localized = copy[language];

  return (
    <section
      className="blog-featured"
      aria-labelledby="featured-article-title"
      data-testid="featured-article"
    >
      <div className="blog-featured__artwork">
        <span className="blog-featured__issue" aria-hidden="true">
          {String(article.seriesOrder).padStart(2, '0')}
        </span>
        <img
          src={article.coverPath}
          alt={article.coverAlt[language]}
          width="1024"
          height="683"
        />
      </div>

      <div className="blog-featured__copy">
        <p className="blog-kicker">{localized.eyebrow}</p>
        <p className="blog-featured__meta">
          <span>
            {localized.issue} {String(article.seriesOrder).padStart(2, '0')} · {localized.topic}
          </span>
          <time dateTime={article.publishedAt}>
            {formatBlogDate(article.publishedAt, language)}
          </time>
        </p>
        <h2 id="featured-article-title">
          <Link to={`/blog/${article.slug}?lang=${language}`}>
            {article.title[language]}
            <span className="blog-link-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        </h2>
        <p className="blog-featured__summary">{article.summary[language]}</p>
        <div className="blog-featured__tags" aria-label={language === 'es' ? 'Temas' : 'Topics'}>
          {article.tags[language].map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p className="blog-featured__action" aria-hidden="true">
          {localized.action} <span>→</span>
        </p>
      </div>
    </section>
  );
}
