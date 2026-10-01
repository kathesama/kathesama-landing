import { z } from 'zod';
import {
  architectureCategories,
  architectureEdgeTypes,
  architectureEvidence,
  architectureLensIds,
  type PublicArchitectureDataset,
} from './architecture.types';

const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a stable kebab-case ID');

const localizedValueSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, 'must contain visible text')
  .refine((value) => value === value.trim(), 'must not contain surrounding whitespace');

const localizedTextSchema = z
  .object({
    en: localizedValueSchema,
    es: localizedValueSchema,
  })
  .strict();

const positionSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
  })
  .strict();

const nodeSchema = z
  .object({
    id: idSchema,
    label: localizedTextSchema,
    description: localizedTextSchema,
    capability: localizedTextSchema,
    category: z.enum(architectureCategories),
    evidence: z.enum(architectureEvidence),
    position: positionSchema,
  })
  .strict();

const edgeSchema = z
  .object({
    id: idSchema,
    source: idSchema,
    target: idSchema,
    label: localizedTextSchema,
    type: z.enum(architectureEdgeTypes),
  })
  .strict();

const stageSchema = z
  .object({
    id: idSchema,
    label: localizedTextSchema,
    nodeIds: z.array(idSchema).min(1),
  })
  .strict();

const flowSchema = z
  .object({
    id: idSchema,
    title: localizedTextSchema,
    summary: localizedTextSchema,
    outcome: localizedTextSchema,
    evidence: z.enum(architectureEvidence),
    steps: z.array(idSchema).min(2),
    edgeIds: z.array(idSchema),
    stages: z.array(stageSchema).min(3).max(5),
    primary: z.boolean().optional(),
  })
  .strict();

const lensSectionSchema = z
  .object({
    id: idSchema,
    title: localizedTextSchema,
    body: localizedTextSchema,
  })
  .strict();

const lensSchema = z
  .object({
    id: z.enum(architectureLensIds),
    title: localizedTextSchema,
    summary: localizedTextSchema,
    nodeIds: z.array(idSchema).min(1),
    edgeIds: z.array(idSchema).min(1),
    flowIds: z.array(idSchema).min(1),
    sections: z.array(lensSectionSchema).min(1),
  })
  .strict();

const datasetSchema = z
  .object({
    version: z.literal(1),
    nodes: z.array(nodeSchema),
    edges: z.array(edgeSchema),
    flows: z.array(flowSchema),
    lenses: z.array(lensSchema).length(architectureLensIds.length),
  })
  .strict();

const forbiddenKeyPattern =
  /host(?:name)?|port|container|tunnel|realm|client.?id|header|secret|token|key|credential|path|url|model|hardware|vram|topic|table|schema|prompt|threshold|retry|deployment|environment|vulnerability|ticket|source.?refs|endpoint|version|config/i;

const sensitiveValueDetectors: ReadonlyArray<{
  category: string;
  patterns: readonly RegExp[];
}> = [
  {
    category: 'network-coordinate',
    patterns: [
      /\b(?:https?|wss?|ftp):\/\//i,
      /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?\b/,
      /\blocalhost(?::\d{1,5})?\b/i,
      /\b(?:[a-z0-9-]+\.)+[a-z0-9-]+:\d{1,5}\b/i,
      /\bport(?:\s+is|\s*[:=])?\s*\d{1,5}\b/i,
      /\bhost(?:name)?\s+(?:is\s+)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\b/i,
      /\bhost(?:name)?(?:\s+is)?\s+[a-z0-9]+(?:-[a-z0-9]+)+\b/i,
      /\b(?:runs?\s+)?(?:through|via|at)\s+[a-z0-9]+(?:-[a-z0-9]+)+\b/i,
    ],
  },
  {
    category: 'filesystem-path',
    patterns: [
      /\b[a-z]:[\\/][^\s]+/i,
      /\\\\[^\\/\s]+\\[^\\/\s]+(?:\\[^\\/\s]+)*/,
      /(?<![a-z0-9._-])\/(?!\/|\s)[a-z0-9._-]+(?:\/[a-z0-9._-]+)*/i,
    ],
  },
  {
    category: 'access-marker',
    patterns: [
      /\b(?:bearer|secret|api[-_ ]?key|private[-_ ]?key|access[-_ ]?token)\b/i,
      /\bx-user-context\b/i,
      /\b(?:header|credential|token)\s+[a-z0-9._-]+\b/i,
      /^\s*(?:authorization|cookie|set-cookie|x-[a-z0-9-]+)\s*$/i,
      /\b(?:uses?|carr(?:y|ies)|sends?|expects?|returns?|sets?|with|via)\s+(?:the\s+)?(?:authorization|cookie|set-cookie|x-[a-z0-9-]+)\b/i,
      /\b(?:authorization|cookie|set-cookie|x-[a-z0-9-]+)\s+header\b/i,
      /\b(?:AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35})\b/,
    ],
  },
  {
    category: 'identity-internal',
    patterns: [
      /\bclient\s+id\s+[a-z0-9._-]+\b/i,
      /\brealm\s+[a-z0-9._-]+\b/i,
      /\bkeycloak\s+(?:realm|client\s+scope|role|scope\s+config)\s+[a-z0-9._-]+\b/i,
    ],
  },
  {
    category: 'deployment-topology',
    patterns: [
      /\b(?:container|tunnel|deployment|environment)\s+[a-z0-9._-]+\b/i,
    ],
  },
  {
    category: 'messaging-internal',
    patterns: [
      /\bbroker\s+topic\b/i,
      /\btopic\s+[a-z0-9_-]+(?:\.[a-z0-9_-]+)+\b/i,
    ],
  },
  {
    category: 'network-coordinate',
    patterns: [
      /\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z](?:[a-z0-9-]*[a-z0-9])?\b/i,
    ],
  },
  {
    category: 'storage-internal',
    patterns: [
      /\b(?:table|schema)\s+[a-z0-9_]+\b/i,
      /\b(?:bucket|database)(?:\s+named)?\s+[a-z0-9]+(?:[._-][a-z0-9]+)+\b/i,
    ],
  },
  {
    category: 'exact-version',
    patterns: [/\bv?\d+\.\d+\.\d+(?:[-+][0-9a-z.-]+)?\b/i],
  },
  {
    category: 'tracker-reference',
    patterns: [/\bticket\s+[a-z][a-z0-9]*-\d+\b/i],
  },
  {
    category: 'instruction-internal',
    patterns: [/\bprompt\s+[a-z0-9._-]+\b/i],
  },
  {
    category: 'operational-policy',
    patterns: [
      /\bthreshold\s+\d+(?:\.\d+)?\b/i,
      /\bretry\s+budget\s+\d+\b/i,
    ],
  },
  {
    category: 'security-finding',
    patterns: [/\bvulnerability\s+CVE-\d{4}-\d{4,}\b/i],
  },
  {
    category: 'exact-model',
    patterns: [
      /\b(?:openai|anthropic|google|meta|mistral|alibaba|deepseek|cohere)\s+[a-z0-9][a-z0-9._-]*\b/i,
      /\b(?:qwen|llama|mistral|gemma|claude|gpt-\d|awq|gguf|nvfp\d*|fp\d+|int\d+)\b/i,
    ],
  },
  {
    category: 'exact-hardware',
    patterns: [
      /\b(?:\d+\s*(?:GB|GiB)\s*VRAM|VRAM|RTX|CUDA|GPU UUID)\b/i,
      /\b(?:nvidia|amd|intel|apple)\s+[a-z0-9][a-z0-9._-]*\b/i,
    ],
  },
];

const allowedNumericPathPattern =
  /^(?:\$\.version|\$\.nodes\[\d+\]\.position\.(?:x|y))$/;

function childPath(path: string, key: string | number): string {
  return typeof key === 'number' ? `${path}[${key}]` : `${path}.${key}`;
}

function findSensitiveValueCategory(value: string): string | null {
  for (const detector of sensitiveValueDetectors) {
    if (detector.patterns.some((pattern) => pattern.test(value))) {
      return detector.category;
    }
  }
  return null;
}

function scanForSensitiveContent(value: unknown, path = '$'): void {
  if (typeof value === 'string') {
    const category = findSensitiveValueCategory(value);
    if (category) {
      throw new Error(`Unsafe architecture value at ${path} (${category})`);
    }
    return;
  }

  if (typeof value === 'number') {
    if (!allowedNumericPathPattern.test(path)) {
      throw new Error(
        `Unsafe architecture numeric value at ${path} (numeric-outside-contract)`,
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForSensitiveContent(item, childPath(path, index)));
    return;
  }

  if (value === null || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    const nextPath = childPath(path, key);
    if (nextPath !== '$.version' && forbiddenKeyPattern.test(key)) {
      throw new Error(`Unsafe architecture field at ${nextPath} (forbidden-field)`);
    }
    scanForSensitiveContent(child, nextPath);
  }
}

function formatZodPath(path: PropertyKey[]): string {
  return path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') return `${result}[${segment}]`;
    return `${result}.${String(segment)}`;
  }, '$');
}

function assertUniqueIds(
  values: ReadonlyArray<{ id: string }>,
  collectionPath: string,
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value.id)) {
      throw new Error(`Duplicate ID at ${collectionPath}: ${value.id}`);
    }
    seen.add(value.id);
  }
}

function assertUniqueReferences(values: readonly string[], collectionPath: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate reference at ${collectionPath}: ${value}`);
    }
    seen.add(value);
  }
}

function assertGraphIntegrity(dataset: PublicArchitectureDataset): void {
  assertUniqueIds(dataset.nodes, '$.nodes');
  assertUniqueIds(dataset.edges, '$.edges');
  assertUniqueIds(dataset.flows, '$.flows');
  assertUniqueIds(dataset.lenses, '$.lenses');

  const nodeIds = new Set(dataset.nodes.map((node) => node.id));
  const edgesById = new Map(dataset.edges.map((edge) => [edge.id, edge]));
  const flowIds = new Set(dataset.flows.map((flow) => flow.id));

  for (const edge of dataset.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Invalid endpoint for edge ${edge.id}`);
    }
  }

  for (const flow of dataset.flows) {
    assertUniqueIds(flow.stages, `$.flows.${flow.id}.stages`);

    for (const stepId of flow.steps) {
      if (!nodeIds.has(stepId)) {
        throw new Error(`Unknown node in flow ${flow.id}: ${stepId}`);
      }
    }

    if (flow.edgeIds.length !== flow.steps.length - 1) {
      throw new Error(`Route length mismatch for flow ${flow.id}`);
    }

    flow.edgeIds.forEach((edgeId, index) => {
      const edge = edgesById.get(edgeId);
      const source = flow.steps[index];
      const target = flow.steps[index + 1];
      if (!edge || edge.source !== source || edge.target !== target) {
        throw new Error(`Invalid route edge in flow ${flow.id}: ${edgeId}`);
      }
    });

    const flowNodeIds = new Set(flow.steps);
    for (const stage of flow.stages) {
      for (const stageNodeId of stage.nodeIds) {
        if (!flowNodeIds.has(stageNodeId)) {
          throw new Error(`Unknown stage node in flow ${flow.id}: ${stageNodeId}`);
        }
      }
    }
  }

  const primaryFlows = dataset.flows.filter((flow) => flow.primary === true);
  if (primaryFlows.length !== 1) {
    throw new Error('Expected exactly one primary flow at $.flows');
  }

  const lensIds = dataset.lenses.map((lens) => lens.id);
  if (lensIds.some((id, index) => id !== architectureLensIds[index])) {
    throw new Error('Expected the canonical lens order at $.lenses');
  }

  for (const lens of dataset.lenses) {
    assertUniqueIds(lens.sections, `$.lenses.${lens.id}.sections`);
    assertUniqueReferences(lens.nodeIds, `$.lenses.${lens.id}.nodeIds`);
    assertUniqueReferences(lens.edgeIds, `$.lenses.${lens.id}.edgeIds`);
    assertUniqueReferences(lens.flowIds, `$.lenses.${lens.id}.flowIds`);

    for (const nodeId of lens.nodeIds) {
      if (!nodeIds.has(nodeId)) {
        throw new Error(`Unknown node in lens ${lens.id}: ${nodeId}`);
      }
    }

    for (const edgeId of lens.edgeIds) {
      const edge = edgesById.get(edgeId);
      if (!edge) {
        throw new Error(`Unknown edge in lens ${lens.id}: ${edgeId}`);
      }
      const lensNodeIds = new Set(lens.nodeIds);
      if (!lensNodeIds.has(edge.source) || !lensNodeIds.has(edge.target)) {
        throw new Error(`Invalid lens edge endpoint in lens ${lens.id}: ${edgeId}`);
      }
    }

    for (const flowId of lens.flowIds) {
      if (!flowIds.has(flowId)) {
        throw new Error(`Unknown flow in lens ${lens.id}: ${flowId}`);
      }
    }
  }
}

export function validatePublicArchitecture(input: unknown): PublicArchitectureDataset {
  scanForSensitiveContent(input);

  const result = datasetSchema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`Invalid architecture at ${formatZodPath(issue.path)}: ${issue.code}`);
  }

  assertGraphIntegrity(result.data);
  return result.data;
}
