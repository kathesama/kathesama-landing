import type { AriaLabelConfig } from '@xyflow/react';
import type { Language } from '../i18n/language';
import type {
  ArchitectureCategory,
  ArchitectureEdgeType,
  ArchitectureEvidence,
} from './architecture.types';

export type ArchitectureVisualState = 'resting' | 'active' | 'dimmed';

type RoadmapItem = {
  title: string;
  description: string;
  status: 'next';
};

type ArchitectureCopy = {
  eyebrow: string;
  title: string;
  summary: string;
  disclaimer: string;
  index: (componentCount: number, flowCount: number) => string;
  flowPanelTitle: string;
  emptySelection: string;
  allFlows: string;
  flowSelectorLabel: string;
  outcomeLabel: string;
  stagesLabel: string;
  toolbarLabel: string;
  controls: {
    clear: string;
    fit: string;
    contracts: string;
    observability: string;
    copyJson: string;
    downloadJson: string;
  };
  copyStatus: {
    copied: string;
    failed: string;
  };
  categories: Record<ArchitectureCategory, string>;
  evidence: Record<ArchitectureEvidence, string>;
  evidenceDescriptions: Record<ArchitectureEvidence, string>;
  edgeTypes: Record<ArchitectureEdgeType, string>;
  edgeDescriptions: Record<ArchitectureEdgeType, string>;
  visualStates: Record<ArchitectureVisualState, string>;
  legend: {
    title: string;
    componentFamilies: string;
    connectionSemantics: string;
    evidenceStates: string;
  };
  keyboardGuide: string;
  canvasLabel: string;
  selectionAnnouncement: (flowTitle: string, stepCount: number) => string;
  noSelectionAnnouncement: string;
  fallback: {
    title: string;
    message: string;
    components: string;
    flows: string;
    retry: string;
  };
  aria: {
    component: string;
    connection: string;
    capability: string;
    evidence: string;
    state: string;
    from: string;
    to: string;
    semantics: string;
    trustMarker: string;
    lens: string;
    withinSelectedLens: string;
    outsideSelectedLens: string;
    relatedToSelectedLens: string;
  };
  reactFlowAria: Partial<AriaLabelConfig>;
  roadmap: {
    eyebrow: string;
    title: string;
    summary: string;
    items: readonly RoadmapItem[];
  };
};

const spanishDirections: Readonly<Record<string, string>> = {
  left: 'hacia la izquierda',
  right: 'hacia la derecha',
  top: 'hacia arriba',
  bottom: 'hacia abajo',
};

function localizeSpanishDirection(direction: string): string {
  return spanishDirections[direction] ?? 'en una dirección desconocida';
}

export const architectureCopy = {
  en: {
    eyebrow: 'SYSTEMS ATLAS · PUBLIC EDITION',
    title: 'JuanaIA systems atlas',
    summary:
      'A narrated, conceptual map of how an intentional request becomes a grounded response or an approved action.',
    disclaimer:
      'Conceptual public view; implementation and deployment details are intentionally omitted.',
    index: (componentCount, flowCount) =>
      `${componentCount} components · ${flowCount} narrated flows · public edition`,
    flowPanelTitle: 'How Juana thinks and acts',
    emptySelection:
      'Choose a narrated flow to trace its complete route, outcome, and evidence through the system.',
    allFlows: 'All flows',
    flowSelectorLabel: 'Choose a narrated flow',
    outcomeLabel: 'Outcome',
    stagesLabel: 'Stages',
    toolbarLabel: 'Architecture view controls',
    controls: {
      clear: 'Clear',
      fit: 'Fit',
      contracts: 'Contracts',
      observability: 'Observability',
      copyJson: 'Copy JSON',
      downloadJson: 'Download JSON',
    },
    copyStatus: {
      copied: 'Architecture JSON copied to the clipboard.',
      failed: 'The architecture JSON could not be copied. Use the download link instead.',
    },
    categories: {
      experience: 'Experience',
      access: 'Access',
      orchestration: 'Orchestration',
      context: 'Context',
      intelligence: 'Intelligence',
      capability: 'Capabilities',
      knowledge: 'Knowledge',
      platform: 'Platform',
      assurance: 'Assurance',
    },
    evidence: {
      verified: 'Verified',
      'implemented-in-code': 'Implemented in code',
      conditional: 'Conditional',
      next: 'Next',
    },
    evidenceDescriptions: {
      verified: 'Exercised end to end with direct evidence.',
      'implemented-in-code':
        'Present in current source or configuration; this is not a runtime or deployment claim.',
      conditional: 'Available only after an explicit decision or approval.',
      next: 'Roadmap direction outside the current architecture graph.',
    },
    edgeTypes: {
      sync: 'Synchronous',
      stream: 'Streaming',
      async: 'Asynchronous',
      data: 'Data',
      trust: 'Trust',
      telemetry: 'Telemetry',
    },
    edgeDescriptions: {
      sync: 'A direct conceptual request and result exchange.',
      stream: 'A progressive conceptual exchange over time.',
      async: 'A deferred conceptual handoff.',
      data: 'A conceptual context or knowledge exchange.',
      trust: 'A conceptual identity or approval decision.',
      telemetry: 'A conceptual operational signal for visibility.',
    },
    visualStates: {
      resting: 'available',
      active: 'active',
      dimmed: 'outside the selected route',
    },
    legend: {
      title: 'Map legend',
      componentFamilies: 'Component families',
      connectionSemantics: 'Connection semantics',
      evidenceStates: 'Evidence states',
    },
    keyboardGuide:
      'Use Tab to reach components and connections. Press Enter or Space to select, and Escape to clear the current flow.',
    canvasLabel: 'Interactive public architecture map of JuanaIA',
    selectionAnnouncement: (flowTitle, stepCount) =>
      `${flowTitle} selected with ${stepCount} ordered steps.`,
    noSelectionAnnouncement: 'All architecture flows are visible.',
    fallback: {
      title: 'Architecture map in text',
      message:
        'The interactive map is unavailable, but every public component and narrated flow remains readable below.',
      components: 'Components by family',
      flows: 'Narrated flows',
      retry: 'Retry interactive map',
    },
    aria: {
      component: 'Component',
      connection: 'Connection',
      capability: 'Capability',
      evidence: 'Evidence',
      state: 'State',
      from: 'from',
      to: 'to',
      semantics: 'Semantics',
      trustMarker: 'Trust decision marker; direction remains indicated by the arrow.',
      lens: 'Lens',
      withinSelectedLens: 'within the selected lens',
      outsideSelectedLens: 'outside the selected lens',
      relatedToSelectedLens: 'Related to the selected lens',
    },
    reactFlowAria: {
      'node.a11yDescription.default':
        'Press Enter or Space to select this component. Press Escape to clear the selected flow.',
      'node.a11yDescription.keyboardDisabled': 'This architecture component is read-only.',
      'node.a11yDescription.ariaLiveMessage': ({ direction, x, y }) =>
        `Moved ${direction} to conceptual position ${x}, ${y}.`,
      'edge.a11yDescription.default': 'Press Enter or Space to select this connection.',
      'controls.ariaLabel': 'Architecture viewport controls',
      'controls.zoomIn.ariaLabel': 'Zoom in',
      'controls.zoomOut.ariaLabel': 'Zoom out',
      'controls.fitView.ariaLabel': 'Fit architecture to view',
      'controls.interactive.ariaLabel': 'Toggle interactive mode',
      'minimap.ariaLabel': 'Architecture overview',
      'handle.ariaLabel': 'Connection point',
    },
    roadmap: {
      eyebrow: 'NEXT · EDITORIAL ROADMAP',
      title: 'Beyond the current public graph',
      summary: 'These directions are intentionally separate from the current architecture.',
      items: [
        {
          title: 'External channels',
          description: 'Explore additional intentional ways to begin a conversation.',
          status: 'next',
        },
        {
          title: 'Ambient autonomy',
          description: 'Study bounded proactive behavior with explicit human control.',
          status: 'next',
        },
        {
          title: 'Knowledge graph',
          description: 'Explore richer conceptual relationships across retained knowledge.',
          status: 'next',
        },
      ],
    },
  },
  es: {
    eyebrow: 'ATLAS DE SISTEMAS · EDICIÓN PÚBLICA',
    title: 'Atlas de sistemas de JuanaIA',
    summary:
      'Un mapa conceptual narrado de cómo una solicitud intencional se convierte en una respuesta fundamentada o una acción aprobada.',
    disclaimer:
      'Vista pública conceptual; los detalles de implementación y despliegue se omiten intencionalmente.',
    index: (componentCount, flowCount) =>
      `${componentCount} componentes · ${flowCount} flujos narrados · edición pública`,
    flowPanelTitle: 'Cómo piensa y actúa Juana',
    emptySelection:
      'Elegí un flujo narrado para recorrer su ruta completa, su resultado y su evidencia dentro del sistema.',
    allFlows: 'Todos los flujos',
    flowSelectorLabel: 'Elegí un flujo narrado',
    outcomeLabel: 'Resultado',
    stagesLabel: 'Etapas',
    toolbarLabel: 'Controles de la vista de arquitectura',
    controls: {
      clear: 'Limpiar',
      fit: 'Ajustar',
      contracts: 'Contratos',
      observability: 'Observabilidad',
      copyJson: 'Copiar JSON',
      downloadJson: 'Descargar JSON',
    },
    copyStatus: {
      copied: 'El JSON de arquitectura se copió al portapapeles.',
      failed: 'No se pudo copiar el JSON de arquitectura. Usá el enlace de descarga.',
    },
    categories: {
      experience: 'Experiencia',
      access: 'Acceso',
      orchestration: 'Orquestación',
      context: 'Contexto',
      intelligence: 'Inteligencia',
      capability: 'Capacidades',
      knowledge: 'Conocimiento',
      platform: 'Plataforma',
      assurance: 'Garantía',
    },
    evidence: {
      verified: 'Verificado',
      'implemented-in-code': 'Implementado en código',
      conditional: 'Condicional',
      next: 'Próximo',
    },
    evidenceDescriptions: {
      verified: 'Ejercitado de extremo a extremo con evidencia directa.',
      'implemented-in-code':
        'Presente en el código o la configuración actuales; no afirma ejecución ni despliegue.',
      conditional: 'Disponible únicamente después de una decisión o aprobación explícita.',
      next: 'Dirección futura fuera del grafo de arquitectura actual.',
    },
    edgeTypes: {
      sync: 'Sincrónica',
      stream: 'Progresiva',
      async: 'Asincrónica',
      data: 'Datos',
      trust: 'Confianza',
      telemetry: 'Telemetría',
    },
    edgeDescriptions: {
      sync: 'Un intercambio conceptual directo de solicitud y resultado.',
      stream: 'Un intercambio conceptual progresivo a lo largo del tiempo.',
      async: 'Una entrega conceptual diferida.',
      data: 'Un intercambio conceptual de contexto o conocimiento.',
      trust: 'Una decisión conceptual de identidad o aprobación.',
      telemetry: 'Una señal operativa conceptual para aportar visibilidad.',
    },
    visualStates: {
      resting: 'disponible',
      active: 'en la ruta seleccionada',
      dimmed: 'fuera de la ruta seleccionada',
    },
    legend: {
      title: 'Leyenda del mapa',
      componentFamilies: 'Familias de componentes',
      connectionSemantics: 'Semántica de conexiones',
      evidenceStates: 'Estados de evidencia',
    },
    keyboardGuide:
      'Usá Tab para recorrer componentes y conexiones. Presioná Enter o Espacio para seleccionar y Escape para limpiar el flujo actual.',
    canvasLabel: 'Mapa interactivo de la arquitectura pública de JuanaIA',
    selectionAnnouncement: (flowTitle, stepCount) =>
      `${flowTitle} seleccionado con ${stepCount} pasos ordenados.`,
    noSelectionAnnouncement: 'Todos los flujos de arquitectura están visibles.',
    fallback: {
      title: 'Mapa de arquitectura en texto',
      message:
        'El mapa interactivo no está disponible, pero todos los componentes públicos y flujos narrados siguen siendo legibles.',
      components: 'Componentes por familia',
      flows: 'Flujos narrados',
      retry: 'Reintentar mapa interactivo',
    },
    aria: {
      component: 'Componente',
      connection: 'Conexión',
      capability: 'Capacidad',
      evidence: 'Evidencia',
      state: 'Estado',
      from: 'desde',
      to: 'hacia',
      semantics: 'Semántica',
      trustMarker:
        'Marcador de decisión de confianza; la dirección sigue indicada por la flecha.',
      lens: 'Lente',
      withinSelectedLens: 'dentro de la lente seleccionada',
      outsideSelectedLens: 'fuera de la lente seleccionada',
      relatedToSelectedLens: 'Relacionado con la lente seleccionada',
    },
    reactFlowAria: {
      'node.a11yDescription.default':
        'Presioná Enter o Espacio para seleccionar este componente. Presioná Escape para limpiar el flujo seleccionado.',
      'node.a11yDescription.keyboardDisabled': 'Este componente de arquitectura es de solo lectura.',
      'node.a11yDescription.ariaLiveMessage': ({ direction, x, y }) =>
        `Movido ${localizeSpanishDirection(direction)} a la posición conceptual ${x}, ${y}.`,
      'edge.a11yDescription.default': 'Presioná Enter o Espacio para seleccionar esta conexión.',
      'controls.ariaLabel': 'Controles del plano de arquitectura',
      'controls.zoomIn.ariaLabel': 'Acercar',
      'controls.zoomOut.ariaLabel': 'Alejar',
      'controls.fitView.ariaLabel': 'Ajustar la arquitectura a la vista',
      'controls.interactive.ariaLabel': 'Alternar modo interactivo',
      'minimap.ariaLabel': 'Vista general de arquitectura',
      'handle.ariaLabel': 'Punto de conexión',
    },
    roadmap: {
      eyebrow: 'PRÓXIMO · HOJA DE RUTA EDITORIAL',
      title: 'Más allá del grafo público actual',
      summary: 'Estas direcciones se mantienen intencionalmente separadas de la arquitectura actual.',
      items: [
        {
          title: 'Canales externos',
          description: 'Explorar otras formas intencionales de iniciar una conversación.',
          status: 'next',
        },
        {
          title: 'Autonomía ambiental',
          description: 'Estudiar comportamientos proactivos acotados bajo control humano explícito.',
          status: 'next',
        },
        {
          title: 'Grafo de conocimiento',
          description: 'Explorar relaciones conceptuales más ricas dentro del conocimiento conservado.',
          status: 'next',
        },
      ],
    },
  },
} satisfies Record<Language, ArchitectureCopy>;

export function getArchitectureCopy(language: Language): ArchitectureCopy {
  return architectureCopy[language];
}
