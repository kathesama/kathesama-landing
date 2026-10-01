import { Link } from 'react-router-dom';
import type { BlogLanguage } from '../../content/blog/types';

export function BlogNotFound({ language }: { language: BlogLanguage }) {
  const isSpanish = language === 'es';

  return (
    <section className="blog-not-found">
      <p className="section-header">404 / WRITING</p>
      <h1>{isSpanish ? 'Artículo no encontrado' : 'Article not found'}</h1>
      <p>
        {isSpanish
          ? 'Esta nota no forma parte de la serie publicada.'
          : 'This note is not part of the published series.'}
      </p>
      <div className="blog-not-found-links">
        <Link to={`/blog?lang=${language}`}>{isSpanish ? 'Ver artículos' : 'Browse writing'}</Link>
        <Link to={`/?lang=${language}`}>{isSpanish ? 'Volver al inicio' : 'Back home'}</Link>
      </div>
    </section>
  );
}
