import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseBlogDocument } from '../src/content/blog/frontMatter';
import type { BlogCatalogItem } from '../src/content/blog/types';
import {
  validateBlogContent,
  validateNoPublishedSourceArtifacts,
} from '../src/content/blog/validation';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const articlesDirectory = resolve(projectRoot, 'content/blog/articles');
const catalogPath = resolve(projectRoot, 'src/content/blog/catalog.ts');
const imageDirectory = resolve(projectRoot, 'public/images/blog');
const publicDirectory = resolve(projectRoot, 'public');
const distributionDirectory = resolve(projectRoot, 'dist');

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(directory: string): Promise<string[]> {
  if (!(await exists(directory))) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return files.flat();
}

export async function validateAuthoredBlog(): Promise<void> {
  const publishedPaths = (
    await Promise.all([listFiles(publicDirectory), listFiles(distributionDirectory)])
  )
    .flat()
    .map((path) => relative(projectRoot, path).replaceAll('\\', '/'));
  validateNoPublishedSourceArtifacts(publishedPaths);

  const [hasArticles, hasCatalog] = await Promise.all([
    exists(articlesDirectory),
    exists(catalogPath),
  ]);

  if (!hasArticles && !hasCatalog) {
    console.log('blog: authored corpus not present yet; contract validation deferred');
    return;
  }
  if (!hasArticles || !hasCatalog) {
    throw new Error('Blog catalog and authored article directory must be introduced together');
  }

  const catalogModule = (await import(pathToFileURL(catalogPath).href)) as {
    blogCatalog?: BlogCatalogItem[];
  };
  if (!Array.isArray(catalogModule.blogCatalog)) {
    throw new Error('Blog catalog must export blogCatalog');
  }

  const articleFiles = (await listFiles(articlesDirectory))
    .filter((path) => path.endsWith('.md'))
    .sort();
  const documents = await Promise.all(
    articleFiles.map(async (path) =>
      parseBlogDocument(await readFile(path, 'utf8'), relative(projectRoot, path).replaceAll('\\', '/')),
    ),
  );
  const assetPaths = (await listFiles(imageDirectory)).map((path) =>
    relative(projectRoot, path).replaceAll('\\', '/'),
  );
  const summary = validateBlogContent({
    catalog: catalogModule.blogCatalog,
    documents,
    assetPaths,
  });

  console.log(
    `blog: ${summary.articleCount} articles, ${summary.documentCount} localized documents, ${summary.imageCount} images`,
  );
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (entryPath === fileURLToPath(import.meta.url)) {
  validateAuthoredBlog().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Blog validation failed');
    process.exitCode = 1;
  });
}
