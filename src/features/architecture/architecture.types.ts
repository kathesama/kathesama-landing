import type { Language } from '../i18n/language';

export const architectureCategories = [
  'experience',
  'access',
  'orchestration',
  'context',
  'intelligence',
  'capability',
  'knowledge',
  'platform',
  'assurance',
] as const;

export const architectureEvidence = [
  'verified',
  'implemented-in-code',
  'conditional',
  'next',
] as const;

export const architectureEdgeTypes = [
  'sync',
  'stream',
  'async',
  'data',
  'trust',
  'telemetry',
] as const;

export const architectureLensIds = [
  'layers',
  'request-lifecycle',
  'knowledge-flows',
  'trust',
  'reliability',
  'decisions',
  'capability-status',
  'technologies',
  'contracts',
] as const;

export type LocalizedText = Record<Language, string>;
export type ArchitectureCategory = (typeof architectureCategories)[number];
export type ArchitectureEvidence = (typeof architectureEvidence)[number];
export type ArchitectureEdgeType = (typeof architectureEdgeTypes)[number];
export type ArchitectureLensId = (typeof architectureLensIds)[number];

export type PublicArchitectureNode = {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  capability: LocalizedText;
  category: ArchitectureCategory;
  evidence: ArchitectureEvidence;
  position: { x: number; y: number };
};

export type PublicArchitectureEdge = {
  id: string;
  source: string;
  target: string;
  label: LocalizedText;
  type: ArchitectureEdgeType;
};

export type PublicArchitectureStage = {
  id: string;
  label: LocalizedText;
  nodeIds: string[];
};

export type PublicArchitectureFlow = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  outcome: LocalizedText;
  evidence: ArchitectureEvidence;
  steps: string[];
  edgeIds: string[];
  stages: PublicArchitectureStage[];
  primary?: boolean;
};

export type PublicArchitectureLensSection = {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
};

export type PublicArchitectureLens = {
  id: ArchitectureLensId;
  title: LocalizedText;
  summary: LocalizedText;
  nodeIds: string[];
  edgeIds: string[];
  flowIds: string[];
  sections: PublicArchitectureLensSection[];
};

export type PublicArchitectureDataset = {
  version: 1;
  nodes: PublicArchitectureNode[];
  edges: PublicArchitectureEdge[];
  flows: PublicArchitectureFlow[];
  lenses: PublicArchitectureLens[];
};
