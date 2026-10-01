import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validatePublicArchitecture } from '../src/features/architecture/architecture.schema';
import {
  assertPublicArchitectureDisclosureSafe,
  PublicArchitectureDisclosureError,
} from './audit-public-architecture';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(
  projectRoot,
  'src/content/architecture/architecture.public.json',
);
const outputPath = resolve(projectRoot, 'public/architecture.public.json');

export type PreparePublicArchitectureOptions = {
  sourcePath?: string;
  outputPath?: string;
};

export async function preparePublicArchitecture({
  sourcePath: inputPath = sourcePath,
  outputPath: destinationPath = outputPath,
}: PreparePublicArchitectureOptions = {}): Promise<void> {
  const source = await readFile(inputPath, 'utf8');
  const architecture = validatePublicArchitecture(JSON.parse(source));
  assertPublicArchitectureDisclosureSafe(architecture);

  await mkdir(dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, `${JSON.stringify(architecture, null, 2)}\n`, 'utf8');

  console.log(
    `architecture: ${architecture.nodes.length} nodes, ${architecture.edges.length} edges, ${architecture.flows.length} flows, ${architecture.lenses.length} lenses`,
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  preparePublicArchitecture().catch((error: unknown) => {
    if (error instanceof PublicArchitectureDisclosureError) {
      console.error(error.message);
    } else {
      console.error('Architecture validation failed');
    }
    process.exitCode = 1;
  });
}
