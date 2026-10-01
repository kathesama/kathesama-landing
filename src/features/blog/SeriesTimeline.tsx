import { Link } from 'react-router-dom';
import { formatBlogDate, getOrderedArticles } from '../../content/blog/selectors';
import type { BlogCatalogItem, BlogLanguage } from '../../content/blog/types';

type SeriesTimelineProps = {
  catalog: readonly BlogCatalogItem[];
  language: BlogLanguage;
};

const copy = {
  en: {
    eyebrow: 'Series 01—04',
    title: 'The JuanaIA build log',
    summary: 'Four systems notes, ordered as the project evolved from local assistant to governed knowledge engine.',
    read: 'Open note',
  },
  es: {
    eyebrow: 'Serie 01—04',
    title: 'Bitácora de construcción de JuanaIA',
    summary: 'Cuatro notas de sistemas, ordenadas desde el asistente local hasta el motor de conocimiento gobernado.',
    read: 'Abrir nota',
  },
} as const;

export function SeriesTimeline({ catalog, language }: SeriesTimelineProps) {
  const localized = copy[language];
  const articles = getOrderedArticles(catalog);

  return (
    <section className="series-timeline" aria-labelledby="series-timeline-title">
      <header className="series-timeline__header">
        <div>
          <p className="blog-kicker">{localized.eyebrow}</p>
          <h2 id="series-timeline-title">{localized.title}</h2>
        </div>
        <p>{localized.summary}</p>
      </header>

      <ol className="series-timeline__list">
        {articles.map((article) => (
          <li
            className="series-timeline__entry"
            data-series-order={article.seriesOrder}
            key={article.id}
          >
            <span className="series-timeline__number" data-testid="issue-number">
              {String(article.seriesOrder).padStart(2, '0')}
            </span>
            <div className="series-timeline__content">
              <time dateTime={article.publishedAt}>
                {formatBlogDate(article.publishedAt, language)}
              </time>
              <h3>
                <Link to={`/blog/${article.slug}?lang=${language}`}>
                  {article.title[language]}
                </Link>
              </h3>
              <p>{article.summary[language]}</p>
              <div className="series-timeline__tags" aria-label={language === 'es' ? 'Temas' : 'Topics'}>
                {article.tags[language].map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <span className="series-timeline__action" aria-hidden="true">
              {localized.read} ↗
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
