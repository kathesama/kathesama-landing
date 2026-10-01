import type { Language } from '../i18n/language';
import { architectureCopy } from './architectureCopy';
import type {
  PublicArchitectureFlow,
  PublicArchitectureNode,
} from './architecture.types';

type FlowPanelProps = {
  language: Language;
  flows: PublicArchitectureFlow[];
  nodes: PublicArchitectureNode[];
  selectedFlowId: string | null;
  onSelectFlow: (flowId: string | null) => void;
  highlightedFlowIds?: ReadonlySet<string>;
};

type FlowNarrativeProps = {
  language: Language;
  flow: PublicArchitectureFlow;
  nodes: PublicArchitectureNode[];
};

export function FlowNarrative({ language, flow, nodes }: FlowNarrativeProps) {
  const copy = architectureCopy[language];
  const nodeLabels = new Map(nodes.map((node) => [node.id, node.label[language]]));

  return (
    <section className="architecture-flow-detail" aria-label={flow.title[language]}>
      <div className="architecture-flow-detail__lead">
        <span className="architecture-evidence-stamp">
          {copy.evidence[flow.evidence]}
        </span>
        <p>{flow.summary[language]}</p>
      </div>
      <p className="architecture-flow-detail__label">{copy.outcomeLabel}</p>
      <p className="architecture-flow-detail__outcome">{flow.outcome[language]}</p>
      <p className="architecture-flow-detail__label">{copy.stagesLabel}</p>
      <ol className="architecture-stage-list">
        {flow.stages.map((stage, index) => (
          <li key={stage.id}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{stage.label[language]}</strong>
              <p>
                {stage.nodeIds
                  .map((nodeId) => nodeLabels.get(nodeId) ?? nodeId)
                  .join(' · ')}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FlowPanel({
  language,
  flows,
  nodes,
  selectedFlowId,
  onSelectFlow,
  highlightedFlowIds,
}: FlowPanelProps) {
  const copy = architectureCopy[language];
  const selectedFlow = flows.find(({ id }) => id === selectedFlowId);

  return (
    <aside className="architecture-flow-panel" aria-labelledby="architecture-flows-title">
      <div className="architecture-flow-panel__heading">
        <p className="architecture-coordinate">FLOW INDEX · 01—08</p>
        <h2 id="architecture-flows-title">{copy.flowPanelTitle}</h2>
      </div>
      <div className="architecture-flow-select">
        <label htmlFor="architecture-flow-select">{copy.flowSelectorLabel}</label>
        <select
          id="architecture-flow-select"
          value={selectedFlowId ?? ''}
          onChange={(event) => onSelectFlow(event.target.value || null)}
        >
          <option value="">{copy.allFlows}</option>
          {flows.map((flow) => (
            <option key={flow.id} value={flow.id}>
              {flow.title[language]}
            </option>
          ))}
        </select>
      </div>
      <ol className="architecture-flow-list">
        {flows.map((flow, index) => {
          const selected = flow.id === selectedFlowId;
          return (
            <li key={flow.id}>
              <button
                type="button"
                aria-pressed={selected}
                className={selected ? 'is-selected' : undefined}
                data-primary={flow.primary ? 'true' : undefined}
                data-lens-related={highlightedFlowIds?.has(flow.id) ? 'true' : undefined}
                onClick={() => onSelectFlow(flow.id)}
              >
                <span className="architecture-flow-list__number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="architecture-flow-list__copy">
                  <strong>{flow.title[language]}</strong>
                  <span>{flow.outcome[language]}</span>
                </span>
                <span className="architecture-evidence-stamp">
                  {copy.evidence[flow.evidence]}
                </span>
                {highlightedFlowIds?.has(flow.id) ? (
                  <span className="visually-hidden">
                    {copy.aria.relatedToSelectedLens}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
      {selectedFlow ? (
        <FlowNarrative language={language} flow={selectedFlow} nodes={nodes} />
      ) : (
        <p className="architecture-flow-panel__empty">{copy.emptySelection}</p>
      )}
    </aside>
  );
}
