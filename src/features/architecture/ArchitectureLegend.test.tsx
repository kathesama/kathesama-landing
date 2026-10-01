import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArchitectureLegend } from './ArchitectureLegend';
import { architectureCopy } from './architectureCopy';
import { architectureEdgeTypes } from './architecture.types';
import architectureCss from './architecture.css?raw';

describe('ArchitectureLegend visual semantics', () => {
  it('shows a real visual sample and equivalent accessible text for all six edge styles', () => {
    render(<ArchitectureLegend language="en" />);

    for (const semantic of architectureEdgeTypes) {
      const sample = document.querySelector(`[data-edge-sample="${semantic}"]`);
      expect(sample).toBeInTheDocument();
      expect(sample).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByText(architectureCopy.en.edgeTypes[semantic])).toBeVisible();
      expect(screen.getByText(architectureCopy.en.edgeDescriptions[semantic])).toBeVisible();
    }

    expect(document.querySelector('[data-edge-sample="trust"] svg')).toBeInTheDocument();
  });

  it('encodes the exact color and line-style contract in the canvas and legend', () => {
    expect(architectureCss).toMatch(
      /architecture-edge--stream[\s\S]*?stroke:\s*var\(--teal\)/,
    );
    expect(architectureCss).toMatch(
      /architecture-edge--async[\s\S]*?stroke-dasharray:\s*8 6/,
    );
    expect(architectureCss).toMatch(
      /architecture-edge--data[\s\S]*?stroke:\s*#65c58e/,
    );
    expect(architectureCss).toMatch(
      /architecture-edge--telemetry[\s\S]*?stroke-dasharray:\s*2 7/,
    );
    expect(architectureCss).toMatch(
      /architecture-edge--trust[\s\S]*?stroke:\s*var\(--gold\)/,
    );
    expect(architectureCss).toMatch(
      /architecture-legend__edge-sample--sync[\s\S]*?border-top-style:\s*solid/,
    );
    expect(architectureCss).toMatch(
      /architecture-legend__edge-sample--stream[\s\S]*?border-top-color:\s*var\(--teal\)/,
    );
    expect(architectureCss).toMatch(
      /architecture-legend__edge-sample--async[\s\S]*?border-top-style:\s*dashed/,
    );
    expect(architectureCss).toMatch(
      /architecture-legend__edge-sample--data[\s\S]*?border-top-color:\s*#65c58e/,
    );
    expect(architectureCss).toMatch(
      /architecture-legend__edge-sample--trust[\s\S]*?border-top-color:\s*var\(--gold\)/,
    );
    expect(architectureCss).toMatch(
      /architecture-legend__edge-sample--telemetry[\s\S]*?border-top-style:\s*dotted/,
    );
    expect(architectureCss).toMatch(
      /architecture-trust-label\s*\{[\s\S]*?transition:\s*opacity 150ms ease/,
    );
    expect(architectureCss).toMatch(
      /architecture-trust-label--resting\s*\{[\s\S]*?opacity:\s*0\.82/,
    );
    expect(architectureCss).toMatch(
      /architecture-trust-label--active\s*\{[\s\S]*?opacity:\s*1/,
    );
    expect(architectureCss).toMatch(
      /architecture-trust-label--dimmed\s*\{[\s\S]*?opacity:\s*0\.14/,
    );
  });
});
