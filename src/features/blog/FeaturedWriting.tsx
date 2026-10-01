import { Link } from 'react-router-dom';
import { blogCatalog } from '../../content/blog/catalog';
import { getFeaturedArticle, getOrderedArticles } from '../../content/blog/selectors';
import { useLanguage } from '../i18n/LanguageContext';
import '../../styles/featured-writing.css';

const copy = {
  en: {
    eyebrow: 'Writing · Juana field notes',
    title: 'Latest field note: an AI that investigates what it doesn’t know',
    summary: 'A four-part record of the decisions, failures, and systems work behind a private local AI.',
    leadLabel: 'Latest · Issue 04',
    earlier: 'Earlier field notes',
    all: 'Read the complete field notes',
  },
  es: {
    eyebrow: 'Artículos · Notas de campo de Juana',
    title: 'Última nota: una IA que investiga lo que no sabe',
    summary: 'Un registro en cuatro partes sobre las decisiones, fallas y trabajo de sistemas detrás de una IA local privada.',
    leadLabel: 'Última · Edición 04',
    earlier: 'Notas de campo anteriores',
    all: 'Leer todas las notas de campo',
  },
} as const;

export function FeaturedWriting() {
  const { language } = useLanguage();
  const localized = copy[language];
  const featured = getFeaturedArticle(blogCatalog);
  const earlier = getOrderedArticles(blogCatalog).filter((article) => !article.featured);

  return (
    <section
      className="featured-writing"
      aria-labelledby="featured-writing-title"
      data-testid="featured-writing"
    >
      <div className="featured-writing__intro">
        <p className="section-header">{localized.eyebrow}</p>
        <h2 className="section-title" id="featured-writing-title">
          {localized.title}
        </h2>
        <p>{localized.summary}</p>
        <Link className="featured-writing__all" to={`/blog?lang=${language}`}>
          {localized.all} <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="featured-writing__signal">
        <div className="featured-writing__lead" data-testid="writing-lead">
          <p>{localized.leadLabel}</p>
          <h3>
            <Link to={`/blog/${featured.slug}?lang=${language}`}>
              {featured.title[language]}
            </Link>
          </h3>
          <span className="featured-writing__pulse" aria-hidden="true" />
        </div>

        <ol aria-label={localized.earlier} className="featured-writing__earlier">
          {earlier.map((article) => (
            <li key={article.id}>
              <span aria-hidden="true">{String(article.seriesOrder).padStart(2, '0')}</span>
              <Link to={`/blog/${article.slug}?lang=${language}`}>
                {article.title[language]}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
