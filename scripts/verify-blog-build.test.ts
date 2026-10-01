import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { prerenderPublicRoutes } from './prerender-public-routes';
import { verifyBlogBuild } from './verify-blog-build';

const template = `<!doctype html><html lang="en"><head><title>Fallback</title><link rel="stylesheet" href="/assets/site.css"></head><body><div id="root"></div><script type="module" src="/assets/site.js"></script></body></html>`;

async function createBuildWithTracker(tracker: string): Promise<string> {
  const outputDir = await mkdtemp(join(tmpdir(), 'kathesama-verify-'));
  await prerenderPublicRoutes({
    outputDir,
    template,
    render: async (url) =>
      url === '/architecture?lang=en'
        ? '<main class="architecture-page">Architecture</main>'
        : url === '/blog?lang=en'
          ? '<main class="blog-index-page">Blog</main>'
          : '<article class="article-body">Article</article>',
  });
  await mkdir(join(outputDir, 'assets'), { recursive: true });
  await writeFile(join(outputDir, 'assets', 'tracker.js'), `fetch(${JSON.stringify(tracker)})`, 'utf8');
  return outputDir;
}

describe('verifyBlogBuild', () => {
  it.each(['https://medium.com/_/stat', '/_/stat'])('rejects the Medium tracker endpoint %s', async (tracker) => {
    const outputDir = await createBuildWithTracker(tracker);

    await expect(verifyBlogBuild(outputDir)).rejects.toThrow(/tracking endpoint/i);
  });
});
