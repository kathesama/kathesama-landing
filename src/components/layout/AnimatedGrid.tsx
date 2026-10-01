import { useEffect, useRef } from 'react';

export function AnimatedGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) return;

    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    let reduceMotion = motionPreference.matches;
    let animationFrameId: number | null = null;
    let frame = 0;
    let cssWidth = 0;
    let cssHeight = 0;

    const renderFrame = () => {
      context.clearRect(0, 0, cssWidth, cssHeight);

      for (let x = 0; x <= cssWidth; x += 60) {
        for (let y = 0; y <= cssHeight; y += 60) {
          const alpha = reduceMotion
            ? 0.13
            : 0.08 + 0.05 * Math.sin(frame / 45 + (x + y) / 80);

          context.beginPath();
          context.arc(x, y, 1.2, 0, Math.PI * 2);
          context.fillStyle = `rgba(0, 229, 192, ${alpha})`;
          context.fill();
        }
      }
    };

    const tick = () => {
      animationFrameId = null;
      if (reduceMotion) return;

      renderFrame();
      frame += 1;
      animationFrameId = window.requestAnimationFrame(tick);
    };

    const stopAnimation = () => {
      if (animationFrameId === null) return;

      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    };

    const startAnimation = () => {
      if (reduceMotion || animationFrameId !== null) return;

      animationFrameId = window.requestAnimationFrame(tick);
    };

    const resize = () => {
      const pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.width = Math.round(cssWidth * pixelRatio);
      canvas.height = Math.round(cssHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      renderFrame();
    };

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
      renderFrame();

      if (reduceMotion) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    resize();
    startAnimation();
    window.addEventListener('resize', resize);
    motionPreference.addEventListener('change', handleMotionPreferenceChange);

    return () => {
      window.removeEventListener('resize', resize);
      motionPreference.removeEventListener('change', handleMotionPreferenceChange);
      stopAnimation();
    };
  }, []);

  return <canvas ref={canvasRef} id="canvas" aria-hidden="true" />;
}
