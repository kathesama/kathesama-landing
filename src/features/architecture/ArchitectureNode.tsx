import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ArchitectureGraphNode } from './architectureGraph';
import { NodeTooltip } from './NodeTooltip';

export function ArchitectureNode({ id, data, selected }: NodeProps<ArchitectureGraphNode>) {
  const tooltipId = `architecture-node-${id}-details`;

  return (
    <article
      aria-describedby={tooltipId}
      className="architecture-node__plate"
      data-tooltip-anchor={tooltipId}
      data-category={data.category}
      data-visual-state={data.visualState}
    >
      <Handle
        aria-hidden="true"
        className="architecture-node__anchor"
        isConnectable={false}
        position={Position.Left}
        tabIndex={-1}
        type="target"
      />
      <Handle
        aria-hidden="true"
        className="architecture-node__anchor"
        isConnectable={false}
        position={Position.Right}
        tabIndex={-1}
        type="source"
      />
      <div className="architecture-node__meta">
        <span className="architecture-node__category">{data.categoryLabel}</span>
        <span className="architecture-node__evidence">{data.evidenceLabel}</span>
      </div>
      <h3>{data.label}</h3>
      <p className="architecture-node__capability">{data.capability}</p>
      <NodeTooltip
        id={tooltipId}
        description={data.description}
        capability={data.capability}
        selected={selected}
      />
    </article>
  );
}
