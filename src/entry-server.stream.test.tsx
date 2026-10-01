import { describe, expect, it, vi } from 'vitest';

const serverSpies = vi.hoisted(() => ({
  renderToString: vi.fn(() => {
    throw new Error('entry-server must return the accumulated streaming output');
  }),
}));

vi.mock('react-dom/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom/server')>();
  return { ...actual, renderToString: serverSpies.renderToString };
});

import { render } from './entry-server';

describe('server entry streaming contract', () => {
  it('does not perform a second render after the stream is ready', async () => {
    const html = await render('/blog?lang=en');

    expect(html).toContain('Field notes from building JuanaIA');
    expect(serverSpies.renderToString).not.toHaveBeenCalled();
  });
});
