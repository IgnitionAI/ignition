import { useRef, useEffect } from 'react';
import { useDemoStore } from './store';

const W = 600;
const H = 300;
const PAD = 40;

function valleyHeight(x: number): number {
  return Math.sin(3 * x);
}

function toCanvas(pos: number, h: number): [number, number] {
  const cx = PAD + ((pos - (-1.2)) / (0.6 - (-1.2))) * (W - PAD * 2);
  const cy = H - PAD - ((h - (-1)) / (1 - (-1))) * (H - PAD * 2);
  return [cx, cy];
}

export function MountainCarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { position, episodeCount, stepCount } = useDemoStore();

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.canvas.width = W;
    ctx.canvas.height = H;

    // Background
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, W, H);

    // Valley curve
    ctx.beginPath();
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 200; i++) {
      const p = -1.2 + (i / 200) * 1.8;
      const [cx, cy] = toCanvas(p, valleyHeight(p));
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Fill below curve
    const [lastX, lastY] = toCanvas(0.6, valleyHeight(0.6));
    ctx.lineTo(lastX, H);
    const [firstX] = toCanvas(-1.2, valleyHeight(-1.2));
    ctx.lineTo(firstX, H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(74, 85, 104, 0.15)';
    ctx.fill();

    // Flag at goal (0.5)
    const goalH = valleyHeight(0.5);
    const [flagX, flagY] = toCanvas(0.5, goalH);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(flagX, flagY);
    ctx.lineTo(flagX, flagY - 30);
    ctx.stroke();
    // Flag triangle
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(flagX, flagY - 30);
    ctx.lineTo(flagX + 15, flagY - 22);
    ctx.lineTo(flagX, flagY - 14);
    ctx.fill();

    // Car
    const carH = valleyHeight(position);
    const [carX, carY] = toCanvas(position, carH);
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(carX, carY - 6, 8, 0, Math.PI * 2);
    ctx.fill();
    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(carX - 5, carY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carX + 5, carY, 3, 0, Math.PI * 2);
    ctx.fill();

    // HUD
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`Episode: ${episodeCount}  Steps: ${stepCount}`, 8, 18);
  }, [position, episodeCount, stepCount]);

  return <canvas ref={canvasRef} style={{ borderRadius: 8, border: '1px solid #333' }} />;
}
