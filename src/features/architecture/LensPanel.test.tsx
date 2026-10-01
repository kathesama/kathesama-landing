import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { publicArchitecture } from '../../content/architecture';
import { LensPanel } from './LensPanel';

describe('LensPanel', () => {
  it('renders localized summary, sections, and related flows', () => {
    const lens = publicArchitecture.lenses.find(({ id }) => id === 'trust')!;
    render(
      <LensPanel
        language="es"
        lens={lens}
        flows={publicArchitecture.flows}
        onSelectFlow={() => undefined}
      />,
    );

    const panel = screen.getByRole('region', { name: lens.title.es });
    expect(within(panel).getByRole('heading', { name: lens.title.es })).toBeVisible();
    expect(within(panel).getByText(lens.summary.es)).toBeVisible();
    for (const section of lens.sections) {
      expect(within(panel).getByRole('heading', { name: section.title.es })).toBeVisible();
      expect(within(panel).getByText(section.body.es)).toBeVisible();
    }
    for (const flowId of lens.flowIds) {
      const flow = publicArchitecture.flows.find(({ id }) => id === flowId)!;
      expect(within(panel).getByRole('link', { name: flow.title.es })).toBeVisible();
    }
  });

  it('allows a related flow to become the stronger selection', async () => {
    const user = userEvent.setup();
    const onSelectFlow = vi.fn();
    const lens = publicArchitecture.lenses.find(({ id }) => id === 'request-lifecycle')!;
    const flow = publicArchitecture.flows.find(({ id }) => id === lens.flowIds[0])!;
    render(
      <LensPanel
        language="en"
        lens={lens}
        flows={publicArchitecture.flows}
        onSelectFlow={onSelectFlow}
      />,
    );

    await user.click(screen.getByRole('link', { name: flow.title.en }));
    expect(onSelectFlow).toHaveBeenCalledWith(flow.id);
  });
});
