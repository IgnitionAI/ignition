import { useRef, useEffect } from 'react';
import { useDemoStore } from './store';

const CELL = 50;
const PAD = 1;

export function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { grid, episodeCount, stepCount } = useDemoStore();

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const size = grid.gridSize;
    const w = size * CELL;
    ctx.canvas.width = w;
    ctx.canvas.height = w;

    // Background
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, w, w);

    // Grid lines
    ctx.strokeStyle = '#1e1e3a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, w);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(w, i * CELL);
      ctx.stroke();
    }

    // Trail (fading)
    const trailLen = grid.trail.length;
    grid.trail.forEach(([r, c], i) => {
      const alpha = 0.1 + 0.4 * (i / Math.max(trailLen, 1));
      ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
      ctx.fillRect(c * CELL + PAD, r * CELL + PAD, CELL - PAD * 2, CELL - PAD * 2);
    });

    // Target (green)
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(
      grid.targetCol * CELL + CELL / 2,
      grid.targetRow * CELL + CELL / 2,
      CELL / 3,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Agent (blue)
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(
      grid.agentCol * CELL + CELL / 2,
      grid.agentRow * CELL + CELL / 2,
      CELL / 3,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // HUD
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`Episode: ${episodeCount}  Step: ${stepCount}`, 6, w - 6);
  }, [grid, episodeCount, stepCount]);

  return <canvas ref={canvasRef} style={{ borderRadius: 8, border: '1px solid #333' }} />;
}
