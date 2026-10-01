import { MarkerType } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import { publicArchitecture } from '../../content/architecture';
import { architectureCopy } from './architectureCopy';
import {
  createArchitectureGraph,
  getSelectedRoute,
  projectLens,
} from './architectureGraph';

const baseOptions = {
  language: 'en' as const,
  selectedFlowId: null,
  selectedLensId: null,
  showTelemetry: false,
  showContracts: false,
  reducedMotion: false,
};

describe('projectLens', () => {
  it('returns stable set membership without mutating the public graph', () => {
    const before = JSON.stringify(publicArchitecture);
    const lens = publicArchitecture.lenses.find(({ id }) => id === 'trust')!;
    const projection = projectLens(publicArchitecture, lens);

    expect(projection.highlightedNodeIds).toEqual(new Set(lens.nodeIds));
    expect(projection.highlightedEdgeIds).toEqual(new Set(lens.edgeIds));
    expect(projection.highlightedFlowIds).toEqual(new Set(lens.flowIds));
    expect(JSON.stringify(publicArchitecture)).toBe(before);
  });
});

describe('getSelectedRoute', () => {
  it('uses only explicit steps and edge IDs while preserving repeated route membership', () => {
    const flow = publicArchitecture.flows.find(({ id }) => id === 'real-time-chat');
    const route = getSelectedRoute(publicArchitecture, 'real-time-chat');

    expect(flow?.steps.filter((id) => id === 'gateway')).toHaveLength(3);
    expect(flow?.steps.filter((id) => id === 'planner')).toHaveLength(2);
    expect(flow?.steps.filter((id) => id === 'runtime')).toHaveLength(2);
    expect(route.nodeIds).toEqual(new Set(flow?.steps));
    expect(route.edgeIds).toEqual(new Set(flow?.edgeIds));
    expect(route.edgeIds.has('gateway-observability')).toBe(false);
  });

  it('returns empty membership for null and unknown flow IDs', () => {
    expect(getSelectedRoute(publicArchitecture, null)).toEqual({
      nodeIds: new Set(),
      edgeIds: new Set(),
    });
    expect(getSelectedRoute(publicArchitecture, 'not-a-flow')).toEqual({
      nodeIds: new Set(),
      edgeIds: new Set(),
    });
  });
});

describe('architectureCopy', () => {
  it('localizes React Flow directions in Spanish and handles unknown values safely', () => {
    const announceMove = architectureCopy.es.reactFlowAria[
      'node.a11yDescription.ariaLiveMessage'
    ];

    expect(typeof announceMove).toBe('function');
    if (typeof announceMove !== 'function') return;

    expect(
      ['left', 'right', 'top', 'bottom'].map((direction) =>
        announceMove({ direction, x: 10, y: 20 }),
      ),
    ).toEqual([
      'Movido hacia la izquierda a la posición conceptual 10, 20.',
      'Movido hacia la derecha a la posición conceptual 10, 20.',
      'Movido hacia arriba a la posición conceptual 10, 20.',
      'Movido hacia abajo a la posición conceptual 10, 20.',
    ]);
    expect(announceMove({ direction: 'diagonal', x: 10, y: 20 })).toBe(
      'Movido en una dirección desconocida a la posición conceptual 10, 20.',
    );
  });
});

describe('createArchitectureGraph', () => {
  it('uses lens membership as secondary emphasis while keeping unrelated items interactive', () => {
    const lens = publicArchitecture.lenses.find(({ id }) => id === 'trust')!;
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      selectedLensId: lens.id,
      showTelemetry: true,
    });

    expect(graph.nodes.find(({ id }) => id === lens.nodeIds[0])?.className).toContain(
      'architecture-node--lens',
    );
    expect(
      graph.nodes.find(({ id }) => !lens.nodeIds.includes(id))?.className,
    ).toContain('architecture-node--outside-lens');
    expect(graph.nodes.every(({ selectable }) => selectable)).toBe(true);
    expect(graph.nodes.find(({ id }) => id === lens.nodeIds[0])?.ariaLabel).toContain(
      'within the selected lens',
    );
    expect(
      graph.nodes.find(({ id }) => !lens.nodeIds.includes(id))?.ariaLabel,
    ).toContain('outside the selected lens');
    expect(graph.edges.find(({ id }) => id === lens.edgeIds[0])?.ariaLabel).toContain(
      'within the selected lens',
    );
  });

  it('keeps a selected flow stronger than the active lens', () => {
    const lens = publicArchitecture.lenses.find(({ id }) => id === 'trust')!;
    const flow = publicArchitecture.flows.find(({ id }) => id === lens.flowIds[0])!;
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      selectedLensId: lens.id,
      selectedFlowId: flow.id,
      showTelemetry: true,
    });

    for (const nodeId of new Set(flow.steps)) {
      const node = graph.nodes.find(({ id }) => id === nodeId);
      expect(node?.className).toContain('architecture-node--active');
      expect(node?.className).not.toContain('architecture-node--lens');
    }
  });
  it('localizes node and edge text without changing stable IDs', () => {
    const english = createArchitectureGraph(publicArchitecture, baseOptions);
    const spanish = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      language: 'es',
    });

    expect(spanish.nodes.map(({ id }) => id)).toEqual(english.nodes.map(({ id }) => id));
    expect(spanish.edges.map(({ id }) => id)).toEqual(english.edges.map(({ id }) => id));
    expect(english.nodes.find(({ id }) => id === 'person')?.data.label).toBe('Person');
    expect(spanish.nodes.find(({ id }) => id === 'person')?.data.label).toBe('Persona');
    expect(english.edges.find(({ id }) => id === 'person-web')?.data?.label).toBe('typed intent');
    expect(spanish.edges.find(({ id }) => id === 'person-web')?.data?.label).toBe('intención escrita');
  });

  it('marks every ordered node and explicit edge in the selected flow as active', () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      selectedFlowId: 'memory-grounded',
    });
    const flow = publicArchitecture.flows.find(({ id }) => id === 'memory-grounded');

    expect(graph.nodes.filter(({ data }) => data.visualState === 'active').map(({ id }) => id).sort())
      .toEqual([...new Set(flow?.steps)].sort());
    expect(graph.edges.filter(({ data }) => data?.visualState === 'active').map(({ id }) => id).sort())
      .toEqual([...(flow?.edgeIds ?? [])].sort());
  });

  it('correctly highlights repeated gateway, planner, and runtime nodes', () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      selectedFlowId: 'real-time-chat',
    });

    for (const id of ['gateway', 'planner', 'runtime']) {
      expect(graph.nodes.find((node) => node.id === id)?.data.visualState).toBe('active');
    }
  });

  it('dims every unrelated visible node and edge when a flow is selected', () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      selectedFlowId: 'knowledge-ingestion',
    });
    const route = getSelectedRoute(publicArchitecture, 'knowledge-ingestion');

    expect(graph.nodes.every((node) =>
      node.data.visualState === (route.nodeIds.has(node.id) ? 'active' : 'dimmed'))).toBe(true);
    expect(graph.edges.every((edge) =>
      edge.data?.visualState === (route.edgeIds.has(edge.id) ? 'active' : 'dimmed'))).toBe(true);
  });

  it('leaves the complete graph undimmed when selection is null', () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      showTelemetry: true,
    });

    expect(graph.nodes.every(({ data }) => data.visualState === 'resting')).toBe(true);
    expect(graph.edges.every(({ data }) => data?.visualState === 'resting')).toBe(true);
  });

  it('hides telemetry edges and the observability node by default', () => {
    const graph = createArchitectureGraph(publicArchitecture, baseOptions);

    expect(graph.nodes.some(({ id }) => id === 'observability')).toBe(false);
    expect(graph.edges.some(({ data }) => data?.semantic === 'telemetry')).toBe(false);
  });

  it('removes every edge whose source or target is hidden with observability', () => {
    const datasetWithNonTelemetryObservabilityEdge = {
      ...publicArchitecture,
      edges: [
        ...publicArchitecture.edges,
        {
          id: 'gateway-observability-sync',
          source: 'gateway',
          target: 'observability',
          label: {
            en: 'conceptual status',
            es: 'estado conceptual',
          },
          type: 'sync' as const,
        },
      ],
    };
    const graph = createArchitectureGraph(
      datasetWithNonTelemetryObservabilityEdge,
      baseOptions,
    );
    const visibleNodeIds = new Set(graph.nodes.map(({ id }) => id));

    expect(graph.edges.some(({ id }) => id === 'gateway-observability-sync')).toBe(false);
    expect(
      graph.edges.every(
        ({ source, target }) =>
          visibleNodeIds.has(source) && visibleNodeIds.has(target),
      ),
    ).toBe(true);
  });

  it('shows the observability layer only when requested', () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      showTelemetry: true,
    });

    expect(graph.nodes.some(({ id }) => id === 'observability')).toBe(true);
    expect(graph.edges.filter(({ data }) => data?.semantic === 'telemetry')).toHaveLength(6);
  });

  it('shows conceptual exchange labels only when contracts are enabled', () => {
    const hidden = createArchitectureGraph(publicArchitecture, baseOptions);
    const shown = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      showContracts: true,
    });

    expect(hidden.edges.every(({ label }) => label === undefined)).toBe(true);
    expect(shown.edges.find(({ id }) => id === 'person-web')?.label).toBe('typed intent');
    expect(shown.edges.find(({ id }) => id === 'person-web')?.data?.label).toBe('typed intent');
  });

  it('animates only stream edges when reduced motion is false', () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      showTelemetry: true,
    });

    expect(graph.edges.every((edge) => edge.animated === (edge.data?.semantic === 'stream'))).toBe(true);
  });

  it('never animates an edge when reduced motion is true', () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      showTelemetry: true,
      reducedMotion: true,
    });

    expect(graph.edges.every(({ animated }) => animated === false)).toBe(true);
  });

  it('adds deterministic state and semantic classes, direction markers, and localized ARIA labels', () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      language: 'es',
      selectedFlowId: 'real-time-chat',
      selectedLensId: 'trust',
      showTelemetry: true,
    });
    const activeNode = graph.nodes.find(({ id }) => id === 'person');
    const dimmedNode = graph.nodes.find(({ id }) => id === 'memory');
    const trustEdge = graph.edges.find(({ id }) => id === 'gateway-identity');
    const activeNodeAttributes = activeNode?.domAttributes as
      | Record<string, unknown>
      | undefined;
    const trustEdgeAttributes = trustEdge?.domAttributes as
      | Record<string, unknown>
      | undefined;

    expect(activeNode?.className).toBe('architecture-node--active');
    expect(dimmedNode?.className).toBe('architecture-node--dimmed');
    expect(trustEdge?.className).toBe('architecture-edge--trust architecture-edge--active');
    expect(trustEdge?.type).toBe('architectureTrust');
    expect(trustEdge?.markerEnd).toEqual({ type: MarkerType.ArrowClosed });
    expect(trustEdge?.data?.markerLabel).toBe(
      architectureCopy.es.aria.trustMarker,
    );
    expect(activeNode?.ariaLabel).toContain('Persona');
    expect(activeNode?.ariaLabel).toContain('Verificado');
    expect(activeNode?.ariaLabel).toContain('en la ruta seleccionada');
    expect(activeNode?.ariaLabel).toContain('dentro de la lente seleccionada');
    expect(activeNodeAttributes?.['data-visual-state']).toBe('active');
    expect(trustEdge?.ariaLabel).toContain('verificación de identidad');
    expect(trustEdge?.ariaLabel).toContain('en la ruta seleccionada');
    expect(trustEdge?.ariaLabel).toContain('dentro de la lente seleccionada');
    expect(trustEdgeAttributes?.['data-visual-state']).toBe('active');
  });

  it('keeps stream edges teal by semantic class even when reduced motion disables animation', () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      reducedMotion: true,
      showTelemetry: true,
    });
    const stream = graph.edges.find(({ id }) => id === 'web-person');

    expect(stream?.className).toContain('architecture-edge--stream');
    expect(stream?.animated).toBe(false);
    expect(stream?.data?.semantic).toBe('stream');
  });

  it('treats an unknown selected flow ID as no selection', () => {
    const graph = createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      selectedFlowId: 'not-a-flow',
      showTelemetry: true,
    });

    expect(graph.nodes.every(({ data }) => data.visualState === 'resting')).toBe(true);
    expect(graph.edges.every(({ data }) => data?.visualState === 'resting')).toBe(true);
  });

  it('does not mutate the canonical dataset while projecting the graph', () => {
    const before = JSON.stringify(publicArchitecture);

    createArchitectureGraph(publicArchitecture, {
      ...baseOptions,
      selectedFlowId: 'approved-action',
      showTelemetry: true,
      showContracts: true,
    });

    expect(JSON.stringify(publicArchitecture)).toBe(before);
  });
});
