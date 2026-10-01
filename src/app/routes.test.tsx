import { useEffect, useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  Link,
  MemoryRouter,
  RouterProvider,
} from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { AppShell } from '../components/layout/AppShell';
import { LanguageProvider } from '../features/i18n/LanguageContext';

function DeferredAboutTarget() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setVisible(true), 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return visible ? <section id="about">About target</section> : null;
}

describe('application routes', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the real architecture page at /architecture?lang=en', async () => {
    render(
      <MemoryRouter initialEntries={['/architecture?lang=en']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole(
        'heading',
        { name: 'JuanaIA systems atlas' },
        { timeout: 5_000 },
      ),
    ).toBeVisible();
  });

  it('renders the real architecture page in Spanish', async () => {
    render(
      <MemoryRouter initialEntries={['/architecture?lang=es']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Atlas de sistemas de JuanaIA' }),
    ).toBeVisible();
    expect(
      screen.getByRole('navigation', { name: 'Navegación principal' }),
    ).toBeVisible();
  });

  it('renders the real blog index in English', async () => {
    render(
      <MemoryRouter initialEntries={['/blog?lang=en']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Field notes from building JuanaIA' }),
    ).toBeVisible();
  });

  it('matches the lazy article route before the global not-found route', async () => {
    render(
      <MemoryRouter
        initialEntries={['/blog/self-hosted-ai-latency-24-to-2?lang=en']}
      >
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'From 24 Seconds to 2: How I Optimized Response Times in a Self-Hosted AI Assistant',
      }, { timeout: 5_000 }),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument();
  });

  it('renders a localized not-found page with a language-preserving home link', () => {
    render(
      <MemoryRouter initialEntries={['/missing?lang=es']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/?lang=es',
    );
  });

  it('keeps the active language in every primary navigation link', () => {
    render(
      <MemoryRouter initialEntries={['/architecture?lang=es']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'KATHESAMA' })).toHaveAttribute(
      'href',
      '/?lang=es',
    );
    expect(screen.getByRole('link', { name: 'Arquitectura' })).toHaveAttribute(
      'href',
      '/architecture?lang=es',
    );
    expect(screen.getByRole('link', { name: 'Artículos' })).toHaveAttribute(
      'href',
      '/blog?lang=es',
    );
    expect(screen.getByRole('link', { name: 'Sobre mí' })).toHaveAttribute(
      'href',
      '/?lang=es#about',
    );
    expect(screen.getByRole('link', { name: 'Arquitectura' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Artículos' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('renders the migrated landing route inside the shared shell', () => {
    render(
      <MemoryRouter initialEntries={['/?lang=en']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Meet JuanaIA' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(document.querySelector('main')).toHaveAttribute('id', 'main-content');
  });

  it('focuses main content without scrolling on initial load, then resets scroll after a pathname change', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.mocked(window.scrollTo);
    render(
      <MemoryRouter initialEntries={['/blog?lang=en']}>
        <App />
      </MemoryRouter>,
    );

    const main = screen.getByRole('main');
    expect(main).toHaveFocus();
    expect(scrollTo).not.toHaveBeenCalled();

    await user.click(screen.getByRole('link', { name: 'Architecture' }));

    await waitFor(() => expect(main).toHaveFocus());
    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  });

  it('focuses and scrolls to a hash target that appears after cross-route navigation', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.spyOn(
      HTMLElement.prototype,
      'scrollIntoView',
    );
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const clearTimeout = vi.spyOn(window, 'clearTimeout');
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <LanguageProvider>
              <AppShell />
            </LanguageProvider>
          ),
          children: [
            {
              path: 'source',
              element: <Link to="/?lang=en#about">Go to about target</Link>,
            },
            { index: true, element: <DeferredAboutTarget /> },
          ],
        },
      ],
      { initialEntries: ['/source?lang=en'] },
    );

    render(<RouterProvider router={router} />);
    await user.click(screen.getByRole('link', { name: 'Go to about target' }));

    const target = await screen.findByText('About target');
    await waitFor(() => expect(target).toHaveFocus());
    expect(target).toHaveAttribute('tabindex', '-1');
    expect(scrollIntoView).toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
    expect(clearTimeout).toHaveBeenCalled();
  });

  it('disconnects hash observation when the destination never appears', () => {
    vi.useFakeTimers();
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');

    render(
      <MemoryRouter initialEntries={['/?lang=en#never-rendered']}>
        <App />
      </MemoryRouter>,
    );

    expect(disconnect).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1_000));
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('lets hash-only navigation focus the destination instead of main content', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <LanguageProvider>
              <AppShell />
            </LanguageProvider>
          ),
          children: [
            {
              index: true,
              element: (
                <>
                  <Link to="?lang=en#about">Jump to about</Link>
                  <section id="about">Hash-only target</section>
                </>
              ),
            },
          ],
        },
      ],
      { initialEntries: ['/?lang=en'] },
    );

    render(<RouterProvider router={router} />);
    const main = screen.getByRole('main');
    await user.click(screen.getByRole('link', { name: 'Jump to about' }));

    await waitFor(() =>
      expect(screen.getByText('Hash-only target')).toHaveFocus(),
    );
    expect(main).not.toHaveFocus();
  });
});

describe('animated grid lifecycle', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 27));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not schedule animation frames when reduced motion is requested', () => {
    render(
      <MemoryRouter initialEntries={['/?lang=en']}>
        <App />
      </MemoryRouter>,
    );

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('cancels the scheduled animation frame on cleanup', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/?lang=en']}>
        <App />
      </MemoryRouter>,
    );

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(27);
  });

  it('renders at a capped device pixel ratio without changing its CSS size', () => {
    const context = {
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      ((contextId: string) => (contextId === '2d' ? context : null)) as HTMLCanvasElement['getContext'],
    );
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(3);
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(800);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(600);

    render(
      <MemoryRouter initialEntries={['/?lang=en']}>
        <App />
      </MemoryRouter>,
    );

    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveAttribute('width', '1600');
    expect(canvas).toHaveAttribute('height', '1200');
    expect(canvas).toHaveStyle({ width: '800px', height: '600px' });
    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  });

  it('stops and restarts animation when the motion preference changes', () => {
    let motionListener: ((event: MediaQueryListEvent) => void) | undefined;
    const addEventListener = vi.fn(
      (type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === 'change') {
          motionListener = listener as (event: MediaQueryListEvent) => void;
        }
      },
    );
    const removeEventListener = vi.fn();
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener,
      removeEventListener,
      dispatchEvent: vi.fn(),
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/?lang=en']}>
        <App />
      </MemoryRouter>,
    );

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);

    act(() => motionListener?.({ matches: true } as MediaQueryListEvent));
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(27);

    act(() => motionListener?.({ matches: false } as MediaQueryListEvent));
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });
});
