import { publicArchitecture } from '../content/architecture';
import { ArchitectureExplorer } from '../features/architecture/ArchitectureExplorer';
import { architectureCopy } from '../features/architecture/architectureCopy';
import '../features/architecture/architecture.css';
import { useLanguage } from '../features/i18n/LanguageContext';
import { PageMetadata } from '../features/seo/PageMetadata.tsx';
import { buildArchitectureMetadata } from '../features/seo/pageMetadata';

export default function ArchitecturePage() {
  const { language } = useLanguage();
  const copy = architectureCopy[language];

  return (
    <>
      <PageMetadata metadata={buildArchitectureMetadata(language)} />
      <section className="architecture-page">
        <header className="architecture-masthead">
        <div>
          <p className="architecture-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
        </div>
        <div className="architecture-masthead__statement">
          <p>{copy.summary}</p>
          <p className="architecture-disclaimer">{copy.disclaimer}</p>
          <p className="architecture-index">
            {copy.index(publicArchitecture.nodes.length, publicArchitecture.flows.length)}
          </p>
        </div>
        </header>
        <ArchitectureExplorer language={language} />
        <aside className="architecture-roadmap" aria-labelledby="architecture-roadmap-title">
        <div>
          <p className="architecture-eyebrow">{copy.roadmap.eyebrow}</p>
          <h2 id="architecture-roadmap-title">{copy.roadmap.title}</h2>
          <p>{copy.roadmap.summary}</p>
        </div>
        <ol>
          {copy.roadmap.items.map((item, index) => (
            <li key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
              <em>{copy.evidence[item.status]}</em>
            </li>
          ))}
        </ol>
        </aside>
      </section>
    </>
  );
}
