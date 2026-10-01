import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageContext';
import { BlogRouteFallback } from './BlogRouteFallback';

function renderFallback(language: 'en' | 'es') {
  return render(
    <MemoryRouter initialEntries={[`/blog?lang=${language}`]}>
      <LanguageProvider>
        <BlogRouteFallback />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe('BlogRouteFallback', () => {
  it('uses neutral English copy for both index and article loading states', () => {
    renderFallback('en');
    expect(screen.getByRole('status')).toHaveTextContent('Loading writing…');
    expect(screen.getByRole('status')).not.toHaveTextContent('Loading article');
  });

  it('uses neutral Spanish copy for both index and article loading states', () => {
    renderFallback('es');
    expect(screen.getByRole('status')).toHaveTextContent('Cargando artículos…');
    expect(screen.getByRole('status')).not.toHaveTextContent('Cargando artículo…');
  });
});
