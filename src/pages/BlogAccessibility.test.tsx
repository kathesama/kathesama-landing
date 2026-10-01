import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

const styleModules = import.meta.glob('../styles/*.css', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const articleSlug = 'curiosity-driven-knowledge-enrichment';

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

async function expectAxeClean(container: HTMLElement, headingName: string) {
  await screen.findByRole('heading', { level: 1, name: headingName }, { timeout: 5_000 });
  const results = await axe(container);

  expect(results.violations).toEqual([]);
}

function headingLevels(container: HTMLElement): number[] {
  return [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((heading) =>
    Number(heading.tagName.slice(1)),
  );
}

function expectOrderedHeadings(container: HTMLElement) {
  const levels = headingLevels(container);

  expect(levels.filter((level) => level === 1)).toHaveLength(1);
  levels.slice(1).forEach((level, index) => {
    expect(level - levels[index]!).toBeLessThanOrEqual(1);
  });
}

describe('blog accessibility', () => {
  it.each([
    ['/blog?lang=en', 'Field notes from building JuanaIA'],
    ['/blog?lang=es', 'Notas de campo construyendo JuanaIA'],
  ])('has no detectable violations on %s', async (path, heading) => {
    const { container } = renderRoute(path);

    await expectAxeClean(container, heading);
    expectOrderedHeadings(container);
    expect(screen.getByRole('navigation', { name: path.endsWith('es') ? 'Navegación principal' : 'Primary navigation' })).toBeVisible();
    expect(screen.getByRole('region', { name: path.endsWith('es') ? 'Bitácora de construcción de JuanaIA' : 'The JuanaIA build log' })).toBeVisible();
    screen.getAllByRole('img').forEach((image) => {
      expect(image).toHaveAccessibleName();
    });
  });

  it.each([
    [
      `/blog/${articleSlug}?lang=en`,
      'When Your AI Has Photographic Memory But No Understanding: Designing Curiosity-Driven Knowledge Enrichment',
      'Primary navigation',
      'Series navigation',
      'Source',
      /Read the original on Medium/,
      /^Code block starting at line \d+$/,
    ],
    [
      `/blog/${articleSlug}?lang=es`,
      'Cuando tu IA tiene memoria fotográfica pero no comprensión: diseño de un enriquecimiento de conocimiento guiado por la curiosidad',
      'Navegación principal',
      'Navegación de la serie',
      'Fuente',
      /Leer el original en Medium/,
      /^Bloque de código desde la línea \d+$/,
    ],
  ])(
    'has no detectable violations and complete reader semantics on %s',
    async (path, heading, primaryNavigation, seriesNavigation, sourceName, sourceLink, codeLabel) => {
      const user = userEvent.setup();
      const { container } = renderRoute(path);

      await expectAxeClean(container, heading);
      expectOrderedHeadings(container);
      expect(screen.getByRole('navigation', { name: primaryNavigation })).toBeVisible();
      expect(screen.getByRole('navigation', { name: seriesNavigation })).toBeVisible();

      const source = screen.getByRole('complementary', { name: sourceName });
      expect(within(source).getByRole('link', { name: sourceLink })).toBeVisible();

      screen.getAllByRole('img').forEach((image) => {
        expect(image).toHaveAccessibleName();
      });

      const codeRegions = screen.getAllByRole('region', { name: codeLabel });
      expect(codeRegions.length).toBeGreaterThan(0);
      codeRegions.forEach((region) => expect(region).toHaveAttribute('tabindex', '0'));
      expect(new Set(codeRegions.map((region) => region.getAttribute('aria-label'))).size).toBe(
        codeRegions.length,
      );

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      await user.tab();
      const skipLink = screen.getByRole('link', {
        name: path.endsWith('es') ? 'Saltar al contenido' : 'Skip to content',
      });
      expect(skipLink).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('main')).toHaveFocus();
    },
  );

  it.each([
    ['/blog/not-a-real-article?lang=en', 'Article not found', 'Primary navigation'],
    ['/blog/not-a-real-article?lang=es', 'Artículo no encontrado', 'Navegación principal'],
  ])('has no detectable violations on localized fallback %s', async (path, heading, navigation) => {
    const { container } = renderRoute(path);

    await expectAxeClean(container, heading);
    expectOrderedHeadings(container);
    expect(screen.getByRole('navigation', { name: navigation })).toBeVisible();
  });

  it('keeps focus and reduced-motion safeguards explicit in the shipped styles', async () => {
    const globalStyles = styleModules['../styles/global.css'] ?? '';
    const indexStyles = styleModules['../styles/blog-index.css'] ?? '';
    const articleStyles = styleModules['../styles/blog.css'] ?? '';

    expect(globalStyles).toMatch(/:focus-visible\s*\{[^}]*outline:/);
    expect(globalStyles).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(indexStyles).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation:\s*none;/);
    expect(indexStyles).toMatch(
      /\.blog-masthead h1\s*\{[^}]*font-size:\s*clamp\(2\.75rem,\s*4\.25vw,\s*4\.25rem\);/,
    );
    expect(indexStyles).toMatch(/\.blog-masthead h1\s*\{[^}]*overflow-wrap:\s*normal;/);
    expect(indexStyles).toMatch(
      /\.blog-featured__copy h2\s*\{[^}]*font-size:\s*clamp\(1\.25rem,\s*2vw,\s*1\.75rem\);/,
    );
    expect(indexStyles).toMatch(/\.blog-featured__copy h2\s*\{[^}]*overflow-wrap:\s*normal;/);
    expect(indexStyles).toMatch(/\.series-timeline__header h2\s*\{[^}]*overflow-wrap:\s*normal;/);
    expect(indexStyles).toMatch(/\.series-timeline__content h3\s*\{[^}]*overflow-wrap:\s*normal;/);
    expect(articleStyles).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.article-page[\s\S]*?opacity:\s*1;/,
    );
    expect(articleStyles).toMatch(/\.article-heading\s*\{[^}]*min-width:\s*0;/);
    expect(articleStyles).toMatch(/\.article-heading h1\s*\{[^}]*max-inline-size:\s*20ch;/);
    expect(articleStyles).toMatch(
      /\.article-heading h1\s*\{[^}]*font-size:\s*clamp\(2\.5rem,\s*4vw,\s*3\.5rem\);/,
    );
    expect(articleStyles).toMatch(/\.article-heading h1\s*\{[^}]*text-wrap:\s*balance;/);
    expect(articleStyles).toMatch(/\.article-heading h1\s*\{[^}]*hyphens:\s*none;/);
    expect(articleStyles).toMatch(/\.article-heading h1\s*\{[^}]*overflow-wrap:\s*normal;/);
    expect(articleStyles).toMatch(/\.article-heading h1\s*\{[^}]*word-break:\s*normal;/);
    expect(articleStyles).toMatch(
      /@media\s*\(max-width:\s*48rem\)[\s\S]*?\.article-heading h1\s*\{[^}]*font-size:\s*clamp\([^;]+\);/,
    );
    expect(articleStyles).toMatch(
      /@media\s*\(max-width:\s*26\.25rem\)[\s\S]*?\.article-heading h1\s*\{[^}]*font-size:\s*clamp\([^;]+\);/,
    );
    expect(articleStyles).toMatch(
      /\.article-body\s+:not\(pre\)\s*>\s*code\s*\{[^}]*overflow-wrap:\s*anywhere;/,
    );
    expect(articleStyles).toMatch(
      /\.article-body a\s*\{[^}]*overflow-wrap:\s*anywhere;/,
    );
    expect(articleStyles).toMatch(
      /\.article-body p\s*\{[^}]*overflow-wrap:\s*anywhere;/,
    );

    renderRoute(`/blog/${articleSlug}?lang=en`);
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'When Your AI Has Photographic Memory But No Understanding: Designing Curiosity-Driven Knowledge Enrichment',
    });
    expect(heading).toBeVisible();
    expect(document.querySelector('.article-body')).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Series navigation' })).toBeVisible();
  });
});
