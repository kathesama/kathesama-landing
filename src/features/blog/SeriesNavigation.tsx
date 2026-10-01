import { Link } from 'react-router-dom';
import type { BlogCatalogItem, BlogLanguage } from '../../content/blog/types';

type SeriesNavigationProps = {
  language: BlogLanguage;
  previous?: BlogCatalogItem;
  next?: BlogCatalogItem;
};

export function SeriesNavigation({ language, previous, next }: SeriesNavigationProps) {
  const isSpanish = language === 'es';
  const articleHref = (slug: string) => `/blog/${slug}?lang=${language}`;

  return (
    <nav
      className="series-navigation"
      aria-label={isSpanish ? 'Navegación de la serie' : 'Series navigation'}
    >
      <Link className="series-back" to={`/blog?lang=${language}`}>
        ← {isSpanish ? 'Volver a la serie' : 'Back to the series'}
      </Link>
      <div className="series-neighbors">
        {previous ? (
          <Link to={articleHref(previous.slug)}>
            <span>{isSpanish ? 'Anterior' : 'Previous'}</span>
            {previous.title[language]}
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
        {next ? (
          <Link to={articleHref(next.slug)}>
            <span>{isSpanish ? 'Siguiente' : 'Next'}</span>
            {next.title[language]}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
