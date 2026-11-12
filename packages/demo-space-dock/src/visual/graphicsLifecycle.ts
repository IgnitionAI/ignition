export type GraphicsState = 'checking' | 'available' | 'failed' | 'lost';

/** One initialization per Scene owner; failure and loss are terminal until remount. */
export function createGraphicsLifecycle(onChange: (state: GraphicsState) => void) {
  let state: GraphicsState = 'checking';
  let pending: Promise<void> | undefined;
  const fail = (reason: 'failed' | 'lost' = 'failed') => {
    if (state === 'failed' || state === 'lost') return;
    state = reason;
    onChange(state);
  };
  return {
    get state() { return state; },
    fail,
    start(initialize: () => void | Promise<void>) {
      if (pending || state !== 'checking') return pending ?? Promise.resolve();
      // Both synchronous construction errors and configure promise rejections are owned here.
      pending = Promise.resolve().then(initialize).then(() => {
        if (state === 'checking') { state = 'available'; onChange(state); }
      }).catch(() => fail());
      return pending;
    },
  };
}

/** Probe the real canvas once (at most two APIs), before constructing Three/Fiber. */
export function getGraphicsContext(canvas: HTMLCanvasElement) {
  const attributes = { antialias: true, alpha: true, powerPreference: 'high-performance' as const };
  const context = (canvas.getContext('webgl2', attributes) ?? canvas.getContext('webgl', attributes)) as WebGL2RenderingContext | WebGLRenderingContext | null;
  if (!context) throw new Error('WebGL context unavailable');
  return context;
}

export function observeContextLoss(canvas: EventTarget, onLoss: () => void) {
  const loss = (event: Event) => { event.preventDefault(); onLoss(); };
  canvas.addEventListener('webglcontextlost', loss);
  return () => canvas.removeEventListener('webglcontextlost', loss);
}
