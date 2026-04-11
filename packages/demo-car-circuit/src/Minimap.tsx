import { useRef, useEffect } from 'react';
import { OvalTrack } from './track';
import { useDemoStore } from './store';

const track = new OvalTrack(10, 4, 2);
const SIZE = 150;
const PAD = 15;

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { carX, carY, mode } = useDemoStore();

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.canvas.width = SIZE;
    ctx.canvas.height = SIZE;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 26, 0.8)';
    ctx.fillRect(0, 0, SIZE, SIZE);

    const scaleX = (SIZE - PAD * 2) / 18;
    const scaleY = (SIZE - PAD * 2) / 16;
    const scale = Math.min(scaleX, scaleY);
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    const toCanvas = (wx: number, wy: number): [number, number] => [
      cx + wx * scale,
      cy - wy * scale,
    ];

    // Draw track outline
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const wps = track.waypoints;
    const [sx, sy] = toCanvas(wps[0].x, wps[0].y);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < wps.length; i++) {
      const [px, py] = toCanvas(wps[i].x, wps[i].y);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Car dot
    const [dx, dy] = toCanvas(carX, carY);
    ctx.fillStyle = mode === 'inference' ? '#3b82f6' : mode === 'training' ? '#22c55e' : '#888';
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [carX, carY, mode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: SIZE,
        height: SIZE,
        borderRadius: 10,
        border: '1px solid rgba(99, 102, 241, 0.3)',
        pointerEvents: 'none',
      }}
    />
  );
}
