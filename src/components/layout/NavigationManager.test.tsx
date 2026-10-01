import { StrictMode, useEffect, useRef, useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationManager } from './NavigationManager';

function TestShell() {
  const mainRef = useRef<HTMLElement>(null);

  return (
    <>
      <NavigationManager mainRef={mainRef} />
      <main ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}

function DeferredTarget() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setVisible(true), 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return visible ? <section id="target">Delayed target</section> : null;
}

function renderNavigation(
  initialEntries: string[],
  children: RouteObject[],
  initialIndex?: number,
  strictMode = false,
) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <TestShell />,
        children,
      },
    ],
    { initialEntries, initialIndex },
  );

  const application = <RouterProvider router={router} />;

  return {
    router,
    ...render(strictMode ? <StrictMode>{application}</StrictMode> : application),
  };
}

async function navigate(
  router: ReturnType<typeof createMemoryRouter>,
  destination: string | number,
  options?: { replace?: boolean },
) {
  await act(async () => {
    if (typeof destination === 'number') {
      await router.navigate(destination);
      return;
    }

    await router.navigate(destination, options);
  });
}

describe('NavigationManager', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('focuses main with preventScroll on an initial location without a hash and does not scroll', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const scrollTo = vi.mocked(window.scrollTo);

    renderNavigation(['/page?lang=en'], [{ path: 'page', element: <p>Page</p> }]);

    expect(screen.getByRole('main')).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('focuses and scrolls an immediate hash target on the initial location', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const scrollTo = vi.mocked(window.scrollTo);

    renderNavigation(['/page?lang=en#target'], [
      { path: 'page', element: <section id="target">Target</section> },
    ]);

    const target = screen.getByText('Target');
    expect(target).toHaveFocus();
    expect(target).toHaveAttribute('tabindex', '-1');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(scrollTo).not.toHaveBeenCalled();
    expect(screen.getByRole('main')).not.toHaveFocus();
  });

  it('waits for an initial hash target, then focuses and scrolls it', async () => {
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const clearTimeout = vi.spyOn(window, 'clearTimeout');

    renderNavigation(['/page?lang=en#target'], [
      { path: 'page', element: <DeferredTarget /> },
    ]);

    const target = await screen.findByText('Delayed target');
    await waitFor(() => expect(target).toHaveFocus());
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(disconnect).toHaveBeenCalled();
    expect(clearTimeout).toHaveBeenCalled();
  });

  it('keeps watching for an initial delayed hash target during Strict Mode effect replay', async () => {
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');

    renderNavigation(
      ['/page?lang=en#target'],
      [{ path: 'page', element: <DeferredTarget /> }],
      undefined,
      true,
    );

    const target = await screen.findByText('Delayed target');
    await waitFor(() => expect(target).toHaveFocus());
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  });

  it.each([
    ['PUSH', undefined],
    ['REPLACE', { replace: true }],
  ])(
    'scrolls to the top and focuses main after a %s pathname navigation without a hash',
    async (_navigationType, options) => {
      const focus = vi.spyOn(HTMLElement.prototype, 'focus');
      const scrollTo = vi.mocked(window.scrollTo);
      const { router } = renderNavigation(['/source?lang=en'], [
        { path: 'source', element: <p>Source</p> },
        { path: 'destination', element: <p>Destination</p> },
      ]);
      const main = screen.getByRole('main');
      main.blur();
      focus.mockClear();
      scrollTo.mockClear();

      await navigate(router, '/destination?lang=en', options);

      expect(scrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
      expect(main).toHaveFocus();
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    },
  );

  it('re-applies the top reset after the destination has painted', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const scrollTo = vi.mocked(window.scrollTo);
    const frameCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const { router } = renderNavigation(['/source?lang=es'], [
      { path: 'source', element: <p>Source</p> },
      { path: 'destination', element: <p>Destination</p> },
    ]);
    const main = screen.getByRole('main');
    main.blur();
    focus.mockClear();
    scrollTo.mockClear();

    await navigate(router, '/destination?lang=es');

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(frameCallbacks).toHaveLength(1);
    frameCallbacks.shift()?.(0);
    expect(frameCallbacks).toHaveLength(1);
    frameCallbacks.shift()?.(16);
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(main).toHaveFocus();
  });

  it.each([
    ['PUSH', undefined],
    ['REPLACE', { replace: true }],
  ])(
    'focuses the hash target instead of main after a %s navigation',
    async (_navigationType, options) => {
      const focus = vi.spyOn(HTMLElement.prototype, 'focus');
      const scrollTo = vi.mocked(window.scrollTo);
      const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
      const { router } = renderNavigation(['/source?lang=en'], [
        { path: 'source', element: <p>Source</p> },
        {
          path: 'destination',
          element: <section id="target">Destination target</section>,
        },
      ]);
      const main = screen.getByRole('main');
      main.blur();
      focus.mockClear();

      await navigate(router, '/destination?lang=en#target', options);

      expect(screen.getByText('Destination target')).toHaveFocus();
      expect(main).not.toHaveFocus();
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
      expect(scrollTo).not.toHaveBeenCalled();
    },
  );

  it('does not change scroll or focus after later POP navigation', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const scrollTo = vi.mocked(window.scrollTo);
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const { router } = renderNavigation(
      ['/source?lang=en', '/destination?lang=en'],
      [
        { path: 'source', element: <p>Source</p> },
        { path: 'destination', element: <p>Destination</p> },
      ],
      1,
    );
    screen.getByRole('main').blur();
    focus.mockClear();

    await navigate(router, -1);

    expect(focus).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.body).toHaveFocus();
  });

  it('scrolls to the top and focuses main when only the lang query changes', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const scrollTo = vi.mocked(window.scrollTo);
    const { router } = renderNavigation(['/page?lang=en&lens=systems'], [
      { path: 'page', element: <p>Page</p> },
    ]);
    const main = screen.getByRole('main');
    main.blur();
    focus.mockClear();

    await navigate(router, '/page?lens=systems&lang=es');

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
    expect(main).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('does not change scroll or focus when an unrelated query changes', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const scrollTo = vi.mocked(window.scrollTo);
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const { router } = renderNavigation(['/page?lang=en&lens=systems'], [
      { path: 'page', element: <p>Page</p> },
    ]);
    screen.getByRole('main').blur();
    focus.mockClear();

    await navigate(router, '/page?lang=en&lens=services');

    expect(focus).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.body).toHaveFocus();
  });

  it('preserves focus and scroll across lens PUSH and Back when a hash is unchanged', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const scrollTo = vi.mocked(window.scrollTo);
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const { router } = renderNavigation(
      ['/page?lang=en&lens=layers#target'],
      [{ path: 'page', element: <section id="target">Lens target</section> }],
    );
    const target = screen.getByText('Lens target');
    expect(target).toHaveFocus();
    target.blur();
    focus.mockClear();
    scrollTo.mockClear();
    scrollIntoView.mockClear();

    await navigate(router, '/page?lang=en&lens=trust#target');

    expect(router.state.location.hash).toBe('#target');
    expect(focus).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();

    await navigate(router, -1);

    expect(router.state.location.search).toBe('?lang=en&lens=layers');
    expect(router.state.location.hash).toBe('#target');
    expect(focus).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('uses the raw hash safely when it contains a malformed escape', () => {
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');

    renderNavigation(['/page#bad%ZZ'], [
      { path: 'page', element: <section id="bad%ZZ">Malformed target</section> },
    ]);

    expect(screen.getByText('Malformed target')).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  });

  it('cancels a pending hash observer and timeout on a new navigation', async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const clearTimeout = vi.spyOn(window, 'clearTimeout');
    const { router } = renderNavigation(['/source#missing'], [
      { path: 'source', element: <p>Source</p> },
      { path: 'destination', element: <p>Destination</p> },
    ]);

    await navigate(router, '/destination');

    expect(disconnect).toHaveBeenCalled();
    expect(clearTimeout).toHaveBeenCalled();
  });

  it('cancels a pending hash observer and timeout on unmount', () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const clearTimeout = vi.spyOn(window, 'clearTimeout');
    const { unmount } = renderNavigation(['/page#missing'], [
      { path: 'page', element: <p>Page</p> },
    ]);

    unmount();

    expect(disconnect).toHaveBeenCalled();
    expect(clearTimeout).toHaveBeenCalled();
  });
});
