import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { build } from 'vite';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let outputDirectory: string | undefined;

afterEach(async () => {
  if (outputDirectory) await rm(outputDirectory, { recursive: true, force: true });
  outputDirectory = undefined;
});

describe('production CSS boundary', () => {
  it('keeps lazy blog-index and long-form reader rules out of the initial stylesheet', async () => {
    outputDirectory = await mkdtemp(join(tmpdir(), 'kathesama-css-boundary-'));
    await build({
      root: projectRoot,
      logLevel: 'silent',
      build: { outDir: outputDirectory, emptyOutDir: true },
    });

    const html = await readFile(join(outputDirectory, 'index.html'), 'utf8');
    const initialCssHrefs = [...html.matchAll(/href="([^"]+\.css)"/g)].map((match) => match[1]!);
    expect(initialCssHrefs.length).toBeGreaterThan(0);

    const initialCss = (
      await Promise.all(
        initialCssHrefs.map((href) => readFile(join(outputDirectory!, href.replace(/^\//, '')), 'utf8')),
      )
    ).join('\n');
    const forbiddenInitialSelectors = [
      '.blog-index-page',
      '.article-page',
      '.article-reader-grid',
      '.article-body',
      '.code-block-scroll',
      '.medium-attribution',
    ];
    forbiddenInitialSelectors.forEach((selector) => expect(initialCss).not.toContain(selector));

    const assetDirectory = join(outputDirectory, 'assets');
    const emittedCss = (
      await Promise.all(
        (await readdir(assetDirectory))
          .filter((fileName) => fileName.endsWith('.css'))
          .map((fileName) => readFile(join(assetDirectory, fileName), 'utf8')),
      )
    ).join('\n');
    expect(emittedCss).toContain('.blog-index-page');
    expect(emittedCss).toContain('.article-body');
  }, 20_000);
});
