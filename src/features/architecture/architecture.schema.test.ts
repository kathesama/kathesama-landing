import { describe, expect, it } from 'vitest';
import { publicArchitecture } from '../../content/architecture';
import { validatePublicArchitecture } from './architecture.schema';

const bilingual = (text: string) => ({ en: text, es: text });

const lensIds = [
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

function createValidDataset(): unknown {
  return {
    version: 1,
    nodes: [
      {
        id: 'source',
        label: bilingual('Source'),
        description: bilingual('Starts the exchange'),
        capability: bilingual('Provides intent'),
        category: 'experience',
        evidence: 'verified',
        position: { x: 0, y: 0 },
      },
      {
        id: 'processor',
        label: bilingual('Processor'),
        description: bilingual('Coordinates the exchange'),
        capability: bilingual('Plans bounded work'),
        category: 'orchestration',
        evidence: 'implemented-in-code',
        position: { x: 100, y: 0 },
      },
      {
        id: 'result',
        label: bilingual('Result'),
        description: bilingual('Returns the exchange'),
        capability: bilingual('Provides an answer'),
        category: 'intelligence',
        evidence: 'conditional',
        position: { x: 200, y: 0 },
      },
    ],
    edges: [
      {
        id: 'source-processor',
        source: 'source',
        target: 'processor',
        label: bilingual('request'),
        type: 'sync',
      },
      {
        id: 'processor-result',
        source: 'processor',
        target: 'result',
        label: bilingual('answer'),
        type: 'stream',
      },
      {
        id: 'result-processor',
        source: 'result',
        target: 'processor',
        label: bilingual('return'),
        type: 'data',
      },
    ],
    flows: [
      {
        id: 'complete-flow',
        title: bilingual('Complete flow'),
        summary: bilingual('Shows the complete exchange'),
        outcome: bilingual('Produces a bounded answer'),
        evidence: 'verified',
        primary: true,
        steps: ['source', 'processor', 'result'],
        edgeIds: ['source-processor', 'processor-result'],
        stages: [
          { id: 'start', label: bilingual('Start'), nodeIds: ['source'] },
          { id: 'coordinate', label: bilingual('Coordinate'), nodeIds: ['processor'] },
          { id: 'finish', label: bilingual('Finish'), nodeIds: ['result'] },
        ],
      },
    ],
    lenses: lensIds.map((id) => ({
      id,
      title: bilingual(`${id} title`),
      summary: bilingual(`${id} summary`),
      nodeIds: ['source', 'processor', 'result'],
      edgeIds: ['source-processor', 'processor-result'],
      flowIds: ['complete-flow'],
      sections: [
        {
          id: 'overview',
          title: bilingual('Overview'),
          body: bilingual('Explains this public view'),
        },
      ],
    })),
  };
}

function clonedDataset(): Record<string, unknown> {
  return structuredClone(createValidDataset()) as Record<string, unknown>;
}

function expectInvalid(input: unknown, pathOrId?: string) {
  expect(() => validatePublicArchitecture(input)).toThrow();
  if (pathOrId) {
    expect(() => validatePublicArchitecture(input)).toThrow(pathOrId);
  }
}

describe('validatePublicArchitecture', () => {
  it('accepts a complete bilingual graph', () => {
    expect(validatePublicArchitecture(createValidDataset())).toEqual(createValidDataset());
  });

  it.each(['nodes', 'edges', 'flows'] as const)('rejects duplicate IDs in %s', (collection) => {
    const dataset = clonedDataset();
    const items = dataset[collection] as Array<Record<string, unknown>>;
    items.push(structuredClone(items[0]));

    expectInvalid(dataset, collection);
  });

  it('rejects an edge whose source or target is missing', () => {
    const dataset = clonedDataset();
    (dataset.edges as Array<Record<string, unknown>>)[0].target = 'missing-node';

    expectInvalid(dataset, 'source-processor');
  });

  it('rejects an edge ID that does not join its two consecutive flow steps', () => {
    const dataset = clonedDataset();
    const flow = (dataset.flows as Array<Record<string, unknown>>)[0];
    flow.edgeIds = ['processor-result', 'result-processor'];

    expectInvalid(dataset, 'complete-flow');
  });

  it('accepts a flow that revisits a node when edgeIds disambiguate the route', () => {
    const dataset = clonedDataset();
    const flow = (dataset.flows as Array<Record<string, unknown>>)[0];
    flow.steps = ['source', 'processor', 'result', 'processor'];
    flow.edgeIds = ['source-processor', 'processor-result', 'result-processor'];

    expect(validatePublicArchitecture(dataset).flows[0].steps).toEqual([
      'source',
      'processor',
      'result',
      'processor',
    ]);
  });

  it('requires edgeIds.length to equal steps.length - 1', () => {
    const dataset = clonedDataset();
    (dataset.flows as Array<Record<string, unknown>>)[0].edgeIds = ['source-processor'];

    expectInvalid(dataset, 'complete-flow');
  });

  it('requires three to five stages and keeps stage nodes inside the flow', () => {
    const tooFew = clonedDataset();
    (tooFew.flows as Array<Record<string, unknown>>)[0].stages = [
      { id: 'only-stage', label: bilingual('Only stage'), nodeIds: ['source'] },
    ];
    expectInvalid(tooFew, '$.flows[0].stages');

    const outside = clonedDataset();
    const stages = (outside.flows as Array<Record<string, unknown>>)[0].stages as Array<
      Record<string, unknown>
    >;
    stages[0].nodeIds = ['not-in-flow'];
    expectInvalid(outside, 'not-in-flow');
  });

  it('requires non-empty English and Spanish text in every localized field', () => {
    const dataset = clonedDataset();
    const label = (dataset.nodes as Array<Record<string, unknown>>)[0].label as Record<
      string,
      unknown
    >;
    label.es = '   ';

    expectInvalid(dataset, '$.nodes[0].label.es');
  });

  it('rejects surrounding whitespace instead of transforming localized text', () => {
    const dataset = clonedDataset();
    const description = (dataset.nodes as Array<Record<string, unknown>>)[0]
      .description as Record<string, unknown>;
    description.en = ' Starts the exchange ';

    expectInvalid(dataset, '$.nodes[0].description.en');
  });

  it('scans numeric values without rejecting valid positions or echoing rejected numbers', () => {
    const valid = clonedDataset();
    const position = (valid.nodes as Array<Record<string, unknown>>)[0].position as Record<
      string,
      unknown
    >;
    position.x = -125.5;
    position.y = 2048;

    expect(validatePublicArchitecture(valid).nodes[0].position).toEqual({
      x: -125.5,
      y: 2048,
    });

    const unsafe = clonedDataset();
    (unsafe.nodes as Array<Record<string, unknown>>)[0].latencyMs = 987654;
    const validate = () => validatePublicArchitecture(unsafe);

    expect(validate).toThrow(
      'Unsafe architecture numeric value at $.nodes[0].latencyMs',
    );
    expect(validate).not.toThrow('987654');
  });

  it('rejects unknown categories, evidence states, edge types, and extra fields', () => {
    const invalidCases = [
      ['nodes', 0, 'category', 'unknown-family'],
      ['nodes', 0, 'evidence', 'runtime-live'],
      ['edges', 0, 'type', 'rpc'],
    ] as const;

    for (const [collection, index, key, value] of invalidCases) {
      const dataset = clonedDataset();
      (dataset[collection] as Array<Record<string, unknown>>)[index][key] = value;
      expectInvalid(dataset);
    }

    const extra = clonedDataset();
    (extra.nodes as Array<Record<string, unknown>>)[0].unexpected = true;
    expectInvalid(extra, '$.nodes[0]');
  });

  it('requires exactly one primary flow', () => {
    const none = clonedDataset();
    delete (none.flows as Array<Record<string, unknown>>)[0].primary;
    expectInvalid(none, '$.flows');

    const two = clonedDataset();
    const flows = two.flows as Array<Record<string, unknown>>;
    flows.push({ ...structuredClone(flows[0]), id: 'second-flow' });
    expectInvalid(two, '$.flows');
  });

  it('requires every public lens exactly once and in the canonical order', () => {
    const missing = clonedDataset();
    (missing.lenses as Array<Record<string, unknown>>).pop();
    expectInvalid(missing, '$.lenses');

    const duplicate = clonedDataset();
    const lenses = duplicate.lenses as Array<Record<string, unknown>>;
    lenses[1].id = lenses[0].id;
    expectInvalid(duplicate, '$.lenses');

    const reordered = clonedDataset();
    const reorderedLenses = reordered.lenses as Array<Record<string, unknown>>;
    [reorderedLenses[0], reorderedLenses[1]] = [reorderedLenses[1], reorderedLenses[0]];
    expectInvalid(reordered, '$.lenses');
  });

  it('rejects duplicate section IDs and duplicate lens references', () => {
    const duplicateSection = clonedDataset();
    const sectionLens = (duplicateSection.lenses as Array<Record<string, unknown>>)[0];
    const sections = sectionLens.sections as Array<Record<string, unknown>>;
    sections.push(structuredClone(sections[0]));
    expectInvalid(duplicateSection, '$.lenses.layers.sections');

    for (const field of ['nodeIds', 'edgeIds', 'flowIds'] as const) {
      const duplicateReference = clonedDataset();
      const lens = (duplicateReference.lenses as Array<Record<string, unknown>>)[0];
      const references = lens[field] as string[];
      references.push(references[0]);
      expectInvalid(duplicateReference, `$.lenses.layers.${field}`);
    }
  });

  it('rejects empty lens localization and unknown graph references', () => {
    const emptyLocalization = clonedDataset();
    const lens = (emptyLocalization.lenses as Array<Record<string, unknown>>)[0];
    (lens.summary as Record<string, unknown>).es = '   ';
    expectInvalid(emptyLocalization, '$.lenses[0].summary.es');

    for (const [field, value] of [
      ['nodeIds', 'missing-node'],
      ['edgeIds', 'missing-edge'],
      ['flowIds', 'missing-flow'],
    ] as const) {
      const unknownReference = clonedDataset();
      const referencedLens = (unknownReference.lenses as Array<Record<string, unknown>>)[0];
      referencedLens[field] = [value];
      expectInvalid(unknownReference, value);
    }
  });

  it('requires every lens edge endpoint to be present in that lens node set', () => {
    const dataset = clonedDataset();
    const lens = (dataset.lenses as Array<Record<string, unknown>>)[0];
    lens.nodeIds = ['source', 'result'];

    expectInvalid(dataset, 'source-processor');
  });

  it.each(['sourceRefs', 'endpoint', 'host', 'version', 'config'])(
    'rejects extra or sensitive lens field %s',
    (field) => {
      const dataset = clonedDataset();
      (dataset.lenses as Array<Record<string, unknown>>)[0][field] = 'private-detail';

      expectInvalid(dataset, `$.lenses[0].${field}`);
    },
  );

  it.each([
    ['host', 'private-machine'],
    ['port', 1234],
    ['clientId', 'private-client'],
    ['secretPath', '/private/secret'],
    ['model', 'exact-model'],
  ])('rejects forbidden field %s before schema stripping', (field, value) => {
    const dataset = clonedDataset();
    (dataset.nodes as Array<Record<string, unknown>>)[0][field] = value;

    expectInvalid(dataset, `$.nodes[0].${field}`);
  });

  it.each([
    ['http://private.example', 'network-coordinate'],
    ['127.0.0.1:9999', 'network-coordinate'],
    ['Runs on port 8443', 'network-coordinate'],
    ['Host is prod-db.internal', 'network-coordinate'],
    ['C:\\private\\file', 'filesystem-path'],
    ['\\\\private\\share\\public.txt', 'filesystem-path'],
    ['/private', 'filesystem-path'],
    ['/srv/private/file', 'filesystem-path'],
    ['Bearer private-token', 'access-marker'],
    ['Uses X-User-Context', 'access-marker'],
    ['Client ID private-client', 'identity-internal'],
    ['Realm private-realm', 'identity-internal'],
    ['Container gateway-service', 'deployment-topology'],
    ['Tunnel private-edge', 'deployment-topology'],
    ['Header X-Caller-Service', 'access-marker'],
    ['Credential service-account', 'access-marker'],
    ['Token abc123', 'access-marker'],
    ['Broker topic conversation.turn.completed', 'messaging-internal'],
    ['Table memory_embeddings', 'storage-internal'],
    ['Ticket JAP-123', 'tracker-reference'],
    ['Prompt system-instructions', 'instruction-internal'],
    ['Threshold 0.85', 'operational-policy'],
    ['Retry budget 5', 'operational-policy'],
    ['Deployment prod-42', 'deployment-topology'],
    ['Environment production', 'deployment-topology'],
    ['Vulnerability CVE-2026-1234', 'security-finding'],
    ['Model OpenAI o3', 'exact-model'],
    ['Model Anthropic Sonnet', 'exact-model'],
    ['48 GB VRAM', 'exact-hardware'],
    ['RTX device', 'exact-hardware'],
    ['Hardware NVIDIA A100', 'exact-hardware'],
    ['Hardware Intel Xeon', 'exact-hardware'],
    ['api.internal.example', 'network-coordinate'],
    ['Spring Boot 3.4.1', 'exact-version'],
    ['Bucket juana-public-assets', 'storage-internal'],
    ['Database juana_memory', 'storage-internal'],
    ['Keycloak realm internal-realm', 'identity-internal'],
    ['Keycloak client scope privileged-tools', 'identity-internal'],
    ['Keycloak role platform-admin', 'identity-internal'],
    ['Keycloak scope config restricted-access', 'identity-internal'],
    ['Authorization', 'access-marker'],
    ['X-Internal-Trace', 'access-marker'],
    ['Cookie', 'access-marker'],
    ['Set-Cookie', 'access-marker'],
    ['Requests carry X-Internal-Trace for correlation', 'access-marker'],
    ['Uses Authorization for access', 'access-marker'],
    ['Uses Cookie for session continuity', 'access-marker'],
    ['Returns Set-Cookie after trust checks', 'access-marker'],
    ['Runs through gateway-prod', 'network-coordinate'],
  ])('rejects obvious sensitive value %s as %s', (value, category) => {
    const dataset = clonedDataset();
    const description = (dataset.nodes as Array<Record<string, unknown>>)[0]
      .description as Record<string, unknown>;
    description.en = value;

    expectInvalid(dataset, '$.nodes[0].description.en');
    expect(() => validatePublicArchitecture(dataset)).toThrow(category);
    expect(() => validatePublicArchitecture(dataset)).not.toThrow(value);
  });

  it.each([
    'Input/output remains bounded',
    'Use and/or wording for the public explanation',
    'The guide covers 3/5 stages',
    'Response at 12:30',
    'Read section 2:30',
    'The system model explains behavior',
    'Hardware support remains abstract',
    'relational database',
    'HTTP',
    'Spring Boot',
    'least privilege',
    'Requests pass through the gateway boundary',
    'Access decisions remain conceptual',
  ])('accepts benign editorial copy: %s', (value) => {
    const dataset = clonedDataset();
    const description = (dataset.nodes as Array<Record<string, unknown>>)[0]
      .description as Record<string, unknown>;
    description.en = value;

    expect(validatePublicArchitecture(dataset).nodes[0].description.en).toBe(value);
  });
});

describe('public architecture dataset', () => {
  it('publishes the curated public-safe graph contract', () => {
    const dataset = validatePublicArchitecture(publicArchitecture);

    expect(dataset.nodes).toHaveLength(18);
    expect(dataset.edges).toHaveLength(43);
    expect(dataset.flows).toHaveLength(8);
    expect(dataset.lenses.map((lens) => lens.id)).toEqual(lensIds);
    expect(dataset.flows.filter((flow) => flow.primary).map((flow) => flow.id)).toEqual([
      'real-time-chat',
    ]);
    expect(
      dataset.edges
        .filter((edge) => edge.type === 'telemetry')
        .every((edge) => edge.target === 'observability'),
    ).toBe(true);
    expect(dataset.nodes.some((node) => node.evidence === 'next')).toBe(false);
    expect(dataset.flows.some((flow) => flow.evidence === 'next')).toBe(false);
  });

  it('covers the required public architecture concepts in both languages', () => {
    const dataset = validatePublicArchitecture(publicArchitecture);
    const lensText = (id: (typeof lensIds)[number], language: 'en' | 'es') => {
      const lens = dataset.lenses.find((candidate) => candidate.id === id);
      expect(lens).toBeDefined();
      return [
        lens?.title[language],
        lens?.summary[language],
        ...lens!.sections.flatMap((section) => [
          section.title[language],
          section.body[language],
        ]),
      ].join(' ');
    };

    const expectations = [
      ['knowledge-flows', 'en', [/document/i, /ingest/i, /retriev|recall/i, /memor/i, /capabilit|tool/i, /rank/i]],
      ['knowledge-flows', 'es', [/document/i, /ingest/i, /recuper/i, /memori/i, /capacidad|herramient/i, /reorden/i]],
      ['trust', 'en', [/least privilege/i]],
      ['trust', 'es', [/mínimo privilegio/i]],
      ['reliability', 'en', [/timeout/i, /retry/i, /fallback/i, /audit/i, /observab/i]],
      ['reliability', 'es', [/tiempo de espera/i, /reintento/i, /alternativ|degradación/i, /auditor/i, /observab/i]],
      ['decisions', 'en', [/rationale/i, /trade-off/i]],
      ['decisions', 'es', [/razón|justificación/i, /compensacion/i]],
      ['capability-status', 'en', [/future|next/i, /not implemented|not a production claim/i]],
      ['capability-status', 'es', [/futuro|próximo/i, /no implementado|no es una afirmación de producción/i]],
    ] as const;

    for (const [id, language, patterns] of expectations) {
      const copy = lensText(id, language);
      for (const pattern of patterns) expect(copy).toMatch(pattern);
    }
  });
});
