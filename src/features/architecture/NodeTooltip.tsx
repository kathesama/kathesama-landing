import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type NodeTooltipProps = {
  id: string;
  description: string;
  capability: string;
  selected: boolean;
};

type TooltipPosition = {
  left: number;
  top: number;
  width: number;
  positioned: boolean;
};

const viewportMargin = 8;
const tooltipGap = 10;
const preferredWidth = 288;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function NodeTooltip({
  id,
  description,
  capability,
  selected,
}: NodeTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [interacting, setInteracting] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({
    left: viewportMargin,
    top: viewportMargin,
    width: preferredWidth,
    positioned: false,
  });
  const visible = selected || interacting;

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const anchor = document.querySelector<HTMLElement>(`[data-tooltip-anchor="${id}"]`);
    const interactionTarget = anchor?.closest<HTMLElement>('.react-flow__node') ?? anchor;
    if (!interactionTarget) return undefined;

    const show = () => setInteracting(true);
    const hide = () => setInteracting(false);
    const handleFocusOut = (event: FocusEvent) => {
      if (!interactionTarget.contains(event.relatedTarget as Node | null)) hide();
    };

    interactionTarget.addEventListener('mouseenter', show);
    interactionTarget.addEventListener('mouseleave', hide);
    interactionTarget.addEventListener('focusin', show);
    interactionTarget.addEventListener('focusout', handleFocusOut);

    return () => {
      interactionTarget.removeEventListener('mouseenter', show);
      interactionTarget.removeEventListener('mouseleave', hide);
      interactionTarget.removeEventListener('focusin', show);
      interactionTarget.removeEventListener('focusout', handleFocusOut);
    };
  }, [id]);

  useLayoutEffect(() => {
    if (!visible || typeof document === 'undefined') return undefined;

    const anchor = document.querySelector<HTMLElement>(`[data-tooltip-anchor="${id}"]`);
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return undefined;
    const canvas = anchor.closest<HTMLElement>('.architecture-canvas');

    const placeTooltip = () => {
      const anchorRect = anchor.getBoundingClientRect();
      const canvasRect = canvas?.getBoundingClientRect();
      const leftBoundary = Math.max(viewportMargin, (canvasRect?.left ?? 0) + viewportMargin);
      const rightBoundary = Math.min(
        window.innerWidth - viewportMargin,
        (canvasRect?.right ?? window.innerWidth) - viewportMargin,
      );
      const topBoundary = Math.max(viewportMargin, (canvasRect?.top ?? 0) + viewportMargin);
      const bottomBoundary = Math.min(
        window.innerHeight - viewportMargin,
        (canvasRect?.bottom ?? window.innerHeight) - viewportMargin,
      );

      if (
        rightBoundary <= leftBoundary ||
        bottomBoundary <= topBoundary ||
        anchorRect.right < leftBoundary ||
        anchorRect.left > rightBoundary ||
        anchorRect.bottom < topBoundary ||
        anchorRect.top > bottomBoundary
      ) {
        setPosition((current) => ({ ...current, positioned: false }));
        return;
      }

      const width = Math.max(0, Math.min(preferredWidth, rightBoundary - leftBoundary));
      const tooltipHeight = tooltip.getBoundingClientRect().height;
      const left = clamp(
        anchorRect.left + anchorRect.width / 2 - width / 2,
        leftBoundary,
        rightBoundary - width,
      );
      const below = anchorRect.bottom + tooltipGap;
      const above = anchorRect.top - tooltipGap - tooltipHeight;
      const top = clamp(
        below + tooltipHeight <= bottomBoundary ? below : above,
        topBoundary,
        bottomBoundary - tooltipHeight,
      );

      setPosition({ left, top, width, positioned: true });
    };

    placeTooltip();
    const resizeObserver =
      typeof ResizeObserver === 'function' ? new ResizeObserver(placeTooltip) : null;
    resizeObserver?.observe(anchor);
    if (canvas) resizeObserver?.observe(canvas);
    window.addEventListener('resize', placeTooltip);
    window.addEventListener('scroll', placeTooltip, true);
    window.visualViewport?.addEventListener('resize', placeTooltip);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', placeTooltip);
      window.removeEventListener('scroll', placeTooltip, true);
      window.visualViewport?.removeEventListener('resize', placeTooltip);
    };
  }, [id, visible]);

  const tooltip = (
    <div
      ref={tooltipRef}
      className="architecture-node__tooltip"
      data-positioned={position.positioned ? 'true' : 'false'}
      data-visible={visible ? 'true' : 'false'}
      id={id}
      role="tooltip"
      style={{
        position: 'fixed',
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
      }}
    >
      <p>{description}</p>
      <p className="architecture-node__tooltip-capability">{capability}</p>
    </div>
  );

  return typeof document === 'undefined' ? tooltip : createPortal(tooltip, document.body);
}
