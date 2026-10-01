import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  collectBoundedChunks,
  consumeDownloadBudget,
  downloadMediumAsset,
  importLimits,
  importMediumBlog,
  resolveStagingPath,
} from './import-medium-blog';

const fixturePath = resolve('scripts/fixtures/medium-feed.test.xml');

const directoryStats = (symbolicLink = false) => ({
  isDirectory: () => true,
  isSymbolicLink: () => symbolicLink,
});

function safeStagingDependencies() {
  return {
    readdir: vi.fn().mockResolvedValue([]),
    mkdir: vi.fn().mockResolvedValue(undefined),
    lstat: vi.fn().mockResolvedValue(directoryStats()),
    realpath: vi.fn(async (path: string) => path),
    acquireLock: vi.fn().mockResolvedValue({ close: vi.fn().mockResolvedValue(undefined) }),
    removeFile: vi.fn().mockResolvedValue(undefined),
    writeExclusive: vi.fn().mockResolvedValue(undefined),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('importMediumBlog', () => {
  it('creates a safe deterministic English draft in dry-run mode without fetches or writes', async () => {
    const fetchMock = vi.fn();
    const writeFile = vi.fn();
    const mkdir = vi.fn();

    const report = await importMediumBlog(
      { fixturePath, dryRun: true },
      { fetch: fetchMock, writeFile, mkdir },
    );

    expect(report.drafts).toHaveLength(1);
    expect(report.assets).toEqual([
      {
        sourceUrl: 'https://cdn-images-1.medium.com/max/1024/1*safe.png',
        localPath: '/images/blog/safe-import-example-abc123def456/figure-01.png',
      },
    ]);
    expect(report.drafts[0]!.markdown).toContain('language: "en"');
    expect(report.drafts[0]!.markdown).toContain('translation: "original"');
    expect(report.drafts[0]!.markdown).toContain('```typescript\nconst answer = 42;\n```');
    expect(report.drafts[0]!.markdown).toContain('[external guide](https://example.com/guide)');
    expect(report.drafts[0]!.markdown).not.toContain('medium.com/_/stat');
    expect(report.drafts[0]!.markdown).not.toContain('source=rss');
    expect(report.reviewItems).toEqual([
      expect.objectContaining({
        kind: 'missing-alt',
        slug: 'safe-import-example-abc123def456',
        localPath: '/images/blog/safe-import-example-abc123def456/figure-01.png',
      }),
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
  });

  it('derives an unknown post slug from the normalized title and post ID, never the remote path', async () => {
    const original = await importMediumBlog({ fixturePath, dryRun: true });
    const fixture = await import('node:fs/promises').then(({ readFile }) =>
      readFile(fixturePath, 'utf8'),
    );
    const changedRemotePath = fixture.replace(
      'safe-import-example-abc123def456?source=rss-feed',
      'remote-path-was-renamed-abc123def456?source=rss-feed',
    );
    const changed = await importMediumBlog(
      { fixturePath: 'unused.xml', dryRun: true },
      { readFile: vi.fn().mockResolvedValue(changedRemotePath) },
    );

    expect(original.drafts[0]!.slug).toBe('safe-import-example-abc123def456');
    expect(changed.drafts[0]!.slug).toBe(original.drafts[0]!.slug);
  });

  it('refuses an unsafe feed URL before any network request', async () => {
    const fetchMock = vi.fn();

    await expect(
      importMediumBlog({ feedUrl: 'http://medium.com/feed/@kathesama' }, { fetch: fetchMock }),
    ).rejects.toThrow(/configured Medium feed/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'http://medium.com/feed/@kathesama',
    'https://user@medium.com/feed/@kathesama',
    'https://medium.com:443/feed/@kathesama',
    'https://medium.com/feed/@kathesama?token=secret',
    'https://medium.com/feed/@kathesama#fragment',
    'https://www.medium.com/feed/@kathesama',
    'https://medium.example/feed/@kathesama',
    'https://104.16.0.1/feed/@kathesama',
  ])('allows only the exact configured Medium feed URL: %s', async (feedUrl) => {
    const fetchMock = vi.fn();
    await expect(importMediumBlog({ feedUrl }, { fetch: fetchMock })).rejects.toThrow(
      /configured Medium feed/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows the exact configured HTTPS Medium feed URL', async () => {
    const fixture = await import('node:fs/promises').then(({ readFile }) =>
      readFile(fixturePath, 'utf8'),
    );
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(fixture, { headers: { 'content-type': 'application/rss+xml' } }),
    );

    await expect(
      importMediumBlog(
        { feedUrl: 'https://medium.com/feed/@kathesama', dryRun: true },
        { fetch: fetchMock },
      ),
    ).resolves.toEqual(expect.objectContaining({ drafts: expect.any(Array) }));
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('refuses a non-empty staging output before writing', async () => {
    const writeFile = vi.fn();

    await expect(
      importMediumBlog(
        { fixturePath, outputDirectory: '.blog-import', dryRun: false },
        {
          ...safeStagingDependencies(),
          readdir: vi.fn().mockResolvedValue(['existing.txt']),
          writeFile,
        },
      ),
    ).rejects.toThrow(/empty/);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rejects HTML outside the supported Medium article subset', async () => {
    const unsafeFeed = `<?xml version="1.0"?><rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>Unsafe post</title><link>https://medium.com/@kathesama/unsafe-post-abc123def456</link><guid>https://medium.com/p/abc123def456</guid><pubDate>Sat, 14 Mar 2026 21:22:40 GMT</pubDate><content:encoded><![CDATA[<p>Safe prose</p><video src="https://example.com/video.mp4"></video>]]></content:encoded></item></channel></rss>`;

    await expect(
      importMediumBlog(
        { fixturePath: 'unused.xml', dryRun: true },
        { readFile: vi.fn().mockResolvedValue(unsafeFeed) },
      ),
    ).rejects.toThrow(/Unsupported HTML element/);
  });

  it('does not echo imported title or body content in validation errors', async () => {
    const sensitiveMarker = 'SENSITIVE_IMPORT_MARKER';
    const unsafeFeed = `<?xml version="1.0"?><rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>${sensitiveMarker}</title><link>https://medium.com/@kathesama/unsafe-post-abc123def456</link><guid>https://medium.com/p/abc123def456</guid><pubDate>Sat, 14 Mar 2026 21:22:40 GMT</pubDate><content:encoded><![CDATA[<script>${sensitiveMarker}</script>]]></content:encoded></item></channel></rss>`;
    let error: unknown;
    try {
      await importMediumBlog(
        { fixturePath: 'unused.xml', dryRun: true },
        { readFile: vi.fn().mockResolvedValue(unsafeFeed) },
      );
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toContain(sensitiveMarker);
    expect(String(error)).not.toContain('sensitive-import-marker');
  });

  it('caps the number of feed posts and assets per post before staging', async () => {
    const fixture = await import('node:fs/promises').then(({ readFile }) =>
      readFile(fixturePath, 'utf8'),
    );
    const item = fixture.match(/<item>[\s\S]*<\/item>/)?.[0];
    expect(item).toBeDefined();
    const tooManyPosts = fixture.replace(item!, item!.repeat(importLimits.maximumPosts + 1));
    await expect(
      importMediumBlog(
        { fixturePath: 'unused.xml', dryRun: true },
        { readFile: vi.fn().mockResolvedValue(tooManyPosts) },
      ),
    ).rejects.toThrow(/post limit/);

    const image = '<img src="https://cdn-images-1.medium.com/max/100/1*safe.png">';
    const tooManyAssets = fixture.replace(
      '<figure><img',
      `${image.repeat(importLimits.maximumAssetsPerPost + 1)}<figure><img`,
    );
    await expect(
      importMediumBlog(
        { fixturePath: 'unused.xml', dryRun: true },
        { readFile: vi.fn().mockResolvedValue(tooManyAssets) },
      ),
    ).rejects.toThrow(/asset limit/);
  });

  it('rejects protocol-relative HTML links while accepting local paths and anchors', async () => {
    const protocolRelativeFeed = `<?xml version="1.0"?><rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>Unsafe link</title><link>https://medium.com/@kathesama/unsafe-link-abc123def456</link><guid>https://medium.com/p/abc123def456</guid><pubDate>Sat, 14 Mar 2026 21:22:40 GMT</pubDate><content:encoded><![CDATA[<p><a href="//evil.example/path">external</a></p>]]></content:encoded></item></channel></rss>`;
    await expect(
      importMediumBlog(
        { fixturePath: 'unused.xml', dryRun: true },
        { readFile: vi.fn().mockResolvedValue(protocolRelativeFeed) },
      ),
    ).rejects.toThrow(/unsafe URL/);

    const localFeed = protocolRelativeFeed.replace(
      '<a href="//evil.example/path">external</a>',
      '<a href="/blog/local">local</a><a href="#section">section</a>',
    );
    await expect(
      importMediumBlog(
        { fixturePath: 'unused.xml', dryRun: true },
        { readFile: vi.fn().mockResolvedValue(localFeed) },
      ),
    ).resolves.toEqual(expect.objectContaining({ drafts: expect.any(Array) }));

    const relativeFeed = protocolRelativeFeed.replace(
      '<a href="//evil.example/path">external</a>',
      '<a href="relative/path">relative</a>',
    );
    await expect(
      importMediumBlog(
        { fixturePath: 'unused.xml', dryRun: true },
        { readFile: vi.fn().mockResolvedValue(relativeFeed) },
      ),
    ).rejects.toThrow(/unsafe URL/);
  });

  it.each([
    [
      'source userinfo',
      'https://user:password@medium.com/@kathesama/safe-import-example-abc123def456',
    ],
    [
      'source sensitive query',
      'https://medium.com/@kathesama/safe-import-example-abc123def456?access_token=do-not-log',
    ],
  ])('rejects %s without echoing the sensitive URL', async (_label, sourceUrl) => {
    const fixture = await import('node:fs/promises').then(({ readFile }) =>
      readFile(fixturePath, 'utf8'),
    );
    const modified = fixture.replace(
      'https://medium.com/@kathesama/safe-import-example-abc123def456?source=rss-feed',
      sourceUrl,
    );
    let error: unknown;
    try {
      await importMediumBlog(
        { fixturePath: 'unused.xml', dryRun: true },
        { readFile: vi.fn().mockResolvedValue(modified) },
      );
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toContain('do-not-log');
    expect(String(error)).not.toContain('user:password');
  });

  it.each([
    ['HTML link userinfo', 'https://user:password@example.com/private'],
    ['HTML link sensitive query', 'https://example.com/path?api_key=do-not-log'],
  ])('rejects %s before Markdown is persisted', async (_label, href) => {
    const fixture = await import('node:fs/promises').then(({ readFile }) =>
      readFile(fixturePath, 'utf8'),
    );
    const modified = fixture.replace('https://example.com/guide', href);
    await expect(
      importMediumBlog(
        { fixturePath: 'unused.xml', dryRun: true },
        { readFile: vi.fn().mockResolvedValue(modified) },
      ),
    ).rejects.toThrow(/unsafe URL/);
  });

  it.each([
    'https://user:password@cdn-images-1.medium.com/max/100/1*safe.png',
    'https://cdn-images-1.medium.com/max/100/1*safe.png?access_token=do-not-log',
  ])('rejects unsafe source image URL %s', async (sourceUrl) => {
    const fixture = await import('node:fs/promises').then(({ readFile }) =>
      readFile(fixturePath, 'utf8'),
    );
    const modified = fixture.replace(
      'https://cdn-images-1.medium.com/max/1024/1*safe.png?source=rss-feed&amp;tracking=yes#fragment',
      sourceUrl,
    );
    await expect(
      importMediumBlog(
        { fixturePath: 'unused.xml', dryRun: true },
        { readFile: vi.fn().mockResolvedValue(modified) },
      ),
    ).rejects.toThrow(/unsafe URL/);
  });

  it('uses a fence longer than the longest backtick run in imported code', async () => {
    const fixture = await import('node:fs/promises').then(({ readFile }) =>
      readFile(fixturePath, 'utf8'),
    );
    const modified = fixture.replace('const answer = 42;', 'const marker = ````;');
    const report = await importMediumBlog(
      { fixturePath: 'unused.xml', dryRun: true },
      { readFile: vi.fn().mockResolvedValue(modified) },
    );
    expect(report.drafts[0]!.markdown).toContain(
      '`````typescript\nconst marker = ````;\n`````',
    );
  });

  it('keeps every staging path inside the selected directory', () => {
    const root = resolve('.blog-import');
    expect(resolveStagingPath(root, 'content/blog/article.md')).toContain(root);
    expect(() => resolveStagingPath(root, '../outside.txt')).toThrow(/outside/);
  });

  it('writes a source inventory with post, asset, and review mappings', async () => {
    const writes: Array<[string, string | Uint8Array]> = [];
    const dependencies = safeStagingDependencies();
    dependencies.writeExclusive.mockImplementation(
      async (path: string, data: string | Uint8Array) => {
        writes.push([path, data]);
      },
    );
    await importMediumBlog(
      { fixturePath, outputDirectory: '.blog-import-test', dryRun: false },
      dependencies,
    );

    const inventoryWrite = writes.find(([path]) => path.endsWith('source-inventory.json'));
    expect(inventoryWrite).toBeDefined();
    const inventory = JSON.parse(String(inventoryWrite![1])) as Record<string, unknown>;
    expect(inventory).toEqual({
      posts: [
        expect.objectContaining({
          postId: 'abc123def456',
          slug: 'safe-import-example-abc123def456',
          sourceUrl: 'https://medium.com/@kathesama/safe-import-example-abc123def456',
          draftPath:
            'content/blog/articles/safe-import-example-abc123def456.en.md',
        }),
      ],
      assets: [expect.objectContaining({ sourceUrl: expect.stringContaining('cdn-images-1.medium.com') })],
      reviewItems: [expect.objectContaining({ kind: 'missing-alt' })],
    });
    expect(dependencies.acquireLock).toHaveBeenCalledOnce();
    expect(dependencies.removeFile).toHaveBeenCalledOnce();
  });

  it.each([
    ['symlink', resolve('.blog-import-symlink')],
    ['junction', resolve('.blog-import-junction')],
  ])('rejects a staging root that is a %s before writing', async (kind, outputDirectory) => {
    const dependencies = safeStagingDependencies();
    if (kind === 'symlink') {
      dependencies.lstat.mockResolvedValue(directoryStats(true));
    } else {
      dependencies.realpath.mockResolvedValue(resolve('outside-staging-root'));
    }

    await expect(
      importMediumBlog(
        { fixturePath, outputDirectory, dryRun: false },
        dependencies,
      ),
    ).rejects.toThrow(/safe real directory/);
    expect(dependencies.writeExclusive).not.toHaveBeenCalled();
  });

  it('rejects a symlinked staging descendant before exclusive writes', async () => {
    const dependencies = safeStagingDependencies();
    dependencies.lstat.mockImplementation(async (path: string) =>
      /[\\/]content$/.test(path) ? directoryStats(true) : directoryStats(),
    );

    await expect(
      importMediumBlog(
        { fixturePath, outputDirectory: resolve('.blog-import-descendant'), dryRun: false },
        dependencies,
      ),
    ).rejects.toThrow(/safe real directory/);
    expect(dependencies.writeExclusive).not.toHaveBeenCalled();
  });

  it('rejects duplicate post identities and destinations before acquiring the lock', async () => {
    const fixture = await import('node:fs/promises').then(({ readFile }) =>
      readFile(fixturePath, 'utf8'),
    );
    const item = fixture.match(/<item>[\s\S]*<\/item>/)?.[0];
    const duplicated = fixture.replace(item!, `${item!}${item!}`);
    const dependencies = safeStagingDependencies();

    await expect(
      importMediumBlog(
        { fixturePath: 'unused.xml', outputDirectory: '.blog-import-duplicate', dryRun: false },
        { ...dependencies, readFile: vi.fn().mockResolvedValue(duplicated) },
      ),
    ).rejects.toThrow(/Duplicate import/);
    expect(dependencies.acquireLock).not.toHaveBeenCalled();
    expect(dependencies.writeExclusive).not.toHaveBeenCalled();
  });
});

describe('downloadMediumAsset', () => {
  it('allows only the Medium image CDN over HTTPS with an image content type', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(bytes, { headers: { 'content-type': 'image/png' } }),
    );

    await expect(
      downloadMediumAsset(
        'https://cdn-images-1.medium.com/max/100/1*safe.png',
        fetchMock,
      ),
    ).resolves.toEqual(bytes);
    await expect(
      downloadMediumAsset('https://example.com/unsafe.png', fetchMock),
    ).rejects.toThrow(/cdn-images-1\.medium\.com/);
  });

  it('rejects non-image and oversized responses', async () => {
    const textFetch = vi.fn().mockResolvedValue(
      new Response('not an image', { headers: { 'content-type': 'text/html' } }),
    );
    await expect(
      downloadMediumAsset(
        'https://cdn-images-1.medium.com/max/100/1*safe.png',
        textFetch,
      ),
    ).rejects.toThrow(/content type/);

    const oversizedFetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array(10_000_001), {
        headers: { 'content-type': 'image/png' },
      }),
    );
    await expect(
      downloadMediumAsset(
        'https://cdn-images-1.medium.com/max/100/1*safe.png',
        oversizedFetch,
      ),
    ).rejects.toThrow(/size limit/);
  });

  it('cancels the body when MIME or declared content length is rejected', async () => {
    const mimeCancel = vi.fn();
    const mimeStream = new ReadableStream<Uint8Array>({ cancel: mimeCancel });
    await expect(
      downloadMediumAsset(
        'https://cdn-images-1.medium.com/max/100/1*safe.png',
        vi.fn().mockResolvedValue(
          new Response(mimeStream, { headers: { 'content-type': 'text/html' } }),
        ),
      ),
    ).rejects.toThrow(/content type/);
    expect(mimeCancel).toHaveBeenCalledOnce();

    const lengthCancel = vi.fn();
    const lengthStream = new ReadableStream<Uint8Array>({ cancel: lengthCancel });
    await expect(
      downloadMediumAsset(
        'https://cdn-images-1.medium.com/max/100/1*safe.png',
        vi.fn().mockResolvedValue(
          new Response(lengthStream, {
            headers: {
              'content-type': 'image/png',
              'content-length': String(importLimits.maximumAssetBytes + 1),
            },
          }),
        ),
      ),
    ).rejects.toThrow(/size limit/);
    expect(lengthCancel).toHaveBeenCalledOnce();
  });

  it('streams the body, cancels it, and rejects once the hard cap is crossed without content-length', async () => {
    const cancel = vi.fn();
    let emitted = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        emitted += 1;
        controller.enqueue(new Uint8Array(1_000_001));
        if (emitted >= 20) controller.close();
      },
      cancel,
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(stream, { headers: { 'content-type': 'image/png' } }),
    );

    await expect(
      downloadMediumAsset(
        'https://cdn-images-1.medium.com/max/100/1*safe.png',
        fetchMock,
      ),
    ).rejects.toThrow(/size limit/);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('aborts an asset request when its timeout expires', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        );
      }),
    );

    const pending = downloadMediumAsset(
      'https://cdn-images-1.medium.com/max/100/1*safe.png',
      fetchMock,
    );
    const rejection = expect(pending).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(importLimits.assetTimeoutMs + 1);
    await rejection;
  });

  it('keeps the asset deadline active through a stalled body and cleans its timer', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const stalledBody = new ReadableStream<Uint8Array>({ cancel });
    const pending = downloadMediumAsset(
      'https://cdn-images-1.medium.com/max/100/1*safe.png',
      vi.fn().mockResolvedValue(
        new Response(stalledBody, { headers: { 'content-type': 'image/png' } }),
      ),
    );
    const rejection = expect(pending).rejects.toThrow(/timed out/);

    await vi.advanceTimersByTimeAsync(importLimits.assetTimeoutMs + 1);
    await rejection;
    expect(cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans the asset deadline after a successful body read', async () => {
    vi.useFakeTimers();
    await expect(
      downloadMediumAsset(
        'https://cdn-images-1.medium.com/max/100/1*safe.png',
        vi.fn().mockResolvedValue(
          new Response(new Uint8Array([1]), {
            headers: { 'content-type': 'image/png' },
          }),
        ),
      ),
    ).resolves.toEqual(new Uint8Array([1]));
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('bounded import resources', () => {
  it('cancels the feed body when MIME or declared content length is rejected', async () => {
    const mimeCancel = vi.fn();
    await expect(
      importMediumBlog(
        { feedUrl: 'https://medium.com/feed/@kathesama', dryRun: true },
        {
          fetch: vi.fn().mockResolvedValue(
            new Response(new ReadableStream<Uint8Array>({ cancel: mimeCancel }), {
              headers: { 'content-type': 'text/html' },
            }),
          ),
        },
      ),
    ).rejects.toThrow(/not XML/);
    expect(mimeCancel).toHaveBeenCalledOnce();

    const lengthCancel = vi.fn();
    await expect(
      importMediumBlog(
        { feedUrl: 'https://medium.com/feed/@kathesama', dryRun: true },
        {
          fetch: vi.fn().mockResolvedValue(
            new Response(new ReadableStream<Uint8Array>({ cancel: lengthCancel }), {
              headers: {
                'content-type': 'application/rss+xml',
                'content-length': String(importLimits.maximumFeedBytes + 1),
              },
            }),
          ),
        },
      ),
    ).rejects.toThrow(/size limit/);
    expect(lengthCancel).toHaveBeenCalledOnce();
  });

  it('aborts a feed request when its timeout expires', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        );
      }),
    );

    const pending = importMediumBlog(
      { feedUrl: 'https://medium.com/feed/@kathesama', dryRun: true },
      { fetch: fetchMock },
    );
    const rejection = expect(pending).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(importLimits.feedTimeoutMs + 1);
    await rejection;
  });

  it('keeps the feed deadline active through a stalled body and cleans its timer', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const stalledBody = new ReadableStream<Uint8Array>({ cancel });
    const pending = importMediumBlog(
      { feedUrl: 'https://medium.com/feed/@kathesama', dryRun: true },
      {
        fetch: vi.fn().mockResolvedValue(
          new Response(stalledBody, {
            headers: { 'content-type': 'application/rss+xml' },
          }),
        ),
      },
    );
    const rejection = expect(pending).rejects.toThrow(/timed out/);

    await vi.advanceTimersByTimeAsync(importLimits.feedTimeoutMs + 1);
    await rejection;
    expect(cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('bounds streamed fixture input and invokes cancellation when the cap is crossed', async () => {
    const cancel = vi.fn();
    async function* chunks() {
      yield new Uint8Array(3_000_000);
      yield new Uint8Array(3_000_000);
    }

    await expect(
      collectBoundedChunks(chunks(), importLimits.maximumFeedBytes, 'fixture', cancel),
    ).rejects.toThrow(/size limit/);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('enforces a cumulative download budget before the next asset is persisted', () => {
    expect(() =>
      consumeDownloadBudget(
        importLimits.maximumTotalDownloadBytes - 1,
        2,
      ),
    ).toThrow(/download budget/);
  });
});
