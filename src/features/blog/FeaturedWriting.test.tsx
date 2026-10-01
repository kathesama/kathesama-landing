/// <reference types="vite/client" />

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageContext';
import featuredWritingSource from './FeaturedWriting.tsx?raw';
import { FeaturedWriting } from './FeaturedWriting';

function renderPreview(language: 'en' | 'es') {
  return render(
    <MemoryRouter initialEntries={[`/?lang=${language}`]}>
      <LanguageProvider>
        <FeaturedWriting />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe('FeaturedWriting', () => {
  it('presents CDKE as the strong lead and the other three stories as a compact signal line', () => {
    renderPreview('en');

    const preview = screen.getByTestId('featured-writing');
    const lead = within(preview).getByTestId('writing-lead');
    const signal = within(preview).getByRole('list', { name: 'Earlier field notes' });

    expect(lead).toHaveTextContent('When Your AI Has Photographic Memory But No Understanding');
    expect(within(signal).getAllByRole('listitem')).toHaveLength(3);
    expect(signal).toHaveTextContent('I’m Building a Personal AI That Lives on My PC');
    expect(signal).toHaveTextContent('I Gave My Local AI a Brain');
    expect(signal).toHaveTextContent('From 24 Seconds to 2');
    expect(signal).not.toHaveTextContent('Photographic Memory');
  });

  it('preserves language on every local writing link in both editions', () => {
    const { unmount } = renderPreview('en');

    screen.getAllByRole('link').forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^\/blog(?:\/[a-z0-9-]+)?\?lang=en$/);
    });

    unmount();
    renderPreview('es');
    expect(screen.getByRole('heading', { name: 'Última nota: una IA que investiga lo que no sabe' })).toBeVisible();
    screen.getAllByRole('link').forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^\/blog(?:\/[a-z0-9-]+)?\?lang=es$/);
    });
  });

  it('keeps the landing boundary metadata-only', () => {
    expect(featuredWritingSource).toContain("from '../../content/blog/catalog'");
    expect(featuredWritingSource).toContain("import '../../styles/featured-writing.css'");
    expect(featuredWritingSource).not.toContain("import '../../styles/blog.css'");
    expect(featuredWritingSource).not.toContain('articleDocuments');
    expect(featuredWritingSource).not.toContain('react-markdown');
    expect(featuredWritingSource).not.toContain('ArticleBody');
  });
});
