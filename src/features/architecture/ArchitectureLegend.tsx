import type { Language } from '../i18n/language';
import { architectureCopy } from './architectureCopy';
import {
  architectureCategories,
  architectureEdgeTypes,
  architectureEvidence,
} from './architecture.types';

type ArchitectureLegendProps = {
  language: Language;
};

export function ArchitectureLegend({ language }: ArchitectureLegendProps) {
  const copy = architectureCopy[language];
  const currentEvidence = architectureEvidence.filter((state) => state !== 'next');

  return (
    <section className="architecture-legend" aria-labelledby="architecture-legend-title">
      <h2 id="architecture-legend-title">{copy.legend.title}</h2>
      <div className="architecture-legend__groups">
        <div>
          <h3>{copy.legend.componentFamilies}</h3>
          <ul className="architecture-legend__compact-list">
            {architectureCategories.map((category) => (
              <li key={category} data-category={category}>
                {copy.categories[category]}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{copy.legend.connectionSemantics}</h3>
          <dl>
            {architectureEdgeTypes.map((edgeType) => (
              <div key={edgeType} data-edge-type={edgeType}>
                <dt>
                  <span
                    className={`architecture-legend__edge-sample architecture-legend__edge-sample--${edgeType}`}
                    data-edge-sample={edgeType}
                    aria-hidden="true"
                  >
                    {edgeType === 'trust' ? (
                      <svg viewBox="0 0 16 16">
                        <path d="M5 7V5a3 3 0 0 1 6 0v2" />
                        <rect x="3" y="7" width="10" height="7" rx="1" />
                      </svg>
                    ) : null}
                  </span>
                  <span>{copy.edgeTypes[edgeType]}</span>
                </dt>
                <dd>{copy.edgeDescriptions[edgeType]}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h3>{copy.legend.evidenceStates}</h3>
          <dl>
            {currentEvidence.map((evidence) => (
              <div key={evidence}>
                <dt>{copy.evidence[evidence]}</dt>
                <dd>{copy.evidenceDescriptions[evidence]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
