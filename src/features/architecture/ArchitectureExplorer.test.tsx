/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { useEffect } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicArchitecture } from '../../content/architecture';
import type {
  ArchitectureGraphEdge,
  ArchitectureGraphNode,
} from './architectureGraph';
import { ArchitectureExplorer } from './ArchitectureExplorer';

let shouldThrowCanvas = false;

vi.mock('./ArchitectureCanvas', () => ({
  ArchitectureCanvas({
    nodes,
    edges,
    onFitReady,
    reducedMotion,
  }: {
    nodes: ArchitectureGraphNode[];
    edges: ArchitectureGraphEdge[];
    onFitReady: (fit: () => void) => void;
    reducedMotion: boolean;
  }) {
    if (shouldThrowCanvas) {
      throw new Error('synthetic canvas failure');
    }

    useEffect(() => {
      onFitReady(() => undefined);
    }, [onFitReady]);

    return (
      <div
        aria-label="mock architecture canvas"
        role="img"
        data-node-ids={nodes.map(({ id }) => id).join(',')}
        data-edge-ids={edges.map(({ id }) => id).join(',')}
        data-node-states={nodes
          .map(({ id, data }) => `${id}:${data.visualState}`)
          .join(',')}
        data-node-classes={nodes.map(({ id, className }) => `${id}:${className}`).join(',')}
        data-edge-states={edges
          .map(({ id, data }) => `${id}:${data?.visualState}`)
          .join(',')}
        data-labelled-edges={edges.filter(({ label }) => label).length}
        data-animated-edge-ids={edges.filter(({ animated }) => animated).map(({ id }) => id).join(',')}
        data-reduced-motion={String(reducedMotion)}
      />
    );
  },
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <span data-testid="location">
      {`${location.pathname}${location.search}${location.hash}`}
    </span>
  );
}

function renderExplorer(
  language: 'en' | 'es' = 'en',
  initialEntries: string[] = [`/architecture?lang=${language}`],
) {
  const router = createMemoryRouter(
    [
      {
        path: '/architecture',
        element: (
          <>
            <ArchitectureExplorer language={language} />
            <LocationProbe />
          </>
        ),
      },
    ],
    { initialEntries },
  );

  return { ...render(<RouterProvider router={router} />), router };
}

function canvas() {
  return screen.getByLabelText('mock architecture canvas');
}

describe('ArchitectureExplorer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    shouldThrowCanvas = false;
  });

  it.each([
    ['/architecture?lang=en', 'layers'],
    ['/architecture?lang=en&lens=not-public', 'layers'],
  ])('resolves %s to the safe default lens', (entry, expectedLens) => {
    renderExplorer('en', [entry]);

    expect(screen.getByRole('combobox', { name: 'Architecture lens' })).toHaveValue(
      expectedLens,
    );
    const lens = publicArchitecture.lenses.find(({ id }) => id === expectedLens)!;
    expect(screen.getByRole('heading', { name: lens.title.en })).toBeVisible();
  });

  it('pushes lens selection while preserving language and unrelated safe parameters', async () => {
    const user = userEvent.setup();
    renderExplorer('es', ['/architecture?lang=es&ref=portfolio']);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Lente de arquitectura' }),
      'trust',
    );

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/architecture?lang=es&ref=portfolio&lens=trust',
    );
  });

  it('restores the prior lens through browser Back', async () => {
    const user = userEvent.setup();
    const { router } = renderExplorer('en', [
      '/architecture?lang=en&lens=layers',
    ]);
    const selector = screen.getByRole('combobox', { name: 'Architecture lens' });

    await user.selectOptions(selector, 'trust');
    expect(selector).toHaveValue('trust');
    await router.navigate(-1);

    await waitFor(() => expect(selector).toHaveValue('layers'));
  });

  it('projects the selected lens while retaining a stronger selected flow', async () => {
    const user = userEvent.setup();
    renderExplorer('en', ['/architecture?lang=en&lens=trust']);
    const lens = publicArchitecture.lenses.find(({ id }) => id === 'trust')!;

    expect(canvas().getAttribute('data-node-classes')).toMatch(
      new RegExp(`${lens.nodeIds[0]}:[^,]*\\barchitecture-node--lens\\b`),
    );

    const flow = publicArchitecture.flows.find(({ id }) => id === lens.flowIds[0])!;
    await user.click(
      screen.getByRole('button', { name: new RegExp(flow.title.en, 'i') }),
    );
    expect(canvas().getAttribute('data-node-classes')).toContain(
      `${flow.steps[0]}:architecture-node--active`,
    );
  });

  it.each(['layers', 'reliability'] as const)(
    'shows the complete %s lens projection, including observability, on entry',
    (lensId) => {
      renderExplorer('en', [`/architecture?lang=en&lens=${lensId}`]);

      expect(canvas().getAttribute('data-node-ids')).toContain('observability');
      expect(screen.getByRole('button', { name: 'Observability' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    },
  );

  it('preserves a hash, safe query parameters, and history while changing lenses', async () => {
    const user = userEvent.setup();
    const { router } = renderExplorer('en', [
      '/architecture?lang=en&ref=portfolio&lens=layers#architecture-lens-panel',
    ]);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Architecture lens' }),
      'trust',
    );
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/architecture?lang=en&ref=portfolio&lens=trust#architecture-lens-panel',
    );

    await router.navigate(-1);
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/architecture?lang=en&ref=portfolio&lens=layers#architecture-lens-panel',
      ),
    );
  });

  it('announces lens-related flows in the selected language', () => {
    renderExplorer('es', ['/architecture?lang=es&lens=trust']);

    expect(
      screen.getByRole('button', {
        name: /Chat en tiempo real.*Relacionado con la lente seleccionada/i,
      }),
    ).toBeVisible();
  });

  it('keeps the validated nine-lens JSON available for copy and download', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    renderExplorer();

    await user.click(screen.getByRole('button', { name: 'Copy JSON' }));
    const copied = JSON.parse(writeText.mock.calls[0][0]);
    expect(copied.lenses).toHaveLength(9);
    expect(screen.getByRole('link', { name: 'Download JSON' })).toHaveAttribute(
      'href',
      '/architecture.public.json',
    );
  });

  it('keeps the current lens narrative when the canvas falls back to text', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    shouldThrowCanvas = true;
    renderExplorer('es', ['/architecture?lang=es&lens=reliability']);
    const lens = publicArchitecture.lenses.find(({ id }) => id === 'reliability')!;

    expect(screen.getByRole('region', { name: 'Mapa de arquitectura en texto' })).toBeVisible();
    expect(screen.getByRole('region', { name: lens.title.es })).toBeVisible();
    expect(screen.getByText(lens.summary.es)).toBeVisible();
  });

  it('orders lens, map, and flows responsively without animated lens transitions', () => {
    const css = readFileSync('src/features/architecture/architecture.css', 'utf8');
    const mobileRule = css.match(
      /@media\s*\(max-width:\s*900px\)[\s\S]*?(?=@media\s*\(max-width:\s*640px\))/, 
    )?.[0] ?? '';
    const reducedMotionRule = css.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*$/,
    )?.[0] ?? '';

    expect(css).toMatch(/grid-template-areas:\s*['"]map selector['"]\s*['"]map lens['"]\s*['"]map flows['"]/);
    expect(mobileRule).toMatch(/grid-template-areas:\s*['"]selector['"]\s*['"]lens['"]\s*['"]map['"]\s*['"]flows['"]/);
    expect(reducedMotionRule).toMatch(/\.architecture-lens-panel[^}]*transition:\s*none/);
    expect(reducedMotionRule).toMatch(/\.architecture-lens-selector[^}]*transition:\s*none/);
  });

  it('offers a labelled native flow select for the mobile composition', () => {
    renderExplorer();

    const selector = screen.getByRole('combobox', { name: 'Choose a narrated flow' });
    expect(selector).toBeVisible();
    expect(within(selector).getAllByRole('option')).toHaveLength(9);
    expect(within(selector).getByRole('option', { name: 'All flows' })).toHaveValue('');
  });

  it('keeps the selected outcome and numbered stages after mobile selection', async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Choose a narrated flow' }),
      'approved-action',
    );

    const detail = screen.getByRole('region', { name: 'Approved action' });
    expect(within(detail).getByText('Outcome')).toBeVisible();
    expect(within(detail).getByText('Conditional')).toBeVisible();
    expect(within(detail).getAllByRole('listitem')[0]).toHaveTextContent('01');
  });

  it('localizes React Flow keyboard and control labels', async () => {
    const { ArchitectureCanvas: RealArchitectureCanvas } = await vi.importActual<
      typeof import('./ArchitectureCanvas')
    >('./ArchitectureCanvas');

    render(
      <RealArchitectureCanvas
        nodes={[]}
        edges={[]}
        language="es"
        reducedMotion
        onFitReady={() => undefined}
        onClearSelection={() => undefined}
      />,
    );

    expect(screen.getByText(/Usá Tab para recorrer componentes y conexiones/i)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Acercar' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ajustar la arquitectura a la vista' })).toBeVisible();
  });

  it('disables animated stream edges when reduced motion is requested', () => {
    renderExplorer();

    expect(canvas()).toHaveAttribute('data-animated-edge-ids', '');
  });

  it('updates reduced-motion state when the media query changes', async () => {
    const mediaQuery = Object.assign(new EventTarget(), {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
    }) as MediaQueryList;
    vi.spyOn(window, 'matchMedia').mockReturnValue(mediaQuery);
    renderExplorer();

    expect(canvas().getAttribute('data-animated-edge-ids')).not.toBe('');
    const changeEvent = new Event('change');
    Object.defineProperty(changeEvent, 'matches', { value: true });
    mediaQuery.dispatchEvent(changeEvent);

    await waitFor(() => expect(canvas()).toHaveAttribute('data-animated-edge-ids', ''));
  });

  it('renders categorized components and all flows when the canvas throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    shouldThrowCanvas = true;
    renderExplorer();

    const fallback = screen.getByRole('region', { name: 'Architecture map in text' });
    expect(within(fallback).getByText(/interactive map is unavailable/i)).toBeVisible();
    expect(within(fallback).getByRole('heading', { name: 'Experience' })).toBeVisible();
    expect(within(fallback).getByText('Person')).toBeVisible();
    expect(within(fallback).getAllByRole('button', { pressed: false })).toHaveLength(8);
  });

  it('lets fallback flow controls update the same selected narrative', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    shouldThrowCanvas = true;
    const user = userEvent.setup();
    renderExplorer();
    const fallback = screen.getByRole('region', { name: 'Architecture map in text' });

    await user.click(within(fallback).getByRole('button', { name: /Approved action/i }));

    const detail = within(fallback).getByRole('region', { name: 'Approved action' });
    expect(within(detail).getByText('Outcome')).toBeVisible();
    expect(within(detail).getAllByRole('listitem')[0]).toHaveTextContent('01');
  });

  it('keeps copy and download JSON available when the graph has failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    shouldThrowCanvas = true;
    renderExplorer();

    await user.click(screen.getByRole('button', { name: 'Copy JSON' }));

    expect(writeText).toHaveBeenCalledWith(JSON.stringify(publicArchitecture, null, 2));
    expect(screen.getByRole('link', { name: 'Download JSON' })).toHaveAttribute(
      'href',
      '/architecture.public.json',
    );
  });

  it('has no automatically detectable accessibility violations in the textual fallback', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    shouldThrowCanvas = true;

    const { container } = renderExplorer();
    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });

  it('offers a localized retry that recovers the interactive canvas', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    shouldThrowCanvas = true;
    const user = userEvent.setup();
    renderExplorer('es');

    expect(screen.getByRole('region', { name: 'Mapa de arquitectura en texto' })).toBeVisible();
    shouldThrowCanvas = false;
    await user.click(
      screen.getByRole('button', { name: 'Reintentar mapa interactivo' }),
    );

    expect(screen.getByLabelText('mock architecture canvas')).toBeVisible();
    expect(
      screen.queryByRole('region', { name: 'Mapa de arquitectura en texto' }),
    ).not.toBeInTheDocument();
  });

  it('defines a one-column mobile explorer with bounded canvas and mobile-only selector', () => {
    const css = readFileSync('src/features/architecture/architecture.css', 'utf8');
    const mobileRule = css.match(
      /@media\s*\(max-width:\s*900px\)[\s\S]*?(?=@media\s*\(max-width:\s*640px\))/, 
    )?.[0] ?? '';

    expect(Number(mobileRule.match(/max-width:\s*(\d+)px/)?.[1])).toBeLessThanOrEqual(900);
    expect(mobileRule).toMatch(/\.architecture-explorer__body\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
    expect(mobileRule).toMatch(/\.architecture-flow-select\s*\{[\s\S]*?display:\s*block/);
    expect(mobileRule).toMatch(/\.architecture-flow-list\s*\{[\s\S]*?display:\s*none/);
    expect(mobileRule).toMatch(/height:\s*min\(62vh,\s*34rem\)/);
    expect(mobileRule).toMatch(/min-height:\s*26rem/);
  });

  it('uses a shrink-safe masthead and an exact three-by-two toolbar at 320px', () => {
    const css = readFileSync('src/features/architecture/architecture.css', 'utf8');
    const narrowRule = css.match(
      /@media\s*\(max-width:\s*640px\)[\s\S]*?(?=@media\s*\(prefers-reduced-motion)/,
    )?.[0] ?? '';

    expect(css).toMatch(/\.architecture-masthead\s*>\s*\*\s*{[^}]*min-width:\s*0/);
    expect(narrowRule).toMatch(
      /\.architecture-masthead\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    );
    expect(narrowRule).toMatch(/\.architecture-masthead h1\s*{[^}]*overflow-wrap:\s*anywhere/);
    expect(narrowRule).toMatch(
      /\.architecture-toolbar\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    );
  });

  it('renders Spanish controls, statuses, and flow narrative', async () => {
    const user = userEvent.setup();
    renderExplorer('es');

    expect(
      screen.getByRole('region', { name: 'Controles de la vista de arquitectura' }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Cómo piensa y actúa Juana' })).toBeVisible();
    expect(screen.getAllByText('Implementado en código').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Respuesta con memoria/i }));

    expect(screen.getByText('Resultado')).toBeVisible();
    expect(screen.getByText('Etapas')).toBeVisible();
  });

  it('starts with the complete graph and primary flow visually identified but not selected', () => {
    renderExplorer();

    expect(canvas()).toHaveAttribute(
      'data-node-ids',
      publicArchitecture.nodes
        .map(({ id }) => id)
        .join(','),
    );
    expect(screen.getByRole('button', { name: 'Observability' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(canvas().getAttribute('data-node-states')).not.toContain(':active');
    expect(screen.getByRole('button', { name: /Real-time chat/i })).toHaveAttribute(
      'data-primary',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    expect(
      screen.getByText(
        'Choose a narrated flow to trace its complete route, outcome, and evidence through the system.',
      ),
    ).toBeVisible();
  });

  it('selecting a flow highlights all ordered nodes and edges and dims the rest', async () => {
    const user = userEvent.setup();
    renderExplorer();
    const flow = publicArchitecture.flows.find(({ id }) => id === 'memory-grounded');

    await user.click(screen.getByRole('button', { name: /Memory-grounded answer/i }));

    const nodeStates = canvas().getAttribute('data-node-states') ?? '';
    const edgeStates = canvas().getAttribute('data-edge-states') ?? '';
    for (const nodeId of new Set(flow?.steps)) {
      expect(nodeStates).toContain(`${nodeId}:active`);
    }
    for (const edgeId of flow?.edgeIds ?? []) {
      expect(edgeStates).toContain(`${edgeId}:active`);
    }
    expect(nodeStates).toContain('voice:dimmed');
  });

  it('Clear restores the complete undimmed graph and empty-selection guidance', async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole('button', { name: /Tool-assisted answer/i }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(canvas().getAttribute('data-node-states')).not.toContain(':dimmed');
    expect(canvas().getAttribute('data-edge-states')).not.toContain(':dimmed');
    expect(
      screen.getByText(
        'Choose a narrated flow to trace its complete route, outcome, and evidence through the system.',
      ),
    ).toBeVisible();
  });

  it('toggles conceptual exchange labels without changing graph membership', async () => {
    const user = userEvent.setup();
    renderExplorer();
    const edgeIds = canvas().getAttribute('data-edge-ids');

    expect(canvas()).toHaveAttribute('data-labelled-edges', '0');
    await user.click(screen.getByRole('button', { name: 'Contracts' }));

    expect(canvas()).toHaveAttribute('data-edge-ids', edgeIds);
    expect(Number(canvas().getAttribute('data-labelled-edges'))).toBeGreaterThan(0);
  });

  it('toggles the transverse observability layer without changing a selected flow', async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole('button', { name: /Real-time chat/i }));
    const activeEdges = canvas().getAttribute('data-edge-states');
    expect(canvas().getAttribute('data-node-ids')).toContain('observability');

    await user.click(screen.getByRole('button', { name: 'Observability' }));

    expect(canvas().getAttribute('data-node-ids')).not.toContain('observability');
    expect(screen.getByRole('button', { name: 'Observability' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(canvas().getAttribute('data-edge-states')).toContain(activeEdges?.split(',')[0]);
    expect(screen.getByRole('button', { name: /Real-time chat/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Observability' }));

    expect(canvas().getAttribute('data-node-ids')).toContain('observability');
    expect(canvas().getAttribute('data-edge-ids')).toContain('gateway-observability');
    expect(screen.getByRole('button', { name: 'Observability' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('copies the validated JSON and announces success in a polite live region', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    renderExplorer();

    await user.click(screen.getByRole('button', { name: 'Copy JSON' }));

    expect(writeText).toHaveBeenCalledWith(JSON.stringify(publicArchitecture, null, 2));
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Architecture JSON copied to the clipboard.');
  });

  it('announces a localized failure when clipboard access is rejected', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    renderExplorer('es');

    await user.click(screen.getByRole('button', { name: 'Copiar JSON' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'No se pudo copiar el JSON de arquitectura.',
    );
  });

  it('exposes a download link to the validated public artifact', () => {
    renderExplorer();

    expect(screen.getByRole('link', { name: 'Download JSON' })).toHaveAttribute(
      'href',
      '/architecture.public.json',
    );
    expect(screen.getByRole('link', { name: 'Download JSON' })).toHaveAttribute(
      'download',
    );
  });

  it('shows evidence, outcome, and three-to-five numbered stages for a selected flow', async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole('button', { name: /Approved action/i }));

    const detail = screen.getByRole('region', { name: 'Approved action' });
    expect(within(detail).getByText('Conditional')).toBeVisible();
    expect(within(detail).getByText('Outcome')).toBeVisible();
    const stages = within(detail).getAllByRole('listitem');
    expect(stages.length).toBeGreaterThanOrEqual(3);
    expect(stages.length).toBeLessThanOrEqual(5);
    expect(stages[0]).toHaveTextContent('01');
  });

  it('has no automatically detectable accessibility violations with the canvas mocked', async () => {
    const { container } = renderExplorer();

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('lets selecting the same flow again clear the route', async () => {
    const user = userEvent.setup();
    renderExplorer();
    const flowButton = screen.getByRole('button', { name: /Voice turn/i });

    await user.click(flowButton);
    expect(flowButton).toHaveAttribute('aria-pressed', 'true');
    await user.click(flowButton);

    await waitFor(() => expect(flowButton).toHaveAttribute('aria-pressed', 'false'));
    expect(canvas().getAttribute('data-node-states')).not.toContain(':active');
  });
});
