import type { BlogCatalogItem } from './types';

export const blogCatalog = [
  {
    id: 'juana-build-01',
    slug: 'building-juana-self-hosted-ai',
    publishedAt: '2026-03-14T21:22:40Z',
    sourcePostId: 'c5a60ad26791',
    sourceUrl:
      'https://medium.com/@kathesama/im-building-a-personal-ai-that-lives-on-my-pc-here-s-what-i-ve-learned-so-far-c5a60ad26791',
    seriesOrder: 1,
    featured: false,
    title: {
      en: 'I’m Building a Personal AI That Lives on My PC — Here’s What I’ve Learned So Far',
      es: 'Estoy construyendo una IA personal que vive en mi PC: esto es lo que aprendí hasta ahora',
    },
    summary: {
      en: 'A field report on building JuanaIA from scratch with local models, persistent memory, RAG, and Zero Trust service boundaries.',
      es: 'Una crónica sobre la construcción de JuanaIA desde cero con modelos locales, memoria persistente, RAG y límites de servicio Zero Trust.',
    },
    tags: {
      en: ['Self-hosted AI', 'Microservices', 'RAG', 'Zero Trust'],
      es: ['IA autoalojada', 'Microservicios', 'RAG', 'Zero Trust'],
    },
    coverPath: '/images/blog/building-juana-self-hosted-ai/figure-01.png',
    coverAlt: {
      en: 'Portrait of Juana against a blue digital interface background',
      es: 'Retrato de Juana sobre un fondo azul de interfaces digitales',
    },
  },
  {
    id: 'juana-build-02',
    slug: 'juana-orchestration-layer',
    publishedAt: '2026-04-08T16:14:22Z',
    sourcePostId: 'c5eb39f8c320',
    sourceUrl:
      'https://medium.com/@kathesama/i-gave-my-local-ai-a-brain-how-i-designed-the-orchestration-layer-c5eb39f8c320',
    seriesOrder: 2,
    featured: false,
    title: {
      en: 'I Gave My Local AI a Brain: How I Designed the Orchestration Layer',
      es: 'Le di un cerebro a mi IA local: cómo diseñé la capa de orquestación',
    },
    summary: {
      en: 'Inside the Planner, Soul, and Ruflo architecture that separates decisions, execution, resilience, and auditability in JuanaIA.',
      es: 'Una mirada a la arquitectura de Planner, Soul y Ruflo, que separa decisiones, ejecución, resiliencia y auditoría en JuanaIA.',
    },
    tags: {
      en: ['AI orchestration', 'Agents', 'Architecture', 'LangGraph'],
      es: ['Orquestación de IA', 'Agentes', 'Arquitectura', 'LangGraph'],
    },
    coverPath: '/images/blog/juana-orchestration-layer/figure-01.png',
    coverAlt: {
      en: 'Juana beside a glowing digital brain under the title I Gave My Local AI a Brain',
      es: 'Juana junto a un cerebro digital luminoso bajo el título I Gave My Local AI a Brain',
    },
  },
  {
    id: 'juana-build-03',
    slug: 'self-hosted-ai-latency-24-to-2',
    publishedAt: '2026-04-30T16:58:14Z',
    sourcePostId: '2085faacab7f',
    sourceUrl:
      'https://medium.com/@kathesama/from-24-seconds-to-2-how-i-optimized-response-times-in-a-self-hosted-ai-assistant-2085faacab7f',
    seriesOrder: 3,
    featured: false,
    title: {
      en: 'From 24 Seconds to 2: How I Optimized Response Times in a Self-Hosted AI Assistant',
      es: 'De 24 segundos a 2: cómo optimicé los tiempos de respuesta de un asistente de IA autoalojado',
    },
    summary: {
      en: 'A traced performance investigation that replaced llama.cpp with vLLM, measured the result, and added hybrid retrieval without giving up isolation.',
      es: 'Una investigación de rendimiento con trazas que reemplazó llama.cpp por vLLM, midió el resultado y agregó recuperación híbrida sin perder aislamiento.',
    },
    tags: {
      en: ['vLLM', 'Performance', 'GPU inference', 'Hybrid search'],
      es: ['vLLM', 'Rendimiento', 'Inferencia en GPU', 'Búsqueda híbrida'],
    },
    coverPath: '/images/blog/self-hosted-ai-latency-24-to-2/figure-01.png',
    coverAlt: {
      en: 'Benchmark table comparing cold start, warm direct p50, and HTTP average latency for bge-m3 and bge-reranker-v2-m3',
      es: 'Tabla de benchmark que compara arranque en frío, p50 directo en caliente y latencia HTTP promedio de bge-m3 y bge-reranker-v2-m3',
    },
  },
  {
    id: 'juana-build-04',
    slug: 'curiosity-driven-knowledge-enrichment',
    publishedAt: '2026-05-10T05:08:08Z',
    sourcePostId: 'c6e711c0ff8a',
    sourceUrl:
      'https://medium.com/@kathesama/when-your-ai-has-photographic-memory-but-no-understanding-designing-curiosity-driven-knowledge-c6e711c0ff8a',
    seriesOrder: 4,
    featured: true,
    title: {
      en: 'When Your AI Has Photographic Memory But No Understanding: Designing Curiosity-Driven Knowledge Enrichment',
      es: 'Cuando tu IA tiene memoria fotográfica pero no comprensión: diseño de un enriquecimiento de conocimiento guiado por la curiosidad',
    },
    summary: {
      en: 'A design for turning passive RAG storage into a governed knowledge engine that maps domains, detects gaps, and investigates them autonomously.',
      es: 'Un diseño para convertir un almacén RAG pasivo en un motor de conocimiento gobernado que mapea dominios, detecta vacíos y los investiga de forma autónoma.',
    },
    tags: {
      en: ['CDKE', 'RAG', 'Knowledge systems', 'Autonomous learning'],
      es: ['CDKE', 'RAG', 'Sistemas de conocimiento', 'Aprendizaje autónomo'],
    },
    coverPath: '/images/blog/curiosity-driven-knowledge-enrichment/cdke-architecture.png',
    coverAlt: {
      en: 'Figure: CDKE Architecture — Knowledge Map feeds domain awareness into the Curiosity Loop; the Interest Vector governs what the loop is allowed to investigate; both connect to the underlying RAG pipeline via ingestion, gap detection, and Planner integration.',
      es: 'Figura: Arquitectura de CDKE — Knowledge Map aporta conciencia del dominio al Curiosity Loop; Interest Vector gobierna qué puede investigar el bucle; ambos se conectan con el pipeline RAG subyacente mediante ingesta, detección de vacíos e integración con Planner.',
    },
  },
] satisfies BlogCatalogItem[];
