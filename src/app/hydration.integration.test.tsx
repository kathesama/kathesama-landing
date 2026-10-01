import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render as renderServer } from '../entry-server';
import { mountApp } from './mountApp';

const slug = 'juana-orchestration-layer';

describe('React 19 hydration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', `/blog/${slug}?lang=es`);
    document.documentElement.lang = 'en';
    document.head.innerHTML = '<title>Kathesama</title><meta name="description" content="Fallback">';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('hydrates English SSR without recoverable errors and transitions to Spanish on the same slug', async () => {
    const serverHtml = await renderServer(`/blog/${slug}?lang=es`);
    expect(serverHtml).toContain('I Gave My Local AI a Brain');
    expect(serverHtml).not.toContain('Le di un cerebro a mi IA local');

    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    rootElement.innerHTML = serverHtml;
    document.body.append(rootElement);
    const recoverableErrors: unknown[] = [];

    const root = await mountApp(rootElement, {
      onRecoverableError: (error) => recoverableErrors.push(error),
    });

    await waitFor(() => {
      expect(rootElement).toHaveTextContent('Le di un cerebro a mi IA local');
      expect(document.documentElement).toHaveAttribute('lang', 'es');
    });
    expect(window.location.pathname).toBe(`/blog/${slug}`);
    expect(window.location.search).toBe('?lang=es');
    expect(recoverableErrors).toEqual([]);

    await act(async () => root.unmount());
  });
});
