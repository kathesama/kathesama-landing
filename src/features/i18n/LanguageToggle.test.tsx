import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from './LanguageContext';
import { LanguageToggle } from './LanguageToggle';

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
      {location.hash}
    </output>
  );
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = 'en';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('changes language without losing the route, hash, or other query parameters', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={['/architecture?lang=en&ref=portfolio#services']}
      >
        <LanguageProvider>
          <LanguageToggle />
          <LocationProbe />
        </LanguageProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/architecture?lang=es&ref=portfolio#services',
    );
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(window.localStorage.getItem('kathesama-language')).toBe('es');
  });

  it('exposes the selected language through accessible pressed state', async () => {
    render(
      <MemoryRouter initialEntries={['/?lang=es']}>
        <LanguageProvider>
          <LanguageToggle />
        </LanguageProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(
      screen.getByRole('group', { name: 'Selección de idioma' }),
    ).toBeVisible();
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('lang', 'es');
      expect(window.localStorage.getItem('kathesama-language')).toBe('es');
    });
  });

  it('uses the browser language when reading local storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError');
    });
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('es-AR');

    render(
      <MemoryRouter initialEntries={['/architecture']}>
        <LanguageProvider>
          <LanguageToggle />
        </LanguageProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('lang', 'es');
    });
  });

  it('keeps the URL-selected language when writing local storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError');
    });

    render(
      <MemoryRouter initialEntries={['/architecture?lang=es']}>
        <LanguageProvider>
          <LanguageToggle />
        </LanguageProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('lang', 'es');
    });
  });

  it('does not add history when selecting the active language', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <LanguageProvider>
              <LanguageToggle />
            </LanguageProvider>
          ),
        },
      ],
      { initialEntries: ['/?lang=en'] },
    );

    render(<RouterProvider router={router} />);
    await user.click(screen.getByRole('button', { name: 'English' }));

    expect(router.state.historyAction).toBe('POP');
  });
});
