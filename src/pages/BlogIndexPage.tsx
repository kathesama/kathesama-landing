import { blogCatalog } from '../content/blog/catalog';
import type { BlogCatalogItem } from '../content/blog/types';
import { FeaturedArticle } from '../features/blog/FeaturedArticle';
import { SeriesTimeline } from '../features/blog/SeriesTimeline';
import { useLanguage } from '../features/i18n/LanguageContext';
import { PageMetadata } from '../features/seo/PageMetadata.tsx';
import { buildBlogIndexMetadata } from '../features/seo/pageMetadata';
import '../styles/blog-index.css';

type BlogIndexPageProps = {
  catalog?: readonly BlogCatalogItem[];
};

const copy = {
  en: {
    eyebrow: 'KATHESAMA · FIELD NOTES',
    title: 'Field notes from building JuanaIA',
    statement: 'Architecture decisions, performance investigations, and the long path from remembering information to understanding it.',
    index: '04 notes · English originals · Spanish local editions',
  },
  es: {
    eyebrow: 'KATHESAMA · NOTAS DE CAMPO',
    title: 'Notas de campo construyendo JuanaIA',
    statement: 'Decisiones de arquitectura, investigaciones de rendimiento y el largo camino desde recordar información hasta comprenderla.',
    index: '04 notas · Originales en inglés · Ediciones locales en español',
  },
} as const;

export default function BlogIndexPage({ catalog = blogCatalog }: BlogIndexPageProps) {
  const { language } = useLanguage();
  const localized = copy[language];

  return (
    <>
      <PageMetadata metadata={buildBlogIndexMetadata(language)} />
      <div className="blog-index-page">
        <header className="blog-masthead">
          <div>
            <p className="blog-kicker">{localized.eyebrow}</p>
            <h1>{localized.title}</h1>
          </div>
          <div className="blog-masthead__statement">
            <p>{localized.statement}</p>
            <span>{localized.index}</span>
          </div>
        </header>
        <FeaturedArticle catalog={catalog} language={language} />
        <SeriesTimeline catalog={catalog} language={language} />
      </div>
    </>
  );
}
