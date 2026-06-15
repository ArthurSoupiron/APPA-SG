"use client";

import { useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
};

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type StarrySkyBackgroundProps = {
  className?: string;
};

export function StarrySkyBackground({ className }: StarrySkyBackgroundProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotionRef = useRef(false);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const paint: CanvasRenderingContext2D = maybeCtx;

    const container = wrap;
    const canvasEl = canvas;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onMotionChange = () => {
      reducedMotionRef.current = mq.matches;
    };
    mq.addEventListener("change", onMotionChange);

    let stars: Star[] = [];
    let raf = 0;
    let width = 0;
    let height = 0;
    let start = performance.now();

    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      if (width < 1 || height < 1) return;

      canvasEl.width = Math.floor(width * dpr);
      canvasEl.height = Math.floor(height * dpr);
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      paint.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(320, Math.floor((width * height) / 7500));
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: seededRandom(i * 3) * width,
          y: seededRandom(i * 3 + 1) * height,
          r: 0.35 + seededRandom(i * 3 + 2) * 1.15,
          baseAlpha: 0.12 + seededRandom(i * 7) * 0.5,
          twinkleSpeed: 0.4 + seededRandom(i * 11) * 1.8,
          phase: seededRandom(i * 13) * Math.PI * 2,
        });
      }
      start = performance.now();
    }

    function draw(t: number) {
      const elapsed = (t - start) / 1000;
      paint.fillStyle = "#030508";
      paint.fillRect(0, 0, width, height);

      const reduce = reducedMotionRef.current;

      for (const s of stars) {
        const twinkle = reduce ? 1 : 0.62 + 0.38 * Math.sin(elapsed * s.twinkleSpeed + s.phase);
        const alpha = s.baseAlpha * twinkle;
        paint.beginPath();
        paint.fillStyle = `rgba(210, 225, 255, ${alpha})`;
        paint.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        paint.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    layout();
    // Premier dessin synchrone quand les dimensions sont connues (évite d’attendre le 1er rAF).
    if (width > 0 && height > 0) {
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => {
      layout();
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mq.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={cn("pointer-events-none absolute inset-0 z-0 bg-[#030508]", className)}
      aria-hidden
    >
      <canvas ref={canvasRef} className="pointer-events-none block h-full w-full" aria-hidden />
    </div>
  );
}
