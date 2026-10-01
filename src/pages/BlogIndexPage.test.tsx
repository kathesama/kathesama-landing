import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { blogCatalog } from '../content/blog/catalog';
import { LanguageProvider } from '../features/i18n/LanguageContext';
import BlogIndexPage from './BlogIndexPage';

function renderIndex(language: 'en' | 'es', catalog = blogCatalog) {
  return render(
    <MemoryRouter initialEntries={[`/blog?lang=${language}`]}>
      <LanguageProvider>
        <BlogIndexPage catalog={catalog} />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe('BlogIndexPage', () => {
  const cdkeTitle = {
    en: 'When Your AI Has Photographic Memory But No Understanding: Designing Curiosity-Driven Knowledge Enrichment',
    es: 'Cuando tu IA tiene memoria fotográfica pero no comprensión: diseño de un enriquecimiento de conocimiento guiado por la curiosidad',
  } as const;

  it('selects CDKE as the editorial lead even when the catalog is shuffled', () => {
    const shuffled = [blogCatalog[2]!, blogCatalog[3]!, blogCatalog[0]!, blogCatalog[1]!];
    renderIndex('en', shuffled);

    const featured = screen.getByTestId('featured-article');
    expect(
      within(featured).getByRole('heading', {
        name: cdkeTitle.en,
      }),
    ).toBeVisible();
    expect(within(featured).getByRole('img')).toHaveAttribute(
      'src',
      '/images/blog/curiosity-driven-knowledge-enrichment/cdke-architecture.png',
    );
    expect(within(featured).getByRole('img')).toHaveAttribute('width', '1024');
    expect(within(featured).getByRole('img')).toHaveAttribute('height', '683');
  });

  it('renders the complete series once in stable order, including the featured story only in the timeline', () => {
    renderIndex('en');

    const timeline = screen.getByRole('region', { name: 'The JuanaIA build log' });
    const entries = within(timeline).getAllByRole('listitem');

    expect(entries).toHaveLength(4);
    expect(entries.map((entry) => entry.getAttribute('data-series-order'))).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
    expect(entries.map((entry) => within(entry).getByTestId('issue-number').textContent)).toEqual([
      '01',
      '02',
      '03',
      '04',
    ]);
    expect(entries[0]).toHaveTextContent('I’m Building a Personal AI That Lives on My PC');
    expect(entries[3]).toHaveTextContent('When Your AI Has Photographic Memory');

    const featured = screen.getByRole('region', { name: cdkeTitle.en });
    expect(within(featured).getAllByRole('heading', { name: cdkeTitle.en })).toHaveLength(1);
    expect(within(timeline).getAllByRole('heading', { name: cdkeTitle.en })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { name: cdkeTitle.en })).toHaveLength(2);
  });

  it('keeps the shuffled Spanish edition ordered, local, and free of extra CDKE copies', () => {
    const shuffled = [blogCatalog[3]!, blogCatalog[1]!, blogCatalog[0]!, blogCatalog[2]!];
    renderIndex('es', shuffled);

    const featured = screen.getByRole('region', { name: cdkeTitle.es });
    const timeline = screen.getByRole('region', { name: 'Bitácora de construcción de JuanaIA' });
    const entries = within(timeline).getAllByRole('listitem');

    expect(entries.map((entry) => entry.getAttribute('data-series-order'))).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
    expect(entries.map((entry) => within(entry).getByTestId('issue-number').textContent)).toEqual([
      '01',
      '02',
      '03',
      '04',
    ]);
    expect(entries.map((entry) => within(entry).getByRole('heading').textContent)).toEqual(
      [...blogCatalog]
        .sort((left, right) => left.seriesOrder - right.seriesOrder)
        .map((article) => article.title.es),
    );

    const featuredImage = within(featured).getByRole('img');
    expect(featuredImage).toHaveAttribute(
      'src',
      '/images/blog/curiosity-driven-knowledge-enrichment/cdke-architecture.png',
    );
    expect(document.querySelectorAll('img[src^="/images/blog/"]')).toHaveLength(1);
    expect(within(featured).getAllByRole('heading', { name: cdkeTitle.es })).toHaveLength(1);
    expect(within(timeline).getAllByRole('heading', { name: cdkeTitle.es })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { name: cdkeTitle.es })).toHaveLength(2);
  });

  it('keeps every article link local and preserves English in the query string', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderIndex('en');

    const articleLinks = screen.getAllByRole('link').filter((link) =>
      link.getAttribute('href')?.startsWith('/blog/'),
    );
    expect(articleLinks).toHaveLength(5);
    articleLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', expect.stringMatching(/^\/blog\/[a-z0-9-]+\?lang=en$/));
    });

    const imageSources = screen.getAllByRole('img').map((image) => image.getAttribute('src'));
    expect(imageSources.every((source) => source?.startsWith('/images/blog/'))).toBe(true);
    expect(document.body.innerHTML).not.toContain('cdn-images-1.medium.com');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses stable UTC dates and one clear page heading in English', () => {
    renderIndex('en');

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Field notes from building JuanaIA' })).toBeVisible();
    expect(screen.getByText('KATHESAMA · FIELD NOTES')).toBeVisible();
    expect(screen.getByText('Featured field note')).toBeVisible();
    expect(
      screen.getByTestId('featured-article').querySelector('.blog-featured__action'),
    ).toHaveTextContent(/^Read/);
    expect(screen.getAllByText(/^Open note/)).toHaveLength(4);
    expect(screen.getByText('March 14, 2026')).toBeVisible();
    expect(screen.getAllByText('May 10, 2026')).toHaveLength(2);
  });

  it('keeps the featured title in one semantic h2 link without manual line fragments', () => {
    renderIndex('en');

    const featured = screen.getByTestId('featured-article');
    const heading = within(featured).getByRole('heading', { level: 2, name: cdkeTitle.en });
    const links = within(heading).getAllByRole('link', { name: cdkeTitle.en });

    expect(links).toHaveLength(1);
    expect(heading.querySelector('br, wbr')).toBeNull();
    expect(
      Array.from(links[0]!.children).filter(
        (child) => !child.classList.contains('blog-link-arrow'),
      ),
    ).toHaveLength(0);
  });

  it('renders every timeline title as one h3 containing one article link', () => {
    renderIndex('en');

    const timeline = screen.getByRole('region', { name: 'The JuanaIA build log' });
    const headings = within(timeline).getAllByRole('heading', { level: 3 });
    const orderedArticles = [...blogCatalog].sort(
      (left, right) => left.seriesOrder - right.seriesOrder,
    );

    expect(headings).toHaveLength(orderedArticles.length);
    headings.forEach((heading, index) => {
      expect(
        within(heading).getAllByRole('link', { name: orderedArticles[index]!.title.en }),
      ).toHaveLength(1);
      expect(heading.querySelector('br, wbr')).toBeNull();
    });
  });

  it('renders fully localized Spanish editorial copy, dates, landmark, and links', () => {
    renderIndex('es');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Notas de campo construyendo JuanaIA' }),
    ).toBeVisible();
    expect(screen.getByText('KATHESAMA · NOTAS DE CAMPO')).toBeVisible();
    expect(screen.getByText('Nota de campo destacada')).toBeVisible();
    expect(
      screen.getByTestId('featured-article').querySelector('.blog-featured__action'),
    ).toHaveTextContent(/^Leer/);
    expect(screen.getAllByText(/^Abrir nota/)).toHaveLength(4);
    expect(screen.getByRole('region', { name: 'Bitácora de construcción de JuanaIA' })).toBeVisible();
    expect(screen.getByText('14 de marzo de 2026')).toBeVisible();
    expect(screen.getAllByText('10 de mayo de 2026')).toHaveLength(2);

    screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/blog/'))
      .forEach((link) => expect(link.getAttribute('href')).toMatch(/\?lang=es$/));
  });
});
