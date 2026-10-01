import { describe, expect, it } from 'vitest';

const styleModules = import.meta.glob('./*.css', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

function stylesheetContaining(selector: string): string {
  const stylesheet = Object.values(styleModules).find((source) => source.includes(selector));
  if (!stylesheet) throw new Error(`Missing stylesheet for ${selector}`);
  return stylesheet;
}

describe('blog index responsive styles', () => {
  it('lets every editorial grid child shrink without splitting display headings', () => {
    const styles = stylesheetContaining('.blog-index-page');

    expect(styles).toMatch(/\.blog-index-page\s*\{[^}]*min-width:\s*0;/);
    expect(styles).toMatch(/\.blog-masthead\s*>\s*\*[^}]*min-width:\s*0;/);
    expect(styles).toMatch(/\.blog-featured\s*>\s*\*[^}]*min-width:\s*0;/);
    expect(styles).toMatch(/\.series-timeline__content\s*\{[^}]*min-width:\s*0;/);
    expect(styles).not.toMatch(/hyphens:\s*auto;/);
    expect(styles).not.toMatch(/overflow-wrap:\s*anywhere;/);
  });

  it.each([
    '.blog-masthead h1',
    '.blog-featured__copy h2',
    '.series-timeline__header h2',
    '.series-timeline__content h3',
  ])('balances %s within a readable measure and forbids mid-word breaks', (selector) => {
    const styles = stylesheetContaining('.blog-index-page');
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const block = new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`).exec(styles)?.[1] ?? '';

    expect(block).toMatch(/max-(?:inline-)?size:\s*[^;]+;/);
    expect(block).toMatch(/font-size:\s*clamp\([^;]+\);/);
    expect(block).toMatch(/text-wrap:\s*balance;/);
    expect(block).toMatch(/hyphens:\s*none;/);
    expect(block).toMatch(/overflow-wrap:\s*normal;/);
    expect(block).toMatch(/word-break:\s*normal;/);
  });

  it('collapses editorial grids at 48rem and keeps at least 1rem inline padding at 24rem', () => {
    const styles = stylesheetContaining('.blog-index-page');

    expect(styles).toMatch(
      /@media\s*\(max-width:\s*48rem\)[\s\S]*?\.blog-masthead,[\s\S]*?\.blog-featured,[\s\S]*?\.series-timeline__header\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*24rem\)[\s\S]*?\.blog-index-page\s*\{[^}]*padding-right:\s*1rem;[^}]*padding-left:\s*1rem;/,
    );
  });

  it('preserves the complete CDKE diagram at its natural aspect ratio', () => {
    const styles = stylesheetContaining('.blog-index-page');

    expect(styles).toMatch(/\.blog-featured__artwork\s*\{[^}]*aspect-ratio:\s*1024\s*\/\s*683;/);
    expect(styles).toMatch(
      /\.blog-featured__artwork img\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto;[^}]*aspect-ratio:\s*1024\s*\/\s*683;[^}]*object-fit:\s*contain;/,
    );
    expect(styles).not.toMatch(/\.blog-featured__artwork img\s*\{[^}]*object-fit:\s*cover;/);
  });
});
