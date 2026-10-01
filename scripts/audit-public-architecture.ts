import { readFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validatePublicArchitecture } from '../src/features/architecture/architecture.schema';

export type PublicArchitectureAuditFinding = {
  location: string;
  ruleId: string;
};

type AuditRule = {
  id: string;
  matches: (value: string) => boolean;
};

function containsIpv6(value: string): boolean {
  return value
    .split(/[\s()[\]{},;<>"']+/)
    .map((candidate) => candidate.replace(/^[.,]+|[.,]+$/g, ''))
    .some((candidate) => candidate.includes(':') && isIP(candidate) === 6);
}

function containsLabeledIdentifier(value: string, labelPattern: string): boolean {
  const explicitlyNamed = new RegExp(
    `\\b${labelPattern}\\s+(?:(?:is\\s+)?(?:named|called)\\s+)[a-z0-9][a-z0-9._-]*\\b`,
    'i',
  );
  const structuredIdentifier = new RegExp(
    `\\b${labelPattern}\\s+(?:is\\s+)?[a-z0-9]+(?:[._-][a-z0-9]+)+\\b`,
    'i',
  );
  const terminalIdentifier = new RegExp(
    `\\b${labelPattern}\\s+[a-z0-9][a-z0-9_-]*(?=$|[.,;:!?])`,
    'iu',
  );
  return (
    explicitlyNamed.test(value) ||
    structuredIdentifier.test(value) ||
    terminalIdentifier.test(value)
  );
}

const auditRules: readonly AuditRule[] = [
  {
    id: 'network.ipv4',
    matches: (value) => /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(value),
  },
  { id: 'network.ipv6', matches: containsIpv6 },
  {
    id: 'network.localhost',
    matches: (value) => /\blocalhost\b/i.test(value),
  },
  {
    id: 'network.explicit-port',
    matches: (value) => {
      if (/\bport\s*(?:(?:is|equals?)\s*|[:=]\s*)?\d{1,5}\b/i.test(value)) {
        return true;
      }
      if (containsIpv6(value)) return false;
      return /\b(?:localhost|(?=[a-z0-9.-]*[a-z])[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|(?:\d{1,3}\.){3}\d{1,3}):\d{2,5}\b/i.test(value);
    },
  },
  {
    id: 'contract.exact-api-route',
    matches: (value) =>
      /(?:^|[\s"'`])(\/(?:api|v\d+|graphql|auth|admin|internal)(?:\/[a-z0-9._~!$&'()*+,;=:@{}-]+)+)/i.test(
        value,
      ),
  },
  {
    id: 'path.filesystem',
    matches: (value) =>
      /\b[a-z]:[\\/][^\s]+/i.test(value) ||
      /\\\\[^\\/\s]+\\[^\s]+/.test(value) ||
      /(?:^|\s)\/(?:home|users?|srv|opt|var|etc|mnt|workspace|projects?)\/[\w./-]+/i.test(
        value,
      ),
  },
  {
    id: 'path.repository',
    matches: (value) =>
      /(?:^|[\s"'`])(?:src|app|apps|services|packages|infrastructure|scripts|config|docs|docker-compose)[\\/][\w./\\-]+/i.test(
        value,
      ),
  },
  {
    id: 'source.java-file',
    matches: (value) => /\b[a-z_$][a-z0-9_$.-]*\.java\b/i.test(value),
  },
  {
    id: 'source.python-file',
    matches: (value) => /\b[a-z_][a-z0-9_.-]*\.py\b/i.test(value),
  },
  {
    id: 'source.typescript-file',
    matches: (value) => /\b[a-z_$][a-z0-9_$.-]*\.tsx?\b/i.test(value),
  },
  {
    id: 'runtime.container-identifier',
    matches: (value) => containsLabeledIdentifier(value, 'container'),
  },
  {
    id: 'storage.database-identifier',
    matches: (value) =>
      containsLabeledIdentifier(value, '(?:database|base\\s+de\\s+datos)'),
  },
  {
    id: 'storage.table-identifier',
    matches: (value) => containsLabeledIdentifier(value, 'table'),
  },
  {
    id: 'messaging.topic-identifier',
    matches: (value) =>
      containsLabeledIdentifier(value, '(?:topic|t[oó]pico)') ||
      /\b(?:publish(?:es)?\s+to\s+|consume(?:s)?\s+from\s+)[a-z0-9_-]+(?:\.[a-z0-9_-]+)+\b/i.test(
        value,
      ),
  },
  {
    id: 'storage.bucket-identifier',
    matches: (value) =>
      containsLabeledIdentifier(value, '(?:bucket|dep[oó]sito)'),
  },
  {
    id: 'identity.realm-identifier',
    matches: (value) => containsLabeledIdentifier(value, 'realm'),
  },
  {
    id: 'identity.client-identifier',
    matches: (value) =>
      containsLabeledIdentifier(value, '(?:client(?:\\s+id)?|cliente)'),
  },
  {
    id: 'identity.claim-identifier',
    matches: (value) =>
      containsLabeledIdentifier(value, '(?:claim|atributo)'),
  },
  {
    id: 'identity.scope-identifier',
    matches: (value) =>
      containsLabeledIdentifier(value, '(?:scope|alcance)'),
  },
  {
    id: 'identity.header-identifier',
    matches: (value) =>
      /\b(?:x-[a-z0-9]+(?:-[a-z0-9]+)*|set-cookie|authorization\s+header|header\s+authorization)\b/i.test(
        value,
      ),
  },
  {
    id: 'secret.path',
    matches: (value) =>
      /\b(?:secret|secrets|vault|credentials?)\/[a-z0-9._~/-]+\b/i.test(value),
  },
  {
    id: 'model.identifier',
    matches: (value) =>
      /\b(?:qwen|llama|mistral|gemma|deepseek|claude|gpt)[a-z0-9._-]*\d[a-z0-9._-]*\b/i.test(
        value,
      ),
  },
  {
    id: 'technology.exact-version',
    matches: (value) =>
      /\bv?\d+\.\d+\.\d+(?:[-+][0-9a-z.-]+)?\b/i.test(value) ||
      /\bv\d+\.\d+(?:[-+][0-9a-z.-]+)?\b/i.test(value) ||
      /\b(?:react|java|python|fastapi|spring(?:\s+boot)?|node(?:\.js)?|typescript|postgres(?:ql)?|kafka)\s+v?\d+\.\d+\b/i.test(
        value,
      ),
  },
  {
    id: 'runtime.hardware',
    matches: (value) =>
      /\b(?:RTX\s*\d+|CUDA(?:\s*\d+(?:\.\d+)*)?|\d+\s*(?:GB|GiB)\s+VRAM|GPU\s+UUID)\b/i.test(
        value,
      ),
  },
  {
    id: 'security.finding',
    matches: (value) =>
      /\b(?:CVE-\d{4}-\d{4,}|(?:critical|high|medium|low)\s+vulnerability|authentication\s+bypass|SQL\s+injection|remote\s+code\s+execution|privilege\s+escalation|security\s+finding)\b/i.test(
        value,
      ),
  },
];

const publicFieldNames = new Set([
  'version',
  'nodes',
  'edges',
  'flows',
  'lenses',
  'id',
  'label',
  'description',
  'capability',
  'category',
  'evidence',
  'position',
  'x',
  'y',
  'source',
  'target',
  'type',
  'title',
  'summary',
  'outcome',
  'steps',
  'edgeIds',
  'stages',
  'primary',
  'nodeIds',
  'sections',
  'body',
  'flowIds',
  'en',
  'es',
]);

function childLocation(location: string, key: string | number): string {
  if (typeof key === 'number') return `${location}[${key}]`;
  return publicFieldNames.has(key) ? `${location}.${key}` : `${location}.<field>`;
}

export function auditPublicArchitecture(input: unknown): PublicArchitectureAuditFinding[] {
  const findings: PublicArchitectureAuditFinding[] = [];

  function visit(value: unknown, location: string): void {
    if (typeof value === 'string') {
      for (const rule of auditRules) {
        if (rule.matches(value)) findings.push({ location, ruleId: rule.id });
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, childLocation(location, index)));
      return;
    }

    if (value === null || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      visit(child, childLocation(location, key));
    }
  }

  visit(input, '$');
  return findings;
}

export class PublicArchitectureDisclosureError extends Error {
  constructor(findings: readonly PublicArchitectureAuditFinding[]) {
    super(
      [
        'Public architecture disclosure audit failed:',
        ...findings.map(({ location, ruleId }) => `- ${location} (${ruleId})`),
      ].join('\n'),
    );
    this.name = 'PublicArchitectureDisclosureError';
  }
}

export function assertPublicArchitectureDisclosureSafe(input: unknown): void {
  const findings = auditPublicArchitecture(input);
  if (findings.length > 0) throw new PublicArchitectureDisclosureError(findings);
}

export async function runPublicArchitectureAudit(
  inputPath = resolve(import.meta.dirname, '../src/content/architecture/architecture.public.json'),
): Promise<void> {
  const source = await readFile(inputPath, 'utf8');
  const architecture = validatePublicArchitecture(JSON.parse(source));
  assertPublicArchitectureDisclosureSafe(architecture);
  console.log('architecture audit: 0 disclosure findings');
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  runPublicArchitectureAudit().catch((error: unknown) => {
    if (error instanceof PublicArchitectureDisclosureError) {
      console.error(error.message);
    } else {
      console.error('Public architecture validation failed before disclosure audit');
    }
    process.exitCode = 1;
  });
}
