import type { MouseEvent } from 'react';
import type { Language } from '../i18n/language';
import type {
  PublicArchitectureFlow,
  PublicArchitectureLens,
} from './architecture.types';

type LensPanelProps = {
  language: Language;
  lens: PublicArchitectureLens;
  flows: PublicArchitectureFlow[];
  onSelectFlow: (flowId: string) => void;
};

const copy = {
  en: {
    relatedFlows: 'Related narrated flows',
  },
  es: {
    relatedFlows: 'Flujos narrados relacionados',
  },
} as const;

export function LensPanel({
  language,
  lens,
  flows,
  onSelectFlow,
}: LensPanelProps) {
  const relatedFlows = lens.flowIds.flatMap((flowId) => {
    const flow = flows.find(({ id }) => id === flowId);
    return flow ? [flow] : [];
  });

  const selectFlow = (
    event: MouseEvent<HTMLAnchorElement>,
    flowId: string,
  ) => {
    event.preventDefault();
    onSelectFlow(flowId);
  };

  return (
    <section
      id="architecture-lens-panel"
      className="architecture-lens-panel"
      aria-labelledby="architecture-lens-title"
      tabIndex={0}
    >
      <header>
        <h2 id="architecture-lens-title">{lens.title[language]}</h2>
        <p>{lens.summary[language]}</p>
      </header>
      <div className="architecture-lens-panel__sections">
        {lens.sections.map((section) => (
          <section key={section.id}>
            <h3>{section.title[language]}</h3>
            <p>{section.body[language]}</p>
          </section>
        ))}
      </div>
      {relatedFlows.length > 0 ? (
        <nav
          className="architecture-lens-panel__flows"
          aria-label={copy[language].relatedFlows}
        >
          <p>{copy[language].relatedFlows}</p>
          <ul>
            {relatedFlows.map((flow) => (
              <li key={flow.id}>
                <a
                  href="#architecture-flows-title"
                  onClick={(event) => selectFlow(event, flow.id)}
                >
                  {flow.title[language]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  );
}
