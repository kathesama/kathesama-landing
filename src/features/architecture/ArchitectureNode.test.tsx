import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactFlowProvider, type NodeProps } from '@xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { ArchitectureNode } from './ArchitectureNode';
import type { ArchitectureGraphNode } from './architectureGraph';
import architectureCss from './architecture.css?raw';

function renderNode(visualState: 'resting' | 'active' | 'dimmed' = 'resting') {
  const props = {
    id: 'planner',
    type: 'architecture',
    data: {
      label: 'Planning',
      description: 'Chooses the next safe step',
      capability: 'Decomposes intent into bounded work',
      category: 'orchestration',
      categoryLabel: 'Orchestration',
      evidence: 'verified',
      evidenceLabel: 'Verified',
      visualState,
    },
    selected: visualState === 'active',
    dragging: false,
    draggable: false,
    selectable: true,
    deletable: false,
    zIndex: 0,
    isConnectable: false,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  } as unknown as NodeProps<ArchitectureGraphNode>;

  return render(
    <ReactFlowProvider>
      <ArchitectureNode {...props} />
    </ReactFlowProvider>,
  );
}

function renderPositionedNode(anchorLeft: number) {
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });

  const result = render(
    <div className="architecture-canvas">
      <div className="react-flow__node">
        <ReactFlowProvider>
          <ArchitectureNode
            {...({
              id: `node-${anchorLeft}`,
              type: 'architecture',
              data: {
                label: 'Planning',
                description: 'Chooses the next safe step',
                capability: 'Decomposes intent into bounded work',
                category: 'orchestration',
                categoryLabel: 'Orchestration',
                evidence: 'verified',
                evidenceLabel: 'Verified',
                visualState: 'resting',
              },
              selected: false,
            } as unknown as NodeProps<ArchitectureGraphNode>)}
          />
        </ReactFlowProvider>
      </div>
    </div>,
  );
  const canvas = result.container.querySelector('.architecture-canvas') as HTMLElement;
  const wrapper = result.container.querySelector('.react-flow__node') as HTMLElement;
  const article = screen.getByRole('article');
  const tooltip = screen.getByRole('tooltip');
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    ...canvas.getBoundingClientRect(),
    left: 0,
    right: 320,
    top: 0,
    bottom: 600,
    width: 320,
    height: 600,
  });
  vi.spyOn(article, 'getBoundingClientRect').mockReturnValue({
    ...article.getBoundingClientRect(),
    left: anchorLeft,
    right: anchorLeft + 64,
    top: 120,
    bottom: 200,
    width: 64,
    height: 80,
  });
  vi.spyOn(tooltip, 'getBoundingClientRect').mockReturnValue({
    ...tooltip.getBoundingClientRect(),
    width: 280,
    height: 110,
  });

  return {
    ...result,
    wrapper,
    tooltip,
    restoreViewport() {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight });
    },
  };
}

describe('ArchitectureNode', () => {
  it('renders the label, evidence stamp, capability, and an accessible tooltip relation', () => {
    renderNode();

    const plate = screen.getByRole('article');
    const tooltip = screen.getByRole('tooltip');
    expect(plate).toHaveTextContent('Planning');
    expect(plate).toHaveTextContent('Verified');
    expect(plate).toHaveTextContent('Decomposes intent into bounded work');
    expect(plate).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent('Chooses the next safe step');
  });

  it('keeps tooltip content in the accessibility tree when the node is visually dimmed', () => {
    renderNode('dimmed');

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('reveals a tooltip only for the focused, hovered, or individually selected node', () => {
    renderNode('active');

    expect(screen.getByRole('tooltip')).toHaveAttribute('data-visible', 'true');
  });

  it('keeps capability text complete for assistive technology while clipping it to one visual line', () => {
    renderNode();

    expect(screen.getByRole('article')).toHaveTextContent(
      'Decomposes intent into bounded work',
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Decomposes intent into bounded work',
    );
    expect(architectureCss).toMatch(
      /\.architecture-node__capability\s*{[\s\S]*?white-space:\s*nowrap;[\s\S]*?overflow:\s*hidden;[\s\S]*?text-overflow:\s*ellipsis;/,
    );
  });

  it('keeps a four-line keyboard guide in normal flow on a 320px viewport', () => {
    expect(architectureCss).toMatch(
      /\.architecture-keyboard-guide\s*{[\s\S]*?position:\s*static;[\s\S]*?white-space:\s*normal;[\s\S]*?text-overflow:\s*clip;/,
    );
    expect(architectureCss).not.toMatch(
      /\.architecture-canvas-shell\s*{[^}]*padding-top/,
    );
    expect(architectureCss).not.toMatch(
      /@media\s*\(max-width:\s*640px\)[\s\S]*?\.architecture-canvas-shell\s*{[^}]*padding-top/,
    );
  });

  it.each([0, 256])(
    'keeps a measured tooltip inside a 320px canvas when its node starts at x=%i',
    async (anchorLeft) => {
      const { wrapper, tooltip, restoreViewport } = renderPositionedNode(anchorLeft);

      fireEvent.mouseEnter(wrapper);

      await waitFor(() => expect(tooltip).toHaveAttribute('data-visible', 'true'));
      expect(tooltip).toHaveAttribute('data-positioned', 'true');
      const left = Number.parseFloat(tooltip.style.left);
      const width = Number.parseFloat(tooltip.style.width);
      expect(left).toBeGreaterThanOrEqual(8);
      expect(left + width).toBeLessThanOrEqual(312);
      expect(tooltip.style.position).toBe('fixed');
      restoreViewport();
    },
  );

  it('observes both the anchor and canvas so viewport reflow cannot leave stale coordinates', () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const { container, wrapper, restoreViewport } = renderPositionedNode(64);
    const canvas = container.querySelector('.architecture-canvas');
    const article = screen.getByRole('article');

    fireEvent.mouseEnter(wrapper);

    expect(observe).toHaveBeenCalledWith(article);
    expect(observe).toHaveBeenCalledWith(canvas);
    restoreViewport();
  });
});
