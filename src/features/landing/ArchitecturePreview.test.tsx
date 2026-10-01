/// <reference types="vite/client" />

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../App';

function renderPreview(language: 'en' | 'es') {
  return render(
    <MemoryRouter initialEntries={[`/?lang=${language}`]}>
      <App />
    </MemoryRouter>,
  );
}

describe('ArchitecturePreview', () => {
  it.each([
    [
      'en',
      'Follow one request through JuanaIA',
      'SYSTEMS ATLAS · PUBLIC EDITION',
      'Open the systems atlas',
    ],
    [
      'es',
      'Seguí una solicitud a través de JuanaIA',
      'ATLAS DE SISTEMAS · EDICIÓN PÚBLICA',
      'Abrir el atlas de sistemas',
    ],
  ] as const)(
    'renders the %s architecture field note and preserves its language in the CTA',
    (language, regionName, eyebrow, action) => {
      renderPreview(language);

      const preview = screen.getByRole('region', { name: regionName });

      expect(within(preview).getByText(eyebrow)).toBeVisible();
      expect(within(preview).getByRole('link', { name: action })).toHaveAttribute(
        'href',
        `/architecture?lang=${language}`,
      );
    },
  );

  it('uses only the five editorial stops from the primary flow', () => {
    renderPreview('en');

    const preview = screen.getByTestId('architecture-preview');
    const stopIds = Array.from(
      preview.querySelectorAll<HTMLElement>('[data-node-id]'),
      (element) => element.dataset.nodeId,
    );

    expect(stopIds).toEqual(['person', 'gateway', 'soul', 'planner', 'inference']);
    expect(within(preview).queryByLabelText(/interactive public architecture map/i)).not.toBeInTheDocument();
  });

  it('names the four editorial layers', () => {
    renderPreview('en');

    const preview = screen.getByTestId('architecture-preview');
    for (const layer of ['Experience', 'Orchestration', 'Intelligence', 'Context']) {
      expect(within(preview).getByText(layer)).toBeVisible();
    }
  });

  it('hides the decorative illustration and exposes an equivalent ordered summary', () => {
    renderPreview('en');

    const preview = screen.getByTestId('architecture-preview');
    const illustration = preview.querySelector('svg');
    const summary = within(preview).getByText(
      'Person to Experience gateway to Conversation core to Planning to Language intelligence.',
    );

    expect(illustration).toHaveAttribute('aria-hidden', 'true');
    expect(summary).toHaveClass('visually-hidden');
  });

  it('does not add React Flow to the landing preview dependency graph', () => {
    const previewSources = import.meta.glob('./ArchitecturePreview.tsx', {
      eager: true,
      import: 'default',
      query: '?raw',
    }) as Record<string, string>;
    const previewSource = Object.values(previewSources)[0] ?? '';

    expect(previewSource).not.toBe('');
    expect(previewSource).not.toContain('@xyflow/react');
  });
});
