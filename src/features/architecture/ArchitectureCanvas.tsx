import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type EdgeTypes,
  type NodeTypes,
} from '@xyflow/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import '@xyflow/react/dist/style.css';
import type { Language } from '../i18n/language';
import { architectureCopy } from './architectureCopy';
import type {
  ArchitectureGraphEdge,
  ArchitectureGraphNode,
} from './architectureGraph';
import { ArchitectureNode } from './ArchitectureNode';
import { ArchitectureTrustEdge } from './ArchitectureTrustEdge';

const nodeTypes = {
  architecture: ArchitectureNode,
} satisfies NodeTypes;

const edgeTypes = {
  architectureTrust: ArchitectureTrustEdge,
} satisfies EdgeTypes;

type ArchitectureCanvasProps = {
  nodes: ArchitectureGraphNode[];
  edges: ArchitectureGraphEdge[];
  language: Language;
  reducedMotion: boolean;
  onFitReady: (fit: () => void) => void;
  onClearSelection: () => void;
};

export function ArchitectureCanvas({
  nodes,
  edges,
  language,
  reducedMotion,
  onFitReady,
  onClearSelection,
}: ArchitectureCanvasProps) {
  const copy = architectureCopy[language];
  const reducedMotionRef = useRef(reducedMotion);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(() => new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(() => new Set());
  const presentedNodes = useMemo(
    () => nodes.map((node) => ({ ...node, selected: selectedNodeIds.has(node.id) })),
    [nodes, selectedNodeIds],
  );
  const presentedEdges = useMemo(
    () => edges.map((edge) => ({ ...edge, selected: selectedEdgeIds.has(edge.id) })),
    [edges, selectedEdgeIds],
  );

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const clearSelection = () => {
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    onClearSelection();
  };

  return (
    <div className="architecture-canvas-shell">
      <p className="architecture-keyboard-guide">{copy.keyboardGuide}</p>
      <div
        className="architecture-canvas"
        aria-label={copy.canvasLabel}
        onKeyDownCapture={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            clearSelection();
            return;
          }

          if (event.key !== 'Enter' && event.key !== ' ') return;

          const element = (event.target as HTMLElement).closest<HTMLElement>(
            '.react-flow__node, .react-flow__edge',
          );
          const id = element?.dataset.id;
          if (!element || !id || !event.currentTarget.contains(element)) return;

          event.preventDefault();
          event.stopPropagation();

          if (element.classList.contains('react-flow__node')) {
            setSelectedNodeIds((current) =>
              current.has(id) ? new Set() : new Set([id]),
            );
            return;
          }

          setSelectedEdgeIds((current) =>
            current.has(id) ? new Set() : new Set([id]),
          );
        }}
      >
        <ReactFlow<ArchitectureGraphNode, ArchitectureGraphEdge>
          nodes={presentedNodes}
          edges={presentedEdges}
          onNodesChange={(changes) => {
            const selectionChanges = changes.filter(
              (change) => change.type === 'select',
            );
            if (selectionChanges.length === 0) return;

            setSelectedNodeIds((current) => {
              const next = new Set(current);
              for (const change of selectionChanges) {
                if (change.type !== 'select') continue;
                if (change.selected) next.add(change.id);
                else next.delete(change.id);
              }
              return next;
            });
          }}
          onEdgesChange={(changes) => {
            const selectionChanges = changes.filter(
              (change) => change.type === 'select',
            );
            if (selectionChanges.length === 0) return;

            setSelectedEdgeIds((current) => {
              const next = new Set(current);
              for (const change of selectionChanges) {
                if (change.type !== 'select') continue;
                if (change.selected) next.add(change.id);
                else next.delete(change.id);
              }
              return next;
            });
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{
            padding: 0.16,
            minZoom: 0.42,
            maxZoom: 1.1,
            duration: reducedMotion ? 0 : 320,
          }}
          minZoom={0.3}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          deleteKeyCode={null}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          nodesFocusable
          edgesFocusable
          autoPanOnNodeFocus={!reducedMotion}
          ariaLabelConfig={copy.reactFlowAria}
          proOptions={{ hideAttribution: false }}
          onInit={(instance) => {
            onFitReady(() => {
              void instance.fitView({
                padding: 0.16,
                minZoom: 0.42,
                maxZoom: 1.1,
                duration: reducedMotionRef.current ? 0 : 320,
              });
            });
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={28} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
