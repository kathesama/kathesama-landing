import { Link } from 'react-router-dom';
import { publicArchitecture } from '../../content/architecture';
import type { Language } from '../i18n/language';
import { useLanguage } from '../i18n/LanguageContext';

const previewNodeIds = [
  'person',
  'gateway',
  'soul',
  'planner',
  'inference',
] as const;

const previewCopy = {
  en: {
    label: 'Public architecture',
    eyebrow: 'SYSTEMS ATLAS · PUBLIC EDITION',
    title: 'Follow one request through JuanaIA',
    body: [
      'This public field note traces five conceptual stops from intent to language intelligence.',
      'It is intentionally curated to explain the system without exposing private operational detail.',
    ],
    layers: ['Experience', 'Orchestration', 'Intelligence', 'Context'],
    summary:
      'Person to Experience gateway to Conversation core to Planning to Language intelligence.',
    action: 'Open the systems atlas',
  },
  es: {
    label: 'Arquitectura pública',
    eyebrow: 'ATLAS DE SISTEMAS · EDICIÓN PÚBLICA',
    title: 'Seguí una solicitud a través de JuanaIA',
    body: [
      'Esta nota de campo pública recorre cinco paradas conceptuales, desde la intención hasta la inteligencia de lenguaje.',
      'Está curada para explicar el sistema sin exponer detalles operativos privados.',
    ],
    layers: ['Experiencia', 'Orquestación', 'Inteligencia', 'Contexto'],
    summary:
      'Persona a Puerta de experiencia a Núcleo conversacional a Planificación a Inteligencia de lenguaje.',
    action: 'Abrir el atlas de sistemas',
  },
} satisfies Record<
  Language,
  {
    label: string;
    eyebrow: string;
    title: string;
    body: readonly [string, string];
    layers: readonly [string, string, string, string];
    summary: string;
    action: string;
  }
>;

export function ArchitecturePreview() {
  const { language } = useLanguage();
  const copy = previewCopy[language];
  const primaryFlow = publicArchitecture.flows.find((flow) => flow.primary);
  const previewNodes = previewNodeIds.flatMap((nodeId) => {
    if (!primaryFlow?.steps.includes(nodeId)) return [];

    const node = publicArchitecture.nodes.find((candidate) => candidate.id === nodeId);
    return node ? [node] : [];
  });

  return (
    <section
      className="architecture-preview"
      aria-labelledby="architecture-preview-title"
      data-testid="architecture-preview"
    >
      <div className="architecture-preview-layout">
        <div className="architecture-preview-copy">
          <p className="section-header">{copy.eyebrow}</p>
          <h2 className="section-title" id="architecture-preview-title">
            {copy.title}
          </h2>
          <p className="architecture-preview-body">
            {copy.body[0]} {copy.body[1]}
          </p>
          <div className="architecture-preview-layers" aria-label={copy.label}>
            {copy.layers.map((layer) => (
              <span key={layer}>{layer}</span>
            ))}
          </div>
          <Link
            className="architecture-preview-cta"
            to={`/architecture?lang=${language}`}
          >
            {copy.action} <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="architecture-preview-diagram">
          <svg
            className="architecture-preview-line"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="preview-line-gradient" x1="0" x2="1">
                <stop offset="0" stopColor="var(--teal)" />
                <stop offset="1" stopColor="var(--gold)" />
              </linearGradient>
            </defs>
            <path d="M 4 10 H 96" vectorEffect="non-scaling-stroke" />
            <circle className="architecture-preview-signal" cx="4" cy="10" r="2" />
          </svg>
          <div className="architecture-preview-stops" aria-hidden="true">
            {previewNodes.map((node, index) => (
              <div
                className="architecture-preview-stop"
                data-node-id={node.id}
                key={node.id}
              >
                <span className="architecture-preview-stop-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{node.label[language]}</span>
              </div>
            ))}
          </div>
          <p className="visually-hidden">{copy.summary}</p>
        </div>
      </div>
    </section>
  );
}
