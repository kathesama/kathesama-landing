import type { Language } from '../i18n/language';
import { architectureCopy } from './architectureCopy';
import {
  architectureCategories,
  type PublicArchitectureDataset,
} from './architecture.types';
import { FlowNarrative } from './FlowPanel';

type ArchitectureFallbackProps = {
  dataset: PublicArchitectureDataset;
  language: Language;
  selectedFlowId: string | null;
  onSelectFlow: (flowId: string | null) => void;
  onRetry: () => void;
};

export function ArchitectureFallback({
  dataset,
  language,
  selectedFlowId,
  onSelectFlow,
  onRetry,
}: ArchitectureFallbackProps) {
  const copy = architectureCopy[language];
  const selectedFlow = dataset.flows.find(({ id }) => id === selectedFlowId);

  return (
    <section
      className="architecture-fallback"
      aria-label={copy.fallback.title}
      role="region"
    >
      <header className="architecture-fallback__header">
        <h2>{copy.fallback.title}</h2>
        <p>{copy.fallback.message}</p>
        <button type="button" className="architecture-fallback__retry" onClick={onRetry}>
          {copy.fallback.retry}
        </button>
      </header>

      <section aria-labelledby="architecture-fallback-components">
        <h3 id="architecture-fallback-components">{copy.fallback.components}</h3>
        <div className="architecture-fallback__categories">
          {architectureCategories.map((category) => {
            const components = dataset.nodes.filter((node) => node.category === category);
            if (components.length === 0) return null;

            return (
              <section key={category} data-category={category}>
                <h4>{copy.categories[category]}</h4>
                <ul>
                  {components.map((component) => (
                    <li key={component.id}>
                      <strong>{component.label[language]}</strong>
                      <p>{component.description[language]}</p>
                      <p>{component.capability[language]}</p>
                      <span className="architecture-evidence-stamp">
                        {copy.evidence[component.evidence]}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="architecture-fallback-flows">
        <h3 id="architecture-fallback-flows">{copy.fallback.flows}</h3>
        <div className="architecture-fallback__flows">
          {dataset.flows.map((flow, index) => (
            <button
              key={flow.id}
              type="button"
              aria-pressed={flow.id === selectedFlowId}
              onClick={() => onSelectFlow(flow.id)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {flow.title[language]}
            </button>
          ))}
        </div>
        {selectedFlow ? (
          <FlowNarrative language={language} flow={selectedFlow} nodes={dataset.nodes} />
        ) : (
          <p className="architecture-flow-panel__empty">{copy.emptySelection}</p>
        )}
      </section>
    </section>
  );
}
