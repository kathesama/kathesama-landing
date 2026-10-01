import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ArticleBody } from './ArticleBody';

describe('ArticleBody', () => {
  function renderBody(markdown: string, language: 'en' | 'es' = 'en') {
    return render(
      <MemoryRouter>
        <ArticleBody markdown={markdown} language={language} />
      </MemoryRouter>,
    );
  }

  it('renders the supported long-form Markdown vocabulary', () => {
    const markdown = `
## Systems note

A paragraph with **strong evidence** and [an internal link](/architecture?lang=en).

> Measure before optimizing.

1. Trace
2. Compare

- Local
- Observable

| Layer | Role |
| --- | --- |
| Planner | Decisions |

~~~ts
const latency = 2;
~~~

![A local architecture diagram](/images/blog/juana-orchestration-layer/figure-02.png "Architecture evidence")
`;

    const { container } = renderBody(markdown);

    expect(screen.getByRole('heading', { name: 'Systems note' })).toBeVisible();
    expect(screen.getByText('Measure before optimizing.')).toBeVisible();
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByText('const latency = 2;')).toBeVisible();
    expect(screen.getByRole('img', { name: 'A local architecture diagram' })).toHaveAttribute(
      'src',
      '/images/blog/juana-orchestration-layer/figure-02.png',
    );
    expect(screen.getByText('Architecture evidence')).toBeVisible();
    expect(container.querySelector('p > figure')).toBeNull();
  });

  it('drops raw HTML and refuses unsafe or remote image sources', () => {
    const markdown = `
<script>alert('no')</script>
<div>raw html must not render</div>

![Remote evidence](https://cdn.example.com/tracker.png)

![Data evidence](data:image/png;base64,AAAA)

![Traversal evidence](/images/blog/../private.png)
`;

    const { container } = renderBody(markdown);

    expect(container.querySelector('script')).toBeNull();
    expect(screen.queryByText('raw html must not render')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('secures external links while keeping internal links in the application', () => {
    renderBody(
      '[Architecture](/architecture?lang=en) and [Medium](https://medium.com/@kathesama).',
    );

    expect(screen.getByRole('link', { name: 'Architecture' })).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'Architecture' })).not.toHaveAttribute('rel');
    expect(screen.getByRole('link', { name: 'Medium' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Medium' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('routes root-relative links with the current language and preserves query and hash', () => {
    renderBody(
      '[Part 1](/blog/building-juana-self-hosted-ai?from=series#overview)',
      'es',
    );

    expect(screen.getByRole('link', { name: 'Part 1' })).toHaveAttribute(
      'href',
      '/blog/building-juana-self-hosted-ai?from=series&lang=es#overview',
    );
    expect(screen.getByRole('link', { name: 'Part 1' })).not.toHaveAttribute('target');
  });

  it('keeps third-party absolute links external without adding a language query', () => {
    renderBody('[Reference](https://medium.com/@third-party/article?source=notes#evidence)', 'es');

    expect(screen.getByRole('link', { name: 'Reference' })).toHaveAttribute(
      'href',
      'https://medium.com/@third-party/article?source=notes#evidence',
    );
    expect(screen.getByRole('link', { name: 'Reference' })).toHaveAttribute('target', '_blank');
  });

  it('renders unsafe javascript and data links as inert text', () => {
    const { container } = renderBody(
      '[Run script](javascript:alert(1)) and [Open payload](data:text/html;base64,PHNjcmlwdD4=).',
    );

    expect(screen.getByText('Run script')).toBeVisible();
    expect(screen.getByText('Open payload')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Run script' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open payload' })).not.toBeInTheDocument();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.querySelector('a[href^="data:"]')).toBeNull();
  });

  it('makes fenced code overflow keyboard focusable and announces its language', () => {
    renderBody('```typescript\nconst answer: number = 42;\n```');

    const region = screen.getByRole('region', { name: /^typescript code starting at line \d+$/ });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(within(region).getByText('const answer: number = 42;')).toBeVisible();
    expect(screen.getByText('typescript', { selector: '.code-block-language' })).toBeVisible();
  });

  it('wraps wide tables in uniquely named focusable English overflow regions', () => {
    const { container } = renderBody(`
| Service | Responsibility | Runtime | Boundary |
| --- | --- | --- | --- |
| Planner | Decisions | Python | Cognitive |

| Signal | Value |
| --- | --- |
| p95 | 2s |
`);

    const regions = screen.getAllByRole('region', {
      name: /^Scrollable data table starting at line \d+$/,
    });
    expect(regions).toHaveLength(2);
    expect(new Set(regions.map((region) => region.getAttribute('aria-label'))).size).toBe(2);
    regions.forEach((region) => {
      expect(region).toHaveAttribute('tabindex', '0');
      expect(within(region).getByRole('table')).toBeVisible();
    });
    expect(container.querySelector('p > .article-table-scroll')).toBeNull();
  });

  it('localizes unique accessible table overflow labels in Spanish', () => {
    render(
      <MemoryRouter>
        <ArticleBody
          language="es"
          markdown={`| Servicio | Rol |
| --- | --- |
| Planner | Decisiones |

| Señal | Valor |
| --- | --- |
| p95 | 2s |`}
        />
      </MemoryRouter>,
    );

    const regions = screen.getAllByRole('region', {
      name: /^Tabla de datos desplazable desde la línea \d+$/,
    });
    expect(regions).toHaveLength(2);
    expect(new Set(regions.map((region) => region.getAttribute('aria-label'))).size).toBe(2);
    regions.forEach((region) => expect(region).toHaveAttribute('tabindex', '0'));
  });
});
