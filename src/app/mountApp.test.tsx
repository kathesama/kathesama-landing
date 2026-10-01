import { beforeEach, describe, expect, it, vi } from 'vitest';

const clientMocks = vi.hoisted(() => ({
  render: vi.fn(),
  createRoot: vi.fn(),
  hydrateRoot: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
  createRoot: clientMocks.createRoot,
  hydrateRoot: clientMocks.hydrateRoot,
}));

import { mountApp } from './mountApp';

describe('mountApp', () => {
  beforeEach(() => {
    clientMocks.render.mockReset();
    clientMocks.createRoot.mockReset();
    clientMocks.hydrateRoot.mockReset();
    clientMocks.createRoot.mockReturnValue({ render: clientMocks.render });
  });

  it('hydrates an existing prerendered root', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<main>Prerendered</main>';

    await mountApp(root);

    expect(clientMocks.hydrateRoot).toHaveBeenCalledOnce();
    expect(clientMocks.createRoot).not.toHaveBeenCalled();
  });

  it('creates a normal SPA root when no prerendered children exist', async () => {
    const root = document.createElement('div');

    await mountApp(root);

    expect(clientMocks.createRoot).toHaveBeenCalledWith(root);
    expect(clientMocks.render).toHaveBeenCalledOnce();
    expect(clientMocks.hydrateRoot).not.toHaveBeenCalled();
  });
});
