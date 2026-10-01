import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

function renderArticle(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('ArticlePage', () => {
  it.each([
    [
      '/blog/curiosity-driven-knowledge-enrichment?lang=en',
      'When Your AI Has Photographic Memory But No Understanding: Designing Curiosity-Driven Knowledge Enrichment',
      'KATHESAMA / FIELD NOTES',
      'A design for turning passive RAG storage into a governed knowledge engine that maps domains, detects gaps, and investigates them autonomously.',
      'Article metadata',
    ],
    [
      '/blog/curiosity-driven-knowledge-enrichment?lang=es',
      'Cuando tu IA tiene memoria fotográfica pero no comprensión: diseño de un enriquecimiento de conocimiento guiado por la curiosidad',
      'KATHESAMA / NOTAS DE CAMPO',
      'Un diseño para convertir un almacén RAG pasivo en un motor de conocimiento gobernado que mapea dominios, detecta vacíos y los investiga de forma autónoma.',
      'Metadatos del artículo',
    ],
  ])(
    'keeps the longest localized title continuous and associated with its header on %s',
    async (path, title, eyebrow, summary, metadataName) => {
      renderArticle(path);

      const heading = await screen.findByRole(
        'heading',
        { level: 1, name: title },
        { timeout: 5_000 },
      );
      const header = heading.closest('header');

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(heading.childNodes).toHaveLength(1);
      expect(heading.firstChild).toBeInstanceOf(Text);
      expect(heading).toHaveTextContent(title);
      expect(heading.textContent).not.toContain('\u00ad');
      expect(heading.querySelector('br, wbr, span')).toBeNull();
      expect(header).not.toBeNull();
      expect(within(header!).getByText(eyebrow)).toBeVisible();
      expect(within(header!).getByText(summary)).toBeVisible();
      expect(within(header!).getByRole('complementary', { name: metadataName })).toBeVisible();
    },
  );

  it('renders complete English article metadata, body, attribution, and series navigation', async () => {
    renderArticle('/blog/juana-orchestration-layer?lang=en');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'I Gave My Local AI a Brain: How I Designed the Orchestration Layer',
      }, { timeout: 5_000 }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Inside the Planner, Soul, and Ruflo architecture that separates decisions, execution, resilience, and auditability in JuanaIA.',
      ),
    ).toBeVisible();
    expect(screen.getByText('April 8, 2026')).toBeVisible();
    expect(screen.getByText('8 min read')).toBeVisible();
    expect(screen.getByText('English original')).toBeVisible();
    expect(
      screen.getByRole('list', { name: 'Tags' }).querySelectorAll('li'),
    ).toHaveLength(4);
    expect(screen.getByRole('list', { name: 'Tags' })).toHaveTextContent(
      'AI orchestrationAgentsArchitectureLangGraph',
    );

    const body = document.querySelector('.article-body');
    expect(body).toHaveTextContent(
      'Before your AI can answer anything, it has to decide how to answer it.',
    );
    expect(body).toHaveTextContent(
      'Every loop has hard limits: maximum 20 iterations, 3 retries per step, 2 replans per request.',
    );
    expect(body).toHaveTextContent(
      'I’m also open to remote opportunities as a Senior Software Engineer, AI Infrastructure Engineer, or Backend Architect.',
    );

    expect(screen.getByRole('link', { name: /Read the original on Medium/ })).toHaveAttribute(
      'href',
      'https://medium.com/@kathesama/i-gave-my-local-ai-a-brain-how-i-designed-the-orchestration-layer-c5eb39f8c320',
    );
    expect(screen.getByRole('link', { name: /Previous/ })).toHaveAttribute(
      'href',
      '/blog/building-juana-self-hosted-ai?lang=en',
    );
    expect(screen.getByRole('link', { name: /Next/ })).toHaveAttribute(
      'href',
      '/blog/self-hosted-ai-latency-24-to-2?lang=en',
    );
    expect(screen.getByRole('link', { name: /Back to the series/ })).toHaveAttribute(
      'href',
      '/blog?lang=en',
    );
  });

  it('renders the reviewed Spanish edition and changes the complete body in place', async () => {
    const user = userEvent.setup();
    renderArticle('/blog/juana-orchestration-layer?lang=es');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Le di un cerebro a mi IA local: cómo diseñé la capa de orquestación',
      }, { timeout: 5_000 }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Una mirada a la arquitectura de Planner, Soul y Ruflo, que separa decisiones, ejecución, resiliencia y auditoría en JuanaIA.',
      ),
    ).toBeVisible();
    expect(screen.getByText('8 de abril de 2026')).toBeVisible();
    expect(screen.getByText('9 min de lectura')).toBeVisible();
    expect(screen.getByText('Traducción local revisada')).toBeVisible();
    expect(screen.getByRole('list', { name: 'Etiquetas' })).toHaveTextContent(
      'Orquestación de IAAgentesArquitecturaLangGraph',
    );

    const spanishBody = document.querySelector('.article-body');
    expect(spanishBody).toHaveTextContent(
      'Antes de que tu IA pueda responder algo, tiene que decidir cómo responderlo.',
    );
    expect(spanishBody).toHaveTextContent(
      'Cada bucle tiene límites estrictos: un máximo de 20 iteraciones, 3 reintentos por paso y 2 replanificaciones por solicitud.',
    );
    expect(spanishBody).toHaveTextContent(
      'También estoy abierta a oportunidades remotas como Senior Software Engineer, AI Infrastructure Engineer o Backend Architect.',
    );
    expect(screen.getByRole('link', { name: /Volver a la serie/ })).toHaveAttribute(
      'href',
      '/blog?lang=es',
    );

    await user.click(screen.getByRole('button', { name: 'English' }));

    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'I Gave My Local AI a Brain: How I Designed the Orchestration Layer',
        }),
      ).toBeVisible(),
    );
    expect(document.querySelector('.article-body')).toHaveTextContent(
      'Before your AI can answer anything, it has to decide how to answer it.',
    );
    expect(document.querySelector('.article-body')).not.toHaveTextContent(
      'Antes de que tu IA pueda responder algo',
    );
  });

  it('renders a localized writing 404 for an unknown slug', async () => {
    renderArticle('/blog/not-a-real-article?lang=es');

    expect(
      await screen.findByRole('heading', { name: 'Artículo no encontrado' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ver artículos' })).toHaveAttribute(
      'href',
      '/blog?lang=es',
    );
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/?lang=es',
    );
  });

  it('keeps direct article navigation inside the shared shell', async () => {
    renderArticle('/blog/curiosity-driven-knowledge-enrichment?lang=en');

    expect(await screen.findByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('moves focus to main content after real client navigation from /blog to an article', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/blog?lang=en']}>
        <Link to="/blog/juana-orchestration-layer?lang=en">Open orchestration note</Link>
        <App />
      </MemoryRouter>,
    );

    const main = screen.getByRole('main');
    await waitFor(() => expect(main).toHaveFocus());

    await user.click(screen.getByRole('link', { name: 'Open orchestration note' }));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'I Gave My Local AI a Brain: How I Designed the Orchestration Layer',
      }, { timeout: 5_000 }),
    ).toBeVisible();
    await waitFor(() => expect(main).toHaveFocus());
  });
});
