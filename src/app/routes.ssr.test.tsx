import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('SSR route overrides', () => {
  it('renders the supplied article component without entering the client lazy route', () => {
    const ArticleOverride = () => <article>Server override</article>;
    const html = renderToString(
      <MemoryRouter initialEntries={['/blog/example?lang=en']}>
        <App initialLanguage="en" routeOverrides={{ ArticlePage: ArticleOverride }} />
      </MemoryRouter>,
    );

    expect(html).toContain('Server override');
    expect(html).not.toContain('Loading writing');
  });
});
