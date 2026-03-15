"use client";

import { useEffect, useRef } from "react";

interface CanvasFractalGridProps {
  dotColor?: string;
  glowColor?: string;
  backgroundColor?: string;
  dotSpacing?: number;
  dotRadius?: number;
  rippleRadius?: number;
  className?: string;
}

export function CanvasFractalGrid({
  dotColor = "#C0C0C8",
  glowColor = "#4361EE",
  backgroundColor = "transparent",
  dotSpacing = 28,
  dotRadius = 1.5,
  rippleRadius = 100,
  className = "",
}: CanvasFractalGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function handleMouseLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    let rafId: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const cols = Math.ceil(canvas.width / dotSpacing) + 1;
      const rows = Math.ceil(canvas.height / dotSpacing) + 1;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * dotSpacing;
          const y = r * dotSpacing;
          const dist = Math.hypot(x - mx, y - my);
          const influence = Math.max(0, 1 - dist / rippleRadius);

          ctx.beginPath();
          ctx.arc(x, y, dotRadius + influence * 3, 0, Math.PI * 2);
          ctx.fillStyle =
            influence > 0.05
              ? `rgba(${hexToRgb(glowColor)},${0.3 + influence * 0.7})`
              : `rgba(${hexToRgb(dotColor)},0.4)`;
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [
    dotColor,
    glowColor,
    backgroundColor,
    dotSpacing,
    dotRadius,
    rippleRadius,
  ]);

  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} />;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
