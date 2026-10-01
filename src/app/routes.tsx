import { lazy, Suspense, type ComponentType } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { BlogRouteFallback } from '../features/blog/BlogRouteFallback';
import { useLanguage } from '../features/i18n/LanguageContext';
import { LandingPage } from '../pages/LandingPage';
import { NotFoundPage } from '../pages/NotFoundPage';

const ArchitecturePage = lazy(() => import('../pages/ArchitecturePage'));
const BlogIndexPage = lazy(() => import('../pages/BlogIndexPage'));
const ArticlePage = lazy(() => import('../pages/ArticlePage'));

export interface AppRouteOverrides {
  BlogIndexPage?: ComponentType;
  ArticlePage?: ComponentType;
}

function ArchitectureRoute() {
  const { language } = useLanguage();

  return (
    <Suspense
      fallback={
        <p className="route-loading" role="status">
          {language === 'es' ? 'Cargando atlas…' : 'Loading atlas…'}
        </p>
      }
    >
      <ArchitecturePage />
    </Suspense>
  );
}

function ArticleRoute({ Override }: { Override?: ComponentType }) {
  if (Override) return <Override />;

  return (
    <Suspense fallback={<BlogRouteFallback />}>
      <ArticlePage />
    </Suspense>
  );
}

function BlogIndexRoute({ Override }: { Override?: ComponentType }) {
  if (Override) return <Override />;

  return (
    <Suspense fallback={<BlogRouteFallback />}>
      <BlogIndexPage />
    </Suspense>
  );
}

export function AppRoutes({ overrides = {} }: { overrides?: AppRouteOverrides }) {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LandingPage />} />
        <Route path="architecture" element={<ArchitectureRoute />} />
        <Route path="blog" element={<BlogIndexRoute Override={overrides.BlogIndexPage} />} />
        <Route path="blog/:slug" element={<ArticleRoute Override={overrides.ArticlePage} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
