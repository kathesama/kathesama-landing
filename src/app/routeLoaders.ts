type BlogIndexModule = typeof import('../pages/BlogIndexPage');
type ArticleModule = typeof import('../pages/ArticlePage');

let blogIndexModule: BlogIndexModule | undefined;
let articleModule: ArticleModule | undefined;

async function loadBlogIndexPage(): Promise<BlogIndexModule> {
  if (!blogIndexModule) blogIndexModule = await import('../pages/BlogIndexPage');
  return blogIndexModule;
}

async function loadArticlePage(): Promise<ArticleModule> {
  if (!articleModule) articleModule = await import('../pages/ArticlePage');
  return articleModule;
}

export async function preloadAppRoute(url: string): Promise<void> {
  const pathname = new URL(url, 'https://kathesama.ar').pathname;

  if (pathname === '/blog') {
    await loadBlogIndexPage();
  } else if (pathname.startsWith('/blog/')) {
    await loadArticlePage();
  }
}

export function getHydrationRouteOverrides() {
  return {
    BlogIndexPage: blogIndexModule?.default,
    ArticlePage: articleModule?.default,
  };
}
