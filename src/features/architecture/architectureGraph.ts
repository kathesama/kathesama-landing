import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { Language } from '../i18n/language';
import { architectureCopy, type ArchitectureVisualState } from './architectureCopy';
import type {
  ArchitectureCategory,
  ArchitectureEdgeType,
  ArchitectureEvidence,
  ArchitectureLensId,
  PublicArchitectureDataset,
  PublicArchitectureLens,
} from './architecture.types';

export type GraphOptions = {
  language: Language;
  selectedFlowId: string | null;
  selectedLensId?: ArchitectureLensId | null;
  showTelemetry: boolean;
  showContracts: boolean;
  reducedMotion: boolean;
};

export type ArchitectureNodeData = {
  label: string;
  description: string;
  capability: string;
  category: ArchitectureCategory;
  categoryLabel: string;
  evidence: ArchitectureEvidence;
  evidenceLabel: string;
  visualState: ArchitectureVisualState;
  lensMembership?: 'included' | 'outside';
};

export type ArchitectureEdgeData = {
  label: string;
  semantic: ArchitectureEdgeType;
  visualState: ArchitectureVisualState;
  markerLabel: string;
  lensMembership?: 'included' | 'outside';
};

export type ArchitectureGraphNode = Node<ArchitectureNodeData, 'architecture'>;
export type ArchitectureGraphEdge = Edge<ArchitectureEdgeData>;

export function projectLens(
  _graph: PublicArchitectureDataset,
  lens: PublicArchitectureLens,
): {
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  highlightedFlowIds: Set<string>;
} {
  return {
    highlightedNodeIds: new Set(lens.nodeIds),
    highlightedEdgeIds: new Set(lens.edgeIds),
    highlightedFlowIds: new Set(lens.flowIds),
  };
}

export function getSelectedRoute(
  dataset: PublicArchitectureDataset,
  flowId: string | null,
): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const flow = dataset.flows.find(({ id }) => id === flowId);

  return {
    nodeIds: new Set(flow?.steps ?? []),
    edgeIds: new Set(flow?.edgeIds ?? []),
  };
}

function getVisualState(
  hasSelection: boolean,
  belongsToSelection: boolean,
): ArchitectureVisualState {
  if (!hasSelection) return 'resting';
  return belongsToSelection ? 'active' : 'dimmed';
}

function nodeAriaLabel(
  data: ArchitectureNodeData,
  language: Language,
): string {
  const copy = architectureCopy[language];

  return [
    `${copy.aria.component}: ${data.label}.`,
    data.description,
    `${copy.aria.capability}: ${data.capability}.`,
    `${copy.aria.evidence}: ${copy.evidence[data.evidence]}.`,
    `${copy.aria.state}: ${copy.visualStates[data.visualState]}.`,
    data.lensMembership
      ? `${copy.aria.lens}: ${
          data.lensMembership === 'included'
            ? copy.aria.withinSelectedLens
            : copy.aria.outsideSelectedLens
        }.`
      : '',
  ].filter(Boolean).join(' ');
}

function edgeAriaLabel(
  data: ArchitectureEdgeData,
  sourceLabel: string,
  targetLabel: string,
  language: Language,
): string {
  const copy = architectureCopy[language];

  return [
    `${copy.aria.connection} ${copy.aria.from} ${sourceLabel} ${copy.aria.to} ${targetLabel}: ${data.label}.`,
    `${copy.aria.semantics}: ${copy.edgeTypes[data.semantic]}.`,
    `${copy.aria.state}: ${copy.visualStates[data.visualState]}.`,
    data.lensMembership
      ? `${copy.aria.lens}: ${
          data.lensMembership === 'included'
            ? copy.aria.withinSelectedLens
            : copy.aria.outsideSelectedLens
        }.`
      : '',
  ].filter(Boolean).join(' ');
}

export function createArchitectureGraph(
  dataset: PublicArchitectureDataset,
  options: GraphOptions,
): {
  nodes: ArchitectureGraphNode[];
  edges: ArchitectureGraphEdge[];
} {
  const selectedRoute = getSelectedRoute(dataset, options.selectedFlowId);
  const hasSelection = dataset.flows.some(({ id }) => id === options.selectedFlowId);
  const selectedLens = dataset.lenses.find(({ id }) => id === options.selectedLensId);
  const lensProjection = selectedLens ? projectLens(dataset, selectedLens) : null;
  const visibleNodes = dataset.nodes.filter(
    ({ id }) => options.showTelemetry || id !== 'observability',
  );
  const visibleNodeIds = new Set(visibleNodes.map(({ id }) => id));
  const visibleEdges = dataset.edges.filter(
    ({ source, target, type }) =>
      (options.showTelemetry || type !== 'telemetry') &&
      visibleNodeIds.has(source) &&
      visibleNodeIds.has(target),
  );
  const localizedNodeLabels = new Map(
    dataset.nodes.map((node) => [node.id, node.label[options.language]]),
  );

  const nodes: ArchitectureGraphNode[] = visibleNodes.map((node) => {
    const visualState = getVisualState(
      hasSelection,
      selectedRoute.nodeIds.has(node.id),
    );
    const data: ArchitectureNodeData = {
      label: node.label[options.language],
      description: node.description[options.language],
      capability: node.capability[options.language],
      category: node.category,
      categoryLabel: architectureCopy[options.language].categories[node.category],
      evidence: node.evidence,
      evidenceLabel: architectureCopy[options.language].evidence[node.evidence],
      visualState,
      lensMembership: lensProjection
        ? lensProjection.highlightedNodeIds.has(node.id)
          ? 'included'
          : 'outside'
        : undefined,
    };

    const lensClass = hasSelection
      ? visualState === 'dimmed' && lensProjection?.highlightedNodeIds.has(node.id)
        ? ' architecture-node--lens-context'
        : ''
      : lensProjection?.highlightedNodeIds.has(node.id)
        ? ' architecture-node--lens'
        : lensProjection
          ? ' architecture-node--outside-lens'
          : '';

    return {
      id: node.id,
      type: 'architecture',
      position: { ...node.position },
      data,
      className: `architecture-node--${visualState}${lensClass}`,
      ariaLabel: nodeAriaLabel(data, options.language),
      domAttributes: {
        'data-category': node.category,
        'data-evidence': node.evidence,
        'data-visual-state': visualState,
      } as ArchitectureGraphNode['domAttributes'],
      draggable: false,
      connectable: false,
      selectable: true,
    };
  });

  const edges: ArchitectureGraphEdge[] = visibleEdges.map((edge) => {
    const visualState = getVisualState(
      hasSelection,
      selectedRoute.edgeIds.has(edge.id),
    );
    const label = edge.label[options.language];
    const data: ArchitectureEdgeData = {
      label,
      semantic: edge.type,
      visualState,
      markerLabel: architectureCopy[options.language].aria.trustMarker,
      lensMembership: lensProjection
        ? lensProjection.highlightedEdgeIds.has(edge.id)
          ? 'included'
          : 'outside'
        : undefined,
    };

    const lensClass = hasSelection
      ? visualState === 'dimmed' && lensProjection?.highlightedEdgeIds.has(edge.id)
        ? ' architecture-edge--lens-context'
        : ''
      : lensProjection?.highlightedEdgeIds.has(edge.id)
        ? ' architecture-edge--lens'
        : lensProjection
          ? ' architecture-edge--outside-lens'
          : '';

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type === 'trust' ? 'architectureTrust' : undefined,
      label: options.showContracts ? label : undefined,
      data,
      className: `architecture-edge--${edge.type} architecture-edge--${visualState}${lensClass}`,
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: edge.type === 'stream' && !options.reducedMotion,
      ariaLabel: edgeAriaLabel(
        data,
        localizedNodeLabels.get(edge.source) ?? edge.source,
        localizedNodeLabels.get(edge.target) ?? edge.target,
        options.language,
      ),
      domAttributes: {
        'data-semantic': edge.type,
        'data-visual-state': visualState,
      } as ArchitectureGraphEdge['domAttributes'],
      focusable: true,
      selectable: true,
      reconnectable: false,
    };
  });

  return { nodes, edges };
}
