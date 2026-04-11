import { useRef, useEffect } from 'react';
import { useDemoStore } from './store';

const W = 600;
const H = 300;
const SCALE = 100; // pixels per meter
const CART_W = 60;
const CART_H = 30;
const POLE_LEN = 100; // pixels
const RAIL_Y = H * 0.7;

export function CartPoleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { cartpole, episodeCount } = useDemoStore();

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.canvas.width = W;
    ctx.canvas.height = H;

    // Background
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, W, H);

    // Rail
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, RAIL_Y);
    ctx.lineTo(W - 20, RAIL_Y);
    ctx.stroke();

    // Cart position (centered on canvas)
    const cartX = W / 2 + cartpole.x * SCALE;

    // Cart (rectangle)
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(cartX - CART_W / 2, RAIL_Y - CART_H, CART_W, CART_H);

    // Pole (line from top of cart)
    const poleBaseX = cartX;
    const poleBaseY = RAIL_Y - CART_H;
    const poleTipX = poleBaseX + Math.sin(cartpole.theta) * POLE_LEN;
    const poleTipY = poleBaseY - Math.cos(cartpole.theta) * POLE_LEN;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(poleBaseX, poleBaseY);
    ctx.lineTo(poleTipX, poleTipY);
    ctx.stroke();

    // Pivot point
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(poleBaseX, poleBaseY, 4, 0, Math.PI * 2);
    ctx.fill();

    // HUD
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`Episode: ${episodeCount}  Steps: ${cartpole.stepCount}`, 8, 18);
    ctx.fillText(`Angle: ${(cartpole.theta * 180 / Math.PI).toFixed(1)}°`, 8, 34);
  }, [cartpole, episodeCount]);

  return <canvas ref={canvasRef} style={{ borderRadius: 8, border: '1px solid #333' }} />;
}
