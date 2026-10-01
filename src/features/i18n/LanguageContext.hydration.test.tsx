import { render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider, useLanguage } from './LanguageContext';

function LanguageProbe() {
  const { language } = useLanguage();
  return <p data-testid="language">{language}</p>;
}

describe('LanguageProvider hydration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = 'en';
    vi.restoreAllMocks();
  });

  it('keeps explicitly seeded server markup in English even when the route asks for Spanish', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/blog/juana-orchestration-layer?lang=es']}>
        <LanguageProvider initialLanguage="en">
          <LanguageProbe />
        </LanguageProvider>
      </MemoryRouter>,
    );

    expect(html).toContain('>en<');
    expect(html).not.toContain('>es<');
  });

  it('switches a seeded first render to the query language without changing the route', async () => {
    window.history.replaceState({}, '', '/blog/juana-orchestration-layer?lang=es');

    render(
      <MemoryRouter initialEntries={['/blog/juana-orchestration-layer?lang=es']}>
        <LanguageProvider initialLanguage="en">
          <LanguageProbe />
        </LanguageProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('language')).toHaveTextContent('es'));
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(window.location.pathname).toBe('/blog/juana-orchestration-layer');
  });

  it('keeps the query-storage-browser-English fallback order for normal SPA mounts', () => {
    window.localStorage.setItem('kathesama-language', 'es');
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('en-US');

    render(
      <MemoryRouter initialEntries={['/blog?lang=invalid']}>
        <LanguageProvider>
          <LanguageProbe />
        </LanguageProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('language')).toHaveTextContent('es');
  });
});
