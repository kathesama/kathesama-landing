import { useParams } from 'react-router-dom';
import { blogCatalog } from '../content/blog/catalog';
import { getArticleDocument } from '../content/blog/articleDocuments';
import { estimateReadingMinutes, getArticleNeighbors } from '../content/blog/selectors';
import { ArticleBody } from '../features/blog/ArticleBody';
import { ArticleHeader } from '../features/blog/ArticleHeader';
import { BlogNotFound } from '../features/blog/BlogNotFound';
import { MediumAttribution } from '../features/blog/MediumAttribution';
import { SeriesNavigation } from '../features/blog/SeriesNavigation';
import { useLanguage } from '../features/i18n/LanguageContext';
import { PageMetadata } from '../features/seo/PageMetadata.tsx';
import { buildArticleMetadata } from '../features/seo/pageMetadata';
import '../styles/blog.css';

export default function ArticlePage() {
  const { slug = '' } = useParams();
  const { language } = useLanguage();
  const article = blogCatalog.find((item) => item.slug === slug);

  if (!article) return <BlogNotFound language={language} />;

  const document = getArticleDocument(article.id, language);
  if (!document) return <BlogNotFound language={language} />;

  const neighbors = getArticleNeighbors(blogCatalog, article.slug);
  const readingMinutes = estimateReadingMinutes(document.body);

  return (
    <>
      <PageMetadata metadata={buildArticleMetadata(article, language)} />
      <article className="article-page">
        <ArticleHeader
          article={article}
          language={language}
          readingMinutes={readingMinutes}
          translation={document.frontMatter.translation}
        />
        <div className="article-reader-grid">
          <MediumAttribution
            language={language}
            sourceUrl={document.frontMatter.sourceUrl}
            translation={document.frontMatter.translation}
          />
          <ArticleBody markdown={document.body} language={language} />
        </div>
        <SeriesNavigation language={language} {...neighbors} />
      </article>
    </>
  );
}
