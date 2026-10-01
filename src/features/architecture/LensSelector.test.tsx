import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { publicArchitecture } from '../../content/architecture';
import { LensSelector } from './LensSelector';

describe('LensSelector', () => {
  it('offers every public lens in a labelled native control', () => {
    render(
      <LensSelector
        language="en"
        lenses={publicArchitecture.lenses}
        selectedLensId="layers"
        onSelectLens={() => undefined}
      />,
    );

    const selector = screen.getByRole('combobox', { name: 'Architecture lens' });
    expect(selector).toHaveAttribute('aria-controls', 'architecture-lens-panel');
    expect(screen.getAllByRole('option')).toHaveLength(publicArchitecture.lenses.length);
    expect(selector).toHaveValue('layers');
  });

  it('supports keyboard selection and leaves the narrative next in tab order', async () => {
    const user = userEvent.setup();
    const onSelectLens = vi.fn();
    render(
      <>
        <LensSelector
          language="es"
          lenses={publicArchitecture.lenses}
          selectedLensId="layers"
          onSelectLens={onSelectLens}
        />
        <section id="architecture-lens-panel" tabIndex={0} aria-label="Narrativa">
          Narrativa
        </section>
      </>,
    );

    const selector = screen.getByRole('combobox', { name: 'Lente de arquitectura' });
    await user.tab();
    expect(selector).toHaveFocus();
    await user.selectOptions(selector, 'trust');
    expect(onSelectLens).toHaveBeenCalledWith('trust');
    await user.tab();
    expect(screen.getByRole('region', { name: 'Narrativa' })).toHaveFocus();
  });
});
