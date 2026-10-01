import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { publicArchitecture } from '../../content/architecture';
import { ArchitectureCanvas } from './ArchitectureCanvas';
import { ArchitectureExplorer } from './ArchitectureExplorer';
import { createArchitectureGraph } from './architectureGraph';

class ImmediateResizeObserver implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    queueMicrotask(() => {
      const rect = target.getBoundingClientRect();
      this.callback(
        [
          {
            target,
            contentRect: rect,
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          },
        ],
        this,
      );
    });
  }

  unobserve() {}
  disconnect() {}
}

function rect(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    right: width,
    bottom: height,
    left: 0,
    toJSON: () => ({}),
  };
}

describe('ArchitectureCanvas with real React Flow', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ImmediateResizeObserver);
    vi.stubGlobal(
      'DOMMatrixReadOnly',
      class DOMMatrixReadOnlyStub {
        m22 = 1;
      },
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        return this.classList.contains('react-flow__node')
          ? rect(224, 126)
          : rect(1280, 800);
      },
    );
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1280);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(800);
    Object.defineProperty(SVGElement.prototype, 'getBBox', {
      configurable: true,
      value: () => rect(100, 16),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(SVGElement.prototype, 'getBBox');
  });

  it('renders all 18 nodes and 43 connected edge paths after layout', async () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      language: 'en',
      selectedFlowId: null,
      showTelemetry: true,
      showContracts: false,
      reducedMotion: true,
    });

    const { container } = render(
      <ArchitectureCanvas
        nodes={graph.nodes}
        edges={graph.edges}
        language="en"
        reducedMotion
        onFitReady={() => undefined}
        onClearSelection={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('.react-flow__node')).toHaveLength(18);
      expect(container.querySelectorAll('.react-flow__edge')).toHaveLength(43);
      expect(container.querySelectorAll('.react-flow__edge-path')).toHaveLength(43);
    });

    for (const semantic of ['sync', 'stream', 'async', 'data', 'trust', 'telemetry']) {
      const expected = publicArchitecture.edges.filter(({ type }) => type === semantic).length;
      expect(
        container.querySelectorAll(`.architecture-edge--${semantic}`),
      ).toHaveLength(expected);
    }

    const trustCount = publicArchitecture.edges.filter(({ type }) => type === 'trust').length;
    expect(
      screen.getAllByRole('img', {
        name: 'Trust decision marker; direction remains indicated by the arrow.',
      }),
    ).toHaveLength(trustCount);
    for (const trustEdge of container.querySelectorAll('.architecture-edge--trust')) {
      expect(
        trustEdge.querySelector('.react-flow__edge-path')?.getAttribute('marker-end'),
      ).toContain('arrowclosed');
    }

    for (const edge of publicArchitecture.edges.filter(({ type }) => type === 'trust')) {
      expect(screen.queryByText(edge.label.en)).not.toBeInTheDocument();
    }
  });

  it('renders all four conceptual trust labels only when contracts are enabled', async () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      language: 'en',
      selectedFlowId: null,
      showTelemetry: true,
      showContracts: true,
      reducedMotion: true,
    });
    const { container } = render(
      <ArchitectureCanvas
        nodes={graph.nodes}
        edges={graph.edges}
        language="en"
        reducedMotion
        onFitReady={() => undefined}
        onClearSelection={() => undefined}
      />,
    );
    const trustEdges = publicArchitecture.edges.filter(({ type }) => type === 'trust');

    await waitFor(() => {
      expect(container.querySelectorAll('.architecture-edge--trust')).toHaveLength(4);
      for (const edge of trustEdges) {
        expect(screen.getByText(edge.label.en)).toBeVisible();
      }
    });

    expect(
      screen.getAllByRole('img', {
        name: 'Trust decision marker; direction remains indicated by the arrow.',
      }),
    ).toHaveLength(4);
    for (const trustEdge of container.querySelectorAll('.architecture-edge--trust')) {
      expect(
        trustEdge.querySelector('.react-flow__edge-path')?.getAttribute('marker-end'),
      ).toContain('arrowclosed');
    }
  });

  it('projects selected-route visual state onto trust labels rendered in the portal', async () => {
    const nonTrustGraph = createArchitectureGraph(publicArchitecture, {
      language: 'en',
      selectedFlowId: 'knowledge-ingestion',
      showTelemetry: true,
      showContracts: true,
      reducedMotion: true,
    });
    const nonTrustView = render(
      <ArchitectureCanvas
        nodes={nonTrustGraph.nodes}
        edges={nonTrustGraph.edges}
        language="en"
        reducedMotion
        onFitReady={() => undefined}
        onClearSelection={() => undefined}
      />,
    );

    await waitFor(() => {
      const label = screen.getByText('identity check');
      expect(label).toHaveClass('architecture-trust-label--dimmed');
      expect(label).toHaveAttribute('data-visual-state', 'dimmed');
    });
    nonTrustView.unmount();

    const trustGraph = createArchitectureGraph(publicArchitecture, {
      language: 'en',
      selectedFlowId: 'real-time-chat',
      showTelemetry: true,
      showContracts: true,
      reducedMotion: true,
    });
    render(
      <ArchitectureCanvas
        nodes={trustGraph.nodes}
        edges={trustGraph.edges}
        language="en"
        reducedMotion
        onFitReady={() => undefined}
        onClearSelection={() => undefined}
      />,
    );

    await waitFor(() => {
      const activeLabel = screen.getByText('identity check');
      expect(activeLabel).toHaveClass('architecture-trust-label--active');
      expect(activeLabel).toHaveAttribute('data-visual-state', 'active');
      const unrelatedLabel = screen.getByText('approval request');
      expect(unrelatedLabel).toHaveClass('architecture-trust-label--dimmed');
      expect(unrelatedLabel).toHaveAttribute('data-visual-state', 'dimmed');
    });
  });

  it('selects and deselects real nodes and edges with Enter and Space', async () => {
    const user = userEvent.setup();
    const graph = createArchitectureGraph(publicArchitecture, {
      language: 'en',
      selectedFlowId: null,
      showTelemetry: true,
      showContracts: false,
      reducedMotion: true,
    });
    const { container } = render(
      <ArchitectureCanvas
        nodes={graph.nodes}
        edges={graph.edges}
        language="en"
        reducedMotion
        onFitReady={() => undefined}
        onClearSelection={() => undefined}
      />,
    );

    const node = await waitFor(() => {
      const element = container.querySelector('.react-flow__node');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    node.focus();
    await user.keyboard('{Enter}');
    expect(node).toHaveClass('selected');
    await user.keyboard(' ');
    expect(node).not.toHaveClass('selected');

    const edge = container.querySelector('.react-flow__edge') as HTMLElement;
    edge.focus();
    await user.keyboard(' ');
    expect(edge).toHaveClass('selected');
    await user.keyboard('{Enter}');
    expect(edge).not.toHaveClass('selected');
  });

  it('keeps the real node detail visible alongside the active lens narrative', async () => {
    const user = userEvent.setup();
    const lens = publicArchitecture.lenses.find(({ id }) => id === 'layers')!;
    const person = publicArchitecture.nodes.find(({ id }) => id === 'person')!;
    const { container } = render(
      <MemoryRouter initialEntries={['/architecture?lang=en&lens=layers']}>
        <ArchitectureExplorer language="en" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: lens.title.en })).toBeVisible();
    const node = await waitFor(() => {
      const element = container.querySelector<HTMLElement>(
        '.react-flow__node[data-id="person"]',
      );
      expect(element).not.toBeNull();
      return element!;
    });

    node.focus();
    await user.keyboard('{Enter}');

    expect(node).toHaveClass('selected');
    const tooltip = document.getElementById('architecture-node-person-details');
    expect(tooltip).toHaveAttribute('data-visible', 'true');
    expect(tooltip).toHaveTextContent(person.description.en);
    expect(screen.getByRole('heading', { name: lens.title.en })).toBeVisible();
    expect(screen.getByText(lens.summary.en)).toBeVisible();
  });

  it('clears a selected flow with Escape from a real node or the graph without deleting elements', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter initialEntries={['/architecture?lang=en&lens=layers']}>
        <ArchitectureExplorer language="en" />
      </MemoryRouter>,
    );
    const flow = screen.getByRole('button', { name: /Memory-grounded answer/i });

    await user.click(flow);
    const nodes = await waitFor(() => {
      const renderedNodes = container.querySelectorAll('.react-flow__node');
      expect(renderedNodes).toHaveLength(18);
      return renderedNodes;
    });
    const node = nodes[0] as HTMLElement;
    node.focus();
    fireEvent.keyDown(node, { key: 'Escape', code: 'Escape' });

    expect(flow).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    expect(container.querySelectorAll('.react-flow__node')).toHaveLength(18);

    await user.click(flow);
    const graph = container.querySelector('.react-flow');
    expect(graph).not.toBeNull();
    fireEvent.keyDown(graph as Element, { key: 'Escape', code: 'Escape' });

    expect(flow).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelectorAll('.react-flow__node')).toHaveLength(18);
  });
});
