import {
  lstat as nodeLstat,
  mkdir as nodeMkdir,
  open as nodeOpen,
  realpath as nodeRealpath,
  readdir as nodeReaddir,
  unlink as nodeUnlink,
} from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import TurndownService from 'turndown';
import { canonicalArticles } from '../src/content/blog/validation';

export const importLimits = {
  maximumFeedBytes: 5_000_000,
  maximumAssetBytes: 10_000_000,
  maximumPosts: 16,
  maximumAssetsPerPost: 32,
  maximumAssetsTotal: 64,
  maximumTotalDownloadBytes: 80_000_000,
  feedTimeoutMs: 10_000,
  assetTimeoutMs: 15_000,
} as const;

const mediumImageHost = 'cdn-images-1.medium.com';
const configuredFeedUrl = 'https://medium.com/feed/@kathesama';
const defaultFixture = 'content/blog/source/medium-feed-2026-09-30.xml';
const sensitiveParameterName = /(?:^|[_-])(?:access[_-]?token|token|api[_-]?key|key|auth|credential|password|passwd|secret|signature|sig)(?:$|[_-])/i;
const supportedHtmlTags = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'figcaption',
  'figure',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'ul',
]);

export interface MediumImportOptions {
  fixturePath?: string;
  feedUrl?: string;
  outputDirectory?: string;
  downloadAssets?: boolean;
  dryRun?: boolean;
}

interface FileStats {
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
}

interface LockHandle {
  close(): Promise<unknown>;
}

interface ImportDependencies {
  readFile?: (path: string, encoding: 'utf8') => Promise<string>;
  writeFile?: (
    path: string,
    data: string | Uint8Array,
    encoding?: BufferEncoding,
  ) => Promise<unknown>;
  mkdir?: (path: string, options: { recursive: boolean }) => Promise<unknown>;
  readdir?: (path: string) => Promise<string[]>;
  lstat?: (path: string) => Promise<FileStats>;
  realpath?: (path: string) => Promise<string>;
  writeExclusive?: (path: string, data: string | Uint8Array) => Promise<unknown>;
  acquireLock?: (path: string) => Promise<LockHandle>;
  removeFile?: (path: string) => Promise<unknown>;
  fetch?: typeof fetch;
}

export interface ImportedAsset {
  sourceUrl: string;
  localPath: string;
}

export interface ImportReviewItem {
  kind: 'missing-alt';
  slug: string;
  localPath: string;
}

export interface ImportedDraft {
  slug: string;
  postId: string;
  fileName: string;
  markdown: string;
}

export interface ImportedPost {
  id: string;
  postId: string;
  slug: string;
  sourceUrl: string;
  publishedAt: string;
  draftPath: string;
}

export interface MediumImportReport {
  posts: ImportedPost[];
  drafts: ImportedDraft[];
  assets: ImportedAsset[];
  reviewItems: ImportReviewItem[];
}

interface RawMediumItem {
  title?: unknown;
  link?: unknown;
  guid?: unknown;
  pubDate?: unknown;
  encoded?: unknown;
}

function valueAsText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object' && '#text' in value) {
    return valueAsText((value as { '#text': unknown })['#text']);
  }
  return '';
}

function hasSensitiveParameters(url: URL): boolean {
  return [...url.searchParams.keys()].some((name) => sensitiveParameterName.test(name));
}

function assertUrlHygiene(url: URL): void {
  if (url.username || url.password || hasSensitiveParameters(url)) {
    throw new Error('Import source contains an unsafe URL');
  }
}

function sanitizeSourceUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Medium source URL is invalid');
  }
  if (url.protocol !== 'https:' || url.hostname !== 'medium.com') {
    throw new Error('Medium source URLs must use HTTPS on medium.com');
  }
  assertUrlHygiene(url);
  url.search = '';
  url.hash = '';
  return url.toString();
}

function postIdFrom(...values: string[]): string {
  for (const value of values) {
    const match = value.match(/(?:-|\/)([a-f0-9]{12})(?:[/?#]|$)/i);
    if (match?.[1]) return match[1].toLowerCase();
  }
  throw new Error('Medium item is missing a stable post ID');
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96);
}

function stableSlug(title: string, postId: string): string {
  const canonical = canonicalArticles.find((article) => article.sourcePostId === postId);
  if (canonical) return canonical.slug;
  const normalizedTitle = slugify(title) || 'medium-post';
  return `${normalizedTitle}-${postId}`;
}

function imageExtension(sourceUrl: string): string {
  const extension = extname(new URL(sourceUrl).pathname).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(extension)
    ? extension
    : '.img';
}

function normalizeMediumImageUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Import source contains an unsafe URL');
  }
  if (url.protocol !== 'https:' || url.hostname !== mediumImageHost) {
    throw new Error(`Images must use HTTPS on ${mediumImageHost}`);
  }
  assertUrlHygiene(url);
  url.search = '';
  url.hash = '';
  return url.toString();
}

function htmlAttribute(attributes: string, name: string): string {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2]?.trim() ?? '';
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function isSafeImportedLink(rawHref: string): boolean {
  if (rawHref.startsWith('#')) return true;
  if (rawHref.startsWith('//')) return false;
  try {
    const isLocalPath = rawHref.startsWith('/');
    const isAbsoluteHttpUrl = /^https?:\/\//i.test(rawHref);
    if (!isLocalPath && !isAbsoluteHttpUrl) return false;
    const url = new URL(rawHref, 'https://kathesama.ar');
    if (!isLocalPath && url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    assertUrlHygiene(url);
    return isLocalPath || url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function convertMediumHtml(
  html: string,
  slug: string,
): { markdown: string; assets: ImportedAsset[]; reviewItems: ImportReviewItem[] } {
  for (const match of html.matchAll(/<\s*\/?\s*([a-z][\w-]*)\b[^>]*>/gi)) {
    const tagName = match[1]!.toLowerCase();
    if (!supportedHtmlTags.has(tagName)) {
      throw new Error('Unsupported HTML element in Medium item');
    }
  }
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const href = htmlAttribute(match[1]!, 'href').replaceAll('&amp;', '&');
    if (href && !isSafeImportedLink(href)) {
      throw new Error('Import contains an unsafe URL');
    }
  }

  const assets: ImportedAsset[] = [];
  const reviewItems: ImportReviewItem[] = [];
  let ordinal = 0;
  const withoutTrackers = html.replace(/<img\b[^>]*\bsrc\s*=\s*(["'])https?:\/\/medium\.com\/_\/stat[^"']*\1[^>]*>/gi, '');
  const localizedImages = withoutTrackers.replace(/<img\b([^>]*)>/gi, (_match, attributes: string) => {
    const rawSource = htmlAttribute(attributes, 'src');
    if (!rawSource) throw new Error('Image source is missing in Medium item');
    const sourceUrl = normalizeMediumImageUrl(rawSource.replaceAll('&amp;', '&'));
    ordinal += 1;
    if (ordinal > importLimits.maximumAssetsPerPost) {
      throw new Error('Medium item exceeds the asset limit');
    }
    const localPath = `/images/blog/${slug}/figure-${String(ordinal).padStart(2, '0')}${imageExtension(sourceUrl)}`;
    const alt = htmlAttribute(attributes, 'alt');

    assets.push({ sourceUrl, localPath });
    if (!alt) reviewItems.push({ kind: 'missing-alt', slug, localPath });

    return `<img src="${localPath}" alt="${escapeHtmlAttribute(alt)}">`;
  });

  const turndown = new TurndownService({
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    headingStyle: 'atx',
  });
  turndown.addRule('language-fenced-code', {
    filter: (node) => node.nodeName === 'PRE',
    replacement: (_content, node) => {
      const code = node.firstElementChild;
      const className = code?.getAttribute('class') ?? '';
      const language = className.match(/(?:^|\s)language-([\w+-]+)/)?.[1] ?? '';
      const value = (code?.textContent ?? node.textContent ?? '').replace(/\n+$/, '');
      const longestBacktickRun = Math.max(
        0,
        ...[...value.matchAll(/`+/g)].map((match) => match[0].length),
      );
      const fence = '`'.repeat(Math.max(3, longestBacktickRun + 1));
      return `\n\n${fence}${language}\n${value}\n${fence}\n\n`;
    },
  });

  return {
    markdown: turndown.turndown(localizedImages).trim(),
    assets,
    reviewItems,
  };
}

function frontMatterForDraft(
  id: string,
  slug: string,
  sourceUrl: string,
  postId: string,
  publishedAt: string,
): string {
  const fields = {
    id,
    slug,
    language: 'en',
    sourceLanguage: 'en',
    sourcePlatform: 'medium',
    sourceUrl,
    sourcePostId: postId,
    publishedAt,
    translation: 'original',
  } as const;

  return [
    '---',
    ...Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`),
    '---',
  ].join('\n');
}

function parseFeed(xml: string): RawMediumItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    processEntities: false,
    removeNSPrefix: true,
    trimValues: false,
  });
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: RawMediumItem | RawMediumItem[] } };
  };
  const items = parsed.rss?.channel?.item;
  if (!items) throw new Error('RSS feed contains no Medium items');
  const normalizedItems = Array.isArray(items) ? items : [items];
  if (normalizedItems.length > importLimits.maximumPosts) {
    throw new Error('Medium feed exceeds the post limit');
  }
  return normalizedItems;
}

function buildReport(xml: string): MediumImportReport {
  const posts: ImportedPost[] = [];
  const drafts: ImportedDraft[] = [];
  const assets: ImportedAsset[] = [];
  const reviewItems: ImportReviewItem[] = [];

  for (const item of parseFeed(xml)) {
    const title = valueAsText(item.title);
    const rawLink = valueAsText(item.link);
    const rawGuid = valueAsText(item.guid);
    const sourceUrl = sanitizeSourceUrl(rawLink);
    const postId = postIdFrom(rawLink, rawGuid);
    const canonical = canonicalArticles.find((article) => article.sourcePostId === postId);
    const slug = stableSlug(title, postId);
    const date = new Date(valueAsText(item.pubDate));
    if (!title || Number.isNaN(date.valueOf())) {
      throw new Error(`Medium item ${postId} has invalid title or publication date`);
    }

    const converted = convertMediumHtml(valueAsText(item.encoded), slug);
    const markdown = `${frontMatterForDraft(
      canonical?.id ?? `medium-${postId}`,
      slug,
      canonical?.sourceUrl ?? sourceUrl,
      postId,
      canonical?.publishedAt ?? date.toISOString().replace('.000Z', 'Z'),
    )}\n\n${converted.markdown}\n`;

    const id = canonical?.id ?? `medium-${postId}`;
    const publishedAt = canonical?.publishedAt ?? date.toISOString().replace('.000Z', 'Z');
    const draftPath = `content/blog/articles/${slug}.en.md`;
    drafts.push({
      slug,
      postId,
      fileName: draftPath,
      markdown,
    });
    posts.push({
      id,
      postId,
      slug,
      sourceUrl: canonical?.sourceUrl ?? sourceUrl,
      publishedAt,
      draftPath,
    });
    assets.push(...converted.assets);
    if (assets.length > importLimits.maximumAssetsTotal) {
      throw new Error('Medium feed exceeds the total asset limit');
    }
    reviewItems.push(...converted.reviewItems);
  }

  return { posts, drafts, assets, reviewItems };
}

export function resolveStagingPath(stagingRoot: string, childPath: string): string {
  if (isAbsolute(childPath)) throw new Error('Staging path points outside the output directory');
  const root = resolve(stagingRoot);
  const target = resolve(root, childPath);
  const pathFromRoot = relative(root, target);
  if (pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) {
    throw new Error('Staging path points outside the output directory');
  }
  return target;
}

export async function collectBoundedChunks(
  chunks: AsyncIterable<Uint8Array>,
  limit: number,
  label: string,
  onLimit?: () => void | Promise<void>,
): Promise<Uint8Array> {
  const collected: Uint8Array[] = [];
  let totalBytes = 0;
  for await (const chunk of chunks) {
    totalBytes += chunk.byteLength;
    if (totalBytes > limit) {
      await onLimit?.();
      throw new Error(`${label} exceeds the size limit`);
    }
    collected.push(chunk);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of collected) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export function consumeDownloadBudget(currentBytes: number, nextBytes: number): number {
  const total = currentBytes + nextBytes;
  if (total > importLimits.maximumTotalDownloadBytes) {
    throw new Error('Medium assets exceed the total download budget');
  }
  return total;
}

interface RequestDeadline {
  readonly signal: AbortSignal;
  readonly timedOut: boolean;
  finish(): void;
  setBodyCancel(cancel: () => void | Promise<void>): void;
  throwIfTimedOut(): void;
}

function createRequestDeadline(timeoutMs: number, label: string): RequestDeadline {
  const controller = new AbortController();
  let timedOut = false;
  let cancelBody: (() => void | Promise<void>) | undefined;
  const cancelRegisteredBody = (): void => {
    if (!cancelBody) return;
    void Promise.resolve(cancelBody()).catch(() => undefined);
  };
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
    cancelRegisteredBody();
  }, timeoutMs);

  return {
    signal: controller.signal,
    get timedOut() {
      return timedOut;
    },
    finish() {
      clearTimeout(timeout);
    },
    setBodyCancel(cancel) {
      cancelBody = cancel;
      if (timedOut) cancelRegisteredBody();
    },
    throwIfTimedOut() {
      if (timedOut) throw new Error(`${label} request timed out`);
    },
  };
}

async function fetchWithDeadline(
  input: string | URL,
  label: string,
  fetchImplementation: typeof fetch,
  deadline: RequestDeadline,
): Promise<Response> {
  try {
    return await fetchImplementation(input, {
      redirect: 'error',
      signal: deadline.signal,
    });
  } catch {
    deadline.throwIfTimedOut();
    throw new Error(`${label} request failed`);
  }
}

async function responseBytes(
  response: Response,
  limit: number,
  label: string,
  deadline: RequestDeadline,
): Promise<Uint8Array> {
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`${label} request failed with status ${response.status}`);
  }
  const declaredSize = Number(response.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredSize) && declaredSize > limit) {
    await response.body?.cancel();
    throw new Error(`${label} exceeds the size limit`);
  }

  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  deadline.setBodyCancel(() => reader.cancel());
  const chunks = async function* (): AsyncGenerator<Uint8Array> {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  };
  try {
    const bytes = await collectBoundedChunks(chunks(), limit, label, () => reader.cancel());
    deadline.throwIfTimedOut();
    return bytes;
  } finally {
    reader.releaseLock();
  }
}

export async function downloadMediumAsset(
  rawUrl: string,
  fetchImplementation: typeof fetch = fetch,
  byteLimit: number = importLimits.maximumAssetBytes,
): Promise<Uint8Array> {
  if (byteLimit <= 0) throw new Error('Medium assets exceed the total download budget');
  const sourceUrl = normalizeMediumImageUrl(rawUrl);
  const deadline = createRequestDeadline(importLimits.assetTimeoutMs, 'Medium asset');
  try {
    const response = await fetchWithDeadline(
      sourceUrl,
      'Medium asset',
      fetchImplementation,
      deadline,
    );
    deadline.setBodyCancel(() => response.body?.cancel());
    const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim() ?? '';
    if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(contentType)) {
      await response.body?.cancel();
      throw new Error('Medium asset has an unsupported content type');
    }
    return await responseBytes(
      response,
      Math.min(byteLimit, importLimits.maximumAssetBytes),
      'Medium asset',
      deadline,
    );
  } catch (error) {
    deadline.throwIfTimedOut();
    throw error;
  } finally {
    deadline.finish();
  }
}

async function readBoundedFixture(path: string): Promise<string> {
  const handle = await nodeOpen(path, 'r');
  const stream = handle.createReadStream({ autoClose: false });
  try {
    const bytes = await collectBoundedChunks(
      stream,
      importLimits.maximumFeedBytes,
      'Medium fixture',
      () => {
        stream.destroy();
      },
    );
    return new TextDecoder().decode(bytes);
  } finally {
    stream.destroy();
    await handle.close();
  }
}

async function loadFeed(
  options: MediumImportOptions,
  readFile: ImportDependencies['readFile'],
  fetchImplementation: typeof fetch,
): Promise<string> {
  if (options.fixturePath && options.feedUrl) {
    throw new Error('Choose either --fixture or --feed-url, not both');
  }
  if (options.feedUrl) {
    // DNS trust boundary: after this exact URL/TLS allowlist, the host resolver is trusted;
    // the importer does not pin Medium IP addresses or follow redirects.
    if (options.feedUrl !== configuredFeedUrl) {
      throw new Error('Feed URL must match the configured Medium feed');
    }
    const deadline = createRequestDeadline(importLimits.feedTimeoutMs, 'Medium feed');
    try {
      const response = await fetchWithDeadline(
        configuredFeedUrl,
        'Medium feed',
        fetchImplementation,
        deadline,
      );
      deadline.setBodyCancel(() => response.body?.cancel());
      const contentType = response.headers.get('content-type') ?? '';
      if (!/(?:xml|rss)/i.test(contentType)) {
        await response.body?.cancel();
        throw new Error('Feed response is not XML');
      }
      const bytes = await responseBytes(
        response,
        importLimits.maximumFeedBytes,
        'Medium feed',
        deadline,
      );
      deadline.throwIfTimedOut();
      return new TextDecoder().decode(bytes);
    } catch (error) {
      deadline.throwIfTimedOut();
      throw error;
    } finally {
      deadline.finish();
    }
  }
  const fixturePath = resolve(options.fixturePath ?? defaultFixture);
  if (!readFile) return readBoundedFixture(fixturePath);
  const source = await readFile(fixturePath, 'utf8');
  if (Buffer.byteLength(source, 'utf8') > importLimits.maximumFeedBytes) {
    throw new Error('Medium fixture exceeds the size limit');
  }
  return source;
}

async function statsIfPresent(
  path: string,
  lstat: NonNullable<ImportDependencies['lstat']>,
): Promise<FileStats | undefined> {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

function isContainedPath(root: string, target: string): boolean {
  const pathFromRoot = relative(root, target);
  return (
    pathFromRoot === '' ||
    (!isAbsolute(pathFromRoot) && pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`))
  );
}

async function assertSafeRealDirectory(
  directory: string,
  rootRealPath: string | undefined,
  dependencies: Required<Pick<ImportDependencies, 'lstat' | 'realpath'>>,
): Promise<string> {
  const stats = await dependencies.lstat(directory);
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error('Import output must be a safe real directory');
  }
  const realDirectory = resolve(await dependencies.realpath(directory));
  if (
    (rootRealPath === undefined && realDirectory !== resolve(directory)) ||
    (rootRealPath !== undefined && !isContainedPath(rootRealPath, realDirectory))
  ) {
    throw new Error('Import output must be a safe real directory');
  }
  return realDirectory;
}

async function ensureSafeParentDirectories(
  stagingRoot: string,
  target: string,
  rootRealPath: string,
  dependencies: Required<Pick<ImportDependencies, 'mkdir' | 'lstat' | 'realpath'>>,
): Promise<void> {
  const parent = dirname(target);
  const parentFromRoot = relative(stagingRoot, parent);
  if (!isContainedPath(stagingRoot, parent)) {
    throw new Error('Staging path points outside the output directory');
  }

  let current = stagingRoot;
  for (const segment of parentFromRoot.split(/[\\/]/).filter(Boolean)) {
    current = resolve(current, segment);
    if (!(await statsIfPresent(current, dependencies.lstat))) {
      await dependencies.mkdir(current, { recursive: false });
    }
    await assertSafeRealDirectory(current, rootRealPath, dependencies);
  }
}

function assertUniqueImport(report: MediumImportReport): void {
  const groups = [
    report.posts.map((post) => post.id),
    report.posts.map((post) => post.postId),
    report.posts.map((post) => post.slug),
    report.drafts.map((draft) => draft.fileName),
    report.assets.map((asset) => asset.localPath),
  ];
  if (groups.some((values) => new Set(values).size !== values.length)) {
    throw new Error('Duplicate import identity or destination detected');
  }

  const destinations = [
    ...report.drafts.map((draft) => draft.fileName),
    'content/blog/source/source-inventory.json',
    ...report.assets.map((asset) => `public${asset.localPath}`),
  ];
  if (new Set(destinations).size !== destinations.length) {
    throw new Error('Duplicate import identity or destination detected');
  }
}

async function stageReport(
  report: MediumImportReport,
  outputDirectory: string,
  downloadAssets: boolean,
  dependencies: Required<
    Pick<
      ImportDependencies,
      | 'mkdir'
      | 'readdir'
      | 'fetch'
      | 'lstat'
      | 'realpath'
      | 'writeExclusive'
      | 'acquireLock'
      | 'removeFile'
    >
  >,
): Promise<void> {
  const stagingRoot = resolve(outputDirectory);
  if (!(await statsIfPresent(stagingRoot, dependencies.lstat))) {
    await dependencies.mkdir(stagingRoot, { recursive: false });
  }
  const rootRealPath = await assertSafeRealDirectory(stagingRoot, undefined, dependencies);
  const entries = await dependencies.readdir(stagingRoot);
  if (entries.length > 0) throw new Error('Import output directory must be empty');

  const lockPath = resolveStagingPath(stagingRoot, '.medium-import.lock');
  const lock = await dependencies.acquireLock(lockPath);
  try {
    for (const draft of report.drafts) {
      const target = resolveStagingPath(stagingRoot, draft.fileName);
      await ensureSafeParentDirectories(stagingRoot, target, rootRealPath, dependencies);
      await dependencies.writeExclusive(target, draft.markdown);
    }

    const inventoryPath = resolveStagingPath(
      stagingRoot,
      'content/blog/source/source-inventory.json',
    );
    await ensureSafeParentDirectories(stagingRoot, inventoryPath, rootRealPath, dependencies);
    await dependencies.writeExclusive(
      inventoryPath,
      `${JSON.stringify(
        { posts: report.posts, assets: report.assets, reviewItems: report.reviewItems },
        null,
        2,
      )}\n`,
    );

    if (downloadAssets) {
      let downloadedBytes = 0;
      for (const asset of report.assets) {
        const target = resolveStagingPath(stagingRoot, `public${asset.localPath}`);
        const remainingBudget = importLimits.maximumTotalDownloadBytes - downloadedBytes;
        const bytes = await downloadMediumAsset(
          asset.sourceUrl,
          dependencies.fetch,
          remainingBudget,
        );
        downloadedBytes = consumeDownloadBudget(downloadedBytes, bytes.byteLength);
        await ensureSafeParentDirectories(stagingRoot, target, rootRealPath, dependencies);
        await dependencies.writeExclusive(target, bytes);
      }
    }
  } finally {
    await lock.close();
    await dependencies.removeFile(lockPath);
  }
}

async function writeExclusiveFile(
  path: string,
  data: string | Uint8Array,
): Promise<void> {
  const handle = await nodeOpen(path, 'wx');
  try {
    await handle.writeFile(data);
  } finally {
    await handle.close();
  }
}

async function acquireImportLock(path: string): Promise<LockHandle> {
  return nodeOpen(path, 'wx');
}

export async function importMediumBlog(
  options: MediumImportOptions,
  overrides: ImportDependencies = {},
): Promise<MediumImportReport> {
  const dependencies = {
    readFile: overrides.readFile,
    writeFile: overrides.writeFile,
    mkdir:
      overrides.mkdir ??
      ((path: string, mkdirOptions: { recursive: boolean }) => nodeMkdir(path, mkdirOptions)),
    readdir: overrides.readdir ?? ((path: string) => nodeReaddir(path)),
    lstat: overrides.lstat ?? ((path: string) => nodeLstat(path)),
    realpath: overrides.realpath ?? ((path: string) => nodeRealpath(path)),
    writeExclusive: overrides.writeExclusive ?? writeExclusiveFile,
    acquireLock: overrides.acquireLock ?? acquireImportLock,
    removeFile: overrides.removeFile ?? ((path: string) => nodeUnlink(path)),
    fetch: overrides.fetch ?? fetch,
  };
  const dryRun = options.dryRun ?? true;
  const xml = await loadFeed(options, dependencies.readFile, dependencies.fetch);
  const report = buildReport(xml);
  assertUniqueImport(report);

  if (!dryRun) {
    if (!options.outputDirectory) throw new Error('--output is required before files are written');
    await stageReport(report, options.outputDirectory, options.downloadAssets ?? false, dependencies);
  }

  return report;
}

function parseArguments(args: string[]): MediumImportOptions {
  const options: MediumImportOptions = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    const next = args[index + 1];
    if (argument === '--fixture' || argument === '--feed-url' || argument === '--output') {
      if (!next || next.startsWith('--')) throw new Error(`${argument} requires a value`);
      if (argument === '--fixture') options.fixturePath = next;
      if (argument === '--feed-url') options.feedUrl = next;
      if (argument === '--output') options.outputDirectory = next;
      index += 1;
    } else if (argument === '--download-assets') {
      options.downloadAssets = true;
    } else if (argument === '--dry-run') {
      options.dryRun = true;
    } else {
      throw new Error(`Unknown importer option: ${argument}`);
    }
  }

  if (options.outputDirectory && !args.includes('--dry-run')) options.dryRun = false;
  return options;
}

async function main(): Promise<void> {
  const report = await importMediumBlog(parseArguments(process.argv.slice(2)));
  console.log(
    JSON.stringify(
      {
        postIds: report.drafts.map((draft) => draft.postId),
        drafts: report.drafts.length,
        assets: report.assets.length,
        reviewItems: report.reviewItems,
      },
      null,
      2,
    ),
  );
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (entryPath === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Medium import failed');
    process.exitCode = 1;
  });
}
