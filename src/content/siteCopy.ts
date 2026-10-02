import type { Language } from '../features/i18n/language';

export type LocalizedText = Record<Language, string>;

export const siteCopy = {
  hero: {
    label: {
      en: 'Privacy-First AI Infrastructure',
      es: 'Infraestructura de IA con Privacidad Primero',
    },
    title: { en: 'Meet JuanaIA', es: 'Conoce a JuanaIA' },
    summary: {
      en: 'A fully self-hosted personal AI assistant — no cloud, no API keys, no data leakage. Running entirely on local hardware with production-grade architecture.',
      es: 'Un asistente de IA personal completamente auto-alojado — sin nube, sin API keys, sin filtración de datos. Corriendo íntegramente en hardware local con arquitectura de nivel productivo.',
    },
    action: { en: 'Explore the project', es: 'Explorar el proyecto' },
    architectureAction: {
      en: 'Explore architecture',
      es: 'Explorar arquitectura',
    },
    architectureDetail: {
      en: '9 lenses · 8 interactive flows',
      es: '9 lentes · 8 flujos interactivos',
    },
    scroll: {
      en: 'scroll to discover',
      es: 'desplazarse para descubrir',
    },
  },
  project: {
    eyebrow: { en: 'The Project', es: 'El Proyecto' },
    title: { en: 'What is JuanaIA?', es: '¿Qué es JuanaIA?' },
    body: {
      en: 'JuanaIA is a fully self-hosted personal AI assistant built on a microservices architecture with local LLM inference, semantic memory, RAG pipelines, and an autonomous agent loop. No external dependencies — everything runs on an NVIDIA RTX 5090.',
      es: 'JuanaIA es un asistente de IA personal completamente auto-alojado, construido sobre una arquitectura de microservicios con inferencia LLM local, memoria semántica, pipelines RAG y un bucle de agente autónomo. Sin dependencias externas — todo corre en una NVIDIA RTX 5090.',
    },
  },
  builder: {
    eyebrow: { en: 'The Builder', es: 'La Creadora' },
    title: { en: 'Katherine E. Aguirre', es: 'Katherine E. Aguirre' },
    body: {
      en: 'Senior Software Engineer and AI Infrastructure Architect based in Buenos Aires, Argentina. Sole developer, architect, and PM of JuanaIA — designing and building production-grade AI systems end to end.',
      es: 'Ingeniera de Software Senior y Arquitecta de Infraestructura de IA, radicada en Buenos Aires, Argentina. Desarrolladora, arquitecta y PM en solitario de JuanaIA — diseñando y construyendo sistemas de IA de nivel productivo de punta a punta.',
    },
    availability: {
      en: 'Open to remote Senior Software Engineer, AI Infrastructure Engineer, or Backend Architect roles.',
      es: 'Disponible para roles remotos de Ingeniera de Software Senior, Ingeniera de Infraestructura de IA o Arquitecta Backend.',
    },
    linksLabel: { en: 'Find me at', es: 'Encuéntrame en' },
  },
} satisfies Record<string, Record<string, LocalizedText>>;

export const techCards = [
  {
    label: { en: 'Inference', es: 'Inferencia' },
    title: { en: 'Qwen3-Omni 30B', es: 'Qwen3-Omni 30B' },
    lines: ['vLLM · AWQ 4-bit · 134K ctx', 'NVIDIA RTX 5090 · 28GB VRAM'],
  },
  {
    label: { en: 'Memory', es: 'Memoria' },
    title: { en: 'Semantic + Episodic', es: 'Semántica + Episódica' },
    lines: ['pgvector · BGE-M3 embeddings', 'Hybrid search · ParadeDB'],
  },
  {
    label: { en: 'Agent Loop', es: 'Bucle de Agente' },
    title: { en: 'Autonomous Planner', es: 'Planificador Autónomo' },
    lines: ['LangGraph · Kafka backbone', 'Replanning · Tool execution'],
  },
  {
    label: { en: 'Interfaces', es: 'Interfaces' },
    title: { en: 'Multi-Channel', es: 'Multi-Channel' },
    lines: ['REST · SSE streaming · PWA', 'Voice: Whisper STT + XTTS-v2'],
  },
  {
    label: { en: 'Infrastructure', es: 'Infraestructura' },
    title: { en: 'Self-Hosted Stack', es: 'Self-Hosted Stack' },
    lines: ['Spring Cloud · Keycloak · n8n', 'OpenBao · Grafana · Docker'],
  },
  {
    label: { en: 'Roadmap', es: 'Hoja de Ruta' },
    title: { en: 'Coming in R4–R5', es: 'Próximamente R4–R5' },
    lines: ['FLUX.1 image gen · Neo4j graph', 'Avatar (VRM) · TensorRT-LLM'],
  },
] satisfies Array<{
  label: LocalizedText;
  title: LocalizedText;
  lines: string[];
}>;

export const stackItems = [
  'Python',
  'Java / Spring Boot',
  'React 19',
  'TypeScript',
  'PostgreSQL + pgvector',
  'Kafka',
  'Redis',
  'Docker',
  'Cloudflare Tunnel',
  'WSL2',
  'ONNX INT8',
  'safetensors',
] as const;
