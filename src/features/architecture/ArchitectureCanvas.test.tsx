import { useRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArchitectureCanvas } from './ArchitectureCanvas';
import { useReducedMotion } from './useReducedMotion';

const fitView = vi.hoisted(() => vi.fn());

vi.mock('@xyflow/react', async () => {
  const React = await import('react');

  return {
    Background: () => null,
    BackgroundVariant: { Dots: 'dots' },
    Controls: () => null,
    ReactFlow: ({
      children,
      onInit,
    }: {
      children?: React.ReactNode;
      onInit?: (instance: { fitView: typeof fitView }) => void;
    }) => {
      const initialOnInit = React.useRef(onInit);

      React.useEffect(() => {
        initialOnInit.current?.({ fitView });
      }, []);

      return <div>{children}</div>;
    },
  };
});

function CanvasHarness() {
  const reducedMotion = useReducedMotion();
  const fitRequest = useRef<() => void>(() => undefined);

  return (
    <>
      <ArchitectureCanvas
        nodes={[]}
        edges={[]}
        language="en"
        reducedMotion={reducedMotion}
        onFitReady={(fit) => {
          fitRequest.current = fit;
        }}
        onClearSelection={() => undefined}
      />
      <button type="button" onClick={() => fitRequest.current()}>
        Run fit
      </button>
    </>
  );
}

describe('ArchitectureCanvas fit behavior', () => {
  it('uses the current reduced-motion preference after React Flow initialized', async () => {
    let motionListener: ((event: MediaQueryListEvent) => void) | undefined;
    const mediaQuery = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(
        (_type: string, listener: EventListenerOrEventListenerObject) => {
          motionListener = listener as (event: MediaQueryListEvent) => void;
        },
      ),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } satisfies MediaQueryList;
    vi.spyOn(window, 'matchMedia').mockReturnValue(mediaQuery);
    const user = userEvent.setup();
    render(<CanvasHarness />);

    await user.click(screen.getByRole('button', { name: 'Run fit' }));
    expect(fitView).toHaveBeenLastCalledWith(
      expect.objectContaining({ duration: 320 }),
    );

    act(() => motionListener?.({ matches: true } as MediaQueryListEvent));
    await user.click(screen.getByRole('button', { name: 'Run fit' }));

    expect(fitView).toHaveBeenLastCalledWith(
      expect.objectContaining({ duration: 0 }),
    );
    expect(fitView).toHaveBeenCalledTimes(2);
  });
});
