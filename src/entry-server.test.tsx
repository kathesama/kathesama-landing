import { describe, expect, it } from 'vitest';
import { render } from './entry-server';

describe('server entry', () => {
  it('waits for the lazy blog route and renders English article body HTML', async () => {
    const html = await render('/blog/juana-orchestration-layer?lang=en');

    expect(html).toContain('I Gave My Local AI a Brain');
    expect(html).toContain('Before your AI can answer anything');
    expect(html).not.toContain('Loading writing');
    expect(html).not.toContain('<div hidden');
  });
});
