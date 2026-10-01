import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { getHydrationRouteOverrides, preloadAppRoute } from './app/routeLoaders';

const renderTimeoutMs = 10_000;

export function render(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let abort: (reason?: unknown) => void = () => undefined;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      abort();
      reject(new Error(`SSR timed out after ${renderTimeoutMs}ms for ${url}`));
    }, renderTimeoutMs);

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      abort();
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    void preloadAppRoute(url)
      .then(() => {
        if (settled) return;

        const stream = renderToPipeableStream(
          <MemoryRouter initialEntries={[url]}>
            <App initialLanguage="en" routeOverrides={getHydrationRouteOverrides()} />
          </MemoryRouter>,
          {
            onAllReady() {
              if (settled) return;
              const output = new PassThrough();
              const chunks: Buffer[] = [];

              output.on('data', (chunk: Buffer | string) => {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              });
              output.on('error', fail);
              output.on('end', () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                resolve(Buffer.concat(chunks).toString('utf8'));
              });
              stream.pipe(output);
            },
            onShellError: fail,
            onError: fail,
          },
        );

        abort = stream.abort;
      })
      .catch(fail);
  });
}
