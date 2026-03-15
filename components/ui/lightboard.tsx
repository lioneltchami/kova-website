"use client";

import { useEffect, useRef } from "react";

interface LightboardProps {
  text: string;
  color?: string;
  backgroundColor?: string;
  dotSize?: number;
  gap?: number;
  speed?: number;
  className?: string;
}

// 5x7 dot matrix font (simplified, uppercase A-Z + space)
const FONT: Record<string, number[][]> = {
  " ": [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
  A: [
    [0, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
  ],
  B: [
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 0],
  ],
  C: [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [0, 1, 1],
  ],
  D: [
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 0],
  ],
  E: [
    [1, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  F: [
    [1, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
  ],
  G: [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
  ],
  H: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
  ],
  I: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  K: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 0],
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
  ],
  L: [
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  M: [
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
  ],
  N: [
    [1, 0, 1],
    [1, 1, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
  ],
  O: [
    [0, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
  ],
  P: [
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
  ],
  R: [
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 0],
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [0, 0, 1],
    [1, 1, 0],
  ],
  T: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
  ],
  U: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
  ],
  V: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
    [0, 1, 0],
  ],
  W: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
  ],
  X: [
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
  ],
  Y: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
  ],
  Z: [
    [1, 1, 1],
    [0, 0, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
};

export function Lightboard({
  text,
  color = "#4361EE",
  backgroundColor = "#0d0d0d",
  dotSize = 6,
  gap = 3,
  speed = 40,
  className = "",
}: LightboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rows = 7;
    const step = dotSize + gap;
    const chars = text
      .toUpperCase()
      .split("")
      .map((c) => FONT[c] || FONT[" "]);
    const totalCols = chars.reduce(
      (acc, _c, i) =>
        acc + (FONT[text[i]?.toUpperCase()] || FONT[" "])[0].length + 1,
      0,
    );
    const canvasW = canvas.width;
    const canvasH = step * rows;
    canvas.height = canvasH;

    let lastTime = 0;
    function draw(time: number) {
      if (!ctx || !canvas) return;
      if (time - lastTime > speed) {
        lastTime = time;
        offsetRef.current =
          (offsetRef.current + 1) % (totalCols * step + canvasW);
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasW, canvasH);

      let col = 0;
      for (const char of chars) {
        for (let r = 0; r < rows; r++) {
          const row = char[r] || [];
          for (let c = 0; c < row.length; c++) {
            const x = (col + c) * step - offsetRef.current + canvasW;
            const y = r * step;
            const on = row[c] === 1;
            ctx.beginPath();
            ctx.arc(
              x + dotSize / 2,
              y + dotSize / 2,
              dotSize / 2,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = on ? color : `${color}22`;
            ctx.fill();
          }
        }
        col += (char[0]?.length || 3) + 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, color, backgroundColor, dotSize, gap, speed]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      className={`w-full rounded-lg ${className}`}
      style={{ background: backgroundColor }}
    />
  );
}
