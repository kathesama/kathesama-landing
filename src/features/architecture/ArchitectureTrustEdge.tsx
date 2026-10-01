import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import type { ArchitectureGraphEdge } from './architectureGraph';

export function ArchitectureTrustEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  style,
  data,
  label,
}: EdgeProps<ArchitectureGraphEdge>) {
  const visualState = data?.visualState ?? 'resting';
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {label ? (
          <span
            className={`architecture-trust-label architecture-trust-label--${visualState} nodrag nopan`}
            data-visual-state={visualState}
            style={{
              transform: `translate(-50%, 0) translate(${labelX}px, ${labelY + 12}px)`,
            }}
          >
            {label}
          </span>
        ) : null}
        <span
          className={`architecture-trust-marker architecture-trust-marker--${visualState} nodrag nopan`}
          role="img"
          aria-label={data?.markerLabel}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 16 16">
            <path d="M5 7V5a3 3 0 0 1 6 0v2" />
            <rect x="3" y="7" width="10" height="7" rx="1" />
          </svg>
        </span>
      </EdgeLabelRenderer>
    </>
  );
}
