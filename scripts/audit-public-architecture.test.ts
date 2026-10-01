import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertPublicArchitectureDisclosureSafe,
  auditPublicArchitecture,
} from './audit-public-architecture';
import { preparePublicArchitecture } from './prepare-public-architecture';

describe('auditPublicArchitecture', () => {
  it.each([
    ['network.ipv4', 'The service listens on 192.168.10.42'],
    ['network.ipv6', 'The service listens on 2001:db8:85a3::8a2e:370:7334'],
    ['network.ipv6', 'The loopback is ::1'],
    ['network.ipv6', 'The network prefix is 2001:db8::'],
    ['network.ipv6', 'The loopback is [::1]'],
    ['network.localhost', 'Open localhost for the live service'],
    ['network.explicit-port', 'The gateway uses port 8080'],
    ['network.explicit-port', 'The gateway resolves at service.internal:8443'],
    ['path.filesystem', String.raw`Runtime data lives at D:\projects\ia\JuanaIA`],
    ['path.repository', 'Implementation lives in src/services/gateway'],
    ['source.java-file', 'See GatewayRoutesConfig.java'],
    ['source.python-file', 'See retrieval_worker.py'],
    ['source.typescript-file', 'See ArchitectureExplorer.tsx'],
    ['contract.exact-api-route', 'Requests enter through /api/v1/chat/completions'],
    ['runtime.container-identifier', 'The container is juana-gateway'],
    ['runtime.container-identifier', 'The container is named gateway'],
    ['storage.database-identifier', 'The database is juana_prod'],
    ['storage.database-identifier', 'The database is named juana'],
    ['storage.database-identifier', 'database prod'],
    ['storage.database-identifier', 'base de datos produccion'],
    ['storage.table-identifier', 'The table is user_credentials'],
    ['storage.table-identifier', 'The table is named users'],
    ['messaging.topic-identifier', 'Events publish to memory.events.created'],
    ['messaging.topic-identifier', 'topic updates'],
    ['messaging.topic-identifier', 'tópico actualizaciones'],
    ['storage.bucket-identifier', 'Documents use bucket docs-prod'],
    ['storage.bucket-identifier', 'The bucket is named documents'],
    ['storage.bucket-identifier', 'bucket documents'],
    ['storage.bucket-identifier', 'depósito documentos'],
    ['identity.realm-identifier', 'Authentication uses realm juana-internal'],
    ['identity.realm-identifier', 'The realm is named master'],
    ['identity.client-identifier', 'The client is juana-ui'],
    ['identity.client-identifier', 'The client is named frontend'],
    ['identity.client-identifier', 'client frontend'],
    ['identity.client-identifier', 'cliente interfaz'],
    ['identity.claim-identifier', 'Authorization reads claim tenant_id'],
    ['identity.claim-identifier', 'Authorization reads claim named sub'],
    ['identity.claim-identifier', 'claim sub'],
    ['identity.claim-identifier', 'atributo sujeto'],
    ['identity.scope-identifier', 'The required scope is api.read'],
    ['identity.scope-identifier', 'The scope is named profile'],
    ['identity.scope-identifier', 'scope admin'],
    ['identity.scope-identifier', 'alcance administrador'],
    ['identity.header-identifier', 'Identity arrives in X-User-Context'],
    ['identity.header-identifier', 'Identity arrives in X-Trace'],
    ['secret.path', 'Credentials live at secret/data/juana'],
    ['model.identifier', 'Inference uses Qwen3.5-27B'],
    ['technology.exact-version', 'The service runs Spring Boot 3.2.1'],
    ['technology.exact-version', 'The service runs Spring Boot 3.2'],
    ['technology.exact-version', 'The runtime is Python 3.12'],
    ['technology.exact-version', 'The protocol revision is v2.4'],
    ['runtime.hardware', 'Inference runs on an RTX 5090 with 32 GB VRAM'],
    ['security.finding', 'Known critical vulnerability permits authentication bypass'],
  ] as const)('reports %s without exposing the matched value', (ruleId, unsafeValue) => {
    const findings = auditPublicArchitecture({
      lenses: [{ summary: { en: unsafeValue, es: 'Texto conceptual' } }],
    });

    expect(findings).toContainEqual({
      location: '$.lenses[0].summary.en',
      ruleId,
    });
    expect(JSON.stringify(findings)).not.toContain(unsafeValue);
  });

  it('accepts conceptual public architecture prose', () => {
    const architecture = {
      version: 1,
      summary: {
        en: 'Identity checks establish trust before a conceptual HTTP request continues.',
        es: 'La observabilidad ayuda a ubicar errores sin exponer contenido.',
      },
      details: [
        'React supports the web experience while Java with Spring and Python with FastAPI support complementary services.',
        'Event streaming and relational or vector storage are described only as technology families.',
        'Timeout, retry, fallback, and audit boundaries describe resilience conceptually.',
        'Authentication and authorization boundaries remain conceptual.',
        'A relational database supports durable state without naming one.',
        'The database is relational.',
        'The client is authenticated.',
        'The topic is conceptual.',
        'The scope of this explanation stays conceptual.',
        'The score is 3.2 on a five-point scale.',
        'Edition 2.4 explains the public architecture.',
        'A meeting runs from 12:30 to 13:00.',
        'Section 2:30 and the 16:9 ratio are editorial references.',
        'Una base de datos relacional sostiene el estado conceptual.',
        'El alcance de esta explicación permanece conceptual.',
      ],
    };

    expect(auditPublicArchitecture(architecture)).toEqual([]);
    expect(() => assertPublicArchitectureDisclosureSafe(architecture)).not.toThrow();
  });

  it('throws only sanitized locations and rule IDs', () => {
    const secretValue = 'The private header is X-Super-Secret-Internal';

    expect(() =>
      assertPublicArchitectureDisclosureSafe({ description: secretValue }),
    ).toThrow('$.description (identity.header-identifier)');

    try {
      assertPublicArchitectureDisclosureSafe({ description: secretValue });
    } catch (error) {
      expect(String(error)).not.toContain(secretValue);
      expect(String(error)).not.toContain('X-Super-Secret-Internal');
    }
  });
});

describe('preparePublicArchitecture', () => {
  it('fails the disclosure audit before replacing the published artifact', async () => {
    const testDirectory = await mkdtemp(join(tmpdir(), 'kathesama-architecture-audit-'));
    const sourcePath = join(testDirectory, 'architecture.source.json');
    const outputPath = join(testDirectory, 'architecture.public.json');
    const sentinel = 'keep-existing-public-artifact\n';

    try {
      const source = JSON.parse(
        await readFile(
          resolve(import.meta.dirname, '../src/content/architecture/architecture.public.json'),
          'utf8',
        ),
      ) as {
        lenses: Array<{ sections: Array<{ body: { en: string } }> }>;
      };
      source.lenses[0].sections[0].body.en =
        'The response includes claim tenant_id for internal authorization.';

      await writeFile(sourcePath, JSON.stringify(source), 'utf8');
      await writeFile(outputPath, sentinel, 'utf8');

      await expect(
        preparePublicArchitecture({ sourcePath, outputPath }),
      ).rejects.toThrow('identity.claim-identifier');
      await expect(readFile(outputPath, 'utf8')).resolves.toBe(sentinel);
    } finally {
      await rm(testDirectory, { force: true, recursive: true });
    }
  });
});
