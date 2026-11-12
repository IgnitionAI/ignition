import { Component, useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { createRoot, extend, useFrame, useThree } from '@react-three/fiber';
import type { ReconcilerRoot } from '@react-three/fiber';
import * as THREE from 'three';
import { createGraphicsLifecycle, getGraphicsContext, observeContextLoss } from './visual/graphicsLifecycle';
import type { GraphicsState } from './visual/graphicsLifecycle';
import { ACESFilmicToneMapping, Group, PerspectiveCamera } from 'three';
import type { SceneProps } from './simulation-contract';
import { cameraFrame } from './visual/mobileCamera';
import { StaticHangar } from './visual/StaticHangar';
import { MechanicalModel } from './visual/MechanicalModel';
import { IndustrialSolid, HangarFloor } from './visual/Industrial';
import { ContactBeacon, CommandBeacon } from './visual/DockingFeedback';
import { initialSignals } from './visual/signals';
import type { Signals } from './visual/signals';
import type { ModelKind } from './visual/modelConfig';
import type { AssetStatus } from './visual/useGLB';
import type { MutableRefObject } from 'react';

extend({
  Group, Mesh: THREE.Mesh, Color: THREE.Color, AmbientLight: THREE.AmbientLight,
  HemisphereLight: THREE.HemisphereLight, DirectionalLight: THREE.DirectionalLight,
  PointLight: THREE.PointLight, BoxGeometry: THREE.BoxGeometry, SphereGeometry: THREE.SphereGeometry,
  CylinderGeometry: THREE.CylinderGeometry, PlaneGeometry: THREE.PlaneGeometry,
  GridHelper: THREE.GridHelper, MeshStandardMaterial: THREE.MeshStandardMaterial,
});

type Statuses = Record<ModelKind, AssetStatus>;
class GraphicsBoundary extends Component<{ children: ReactNode; onError: () => void }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onError(); }
  render() { return this.state.error ? null : this.props.children; }
}

function World({ env, compact, reducedMotion, signals, statuses, onStatus, onHangarStatus }: SceneProps & {
  signals: MutableRefObject<Signals>; statuses: Statuses; onHangarStatus: (status: AssetStatus) => void; onStatus: (kind: ModelKind, status: AssetStatus) => void;
}) {
  const drone = useRef<Group>(null), cargo = useRef<Group>(null);
  const { camera, size } = useThree();
  const generation = useRef(-1);
  useEffect(() => {
    if (camera instanceof PerspectiveCamera) { camera.fov = compact ? 48 : 43; camera.updateProjectionMatrix(); }
  }, [camera, compact]);
  useFrame((_, delta) => {
    // Read current bodies afresh; no Rapier handle survives generation/reset.
    const state = env.telemetry;
    signals.current = { generation: env.generation, action: state.action, outcome: state.outcome, contacts: state.contacts, torque: state.torque };
    const droneBody = env.drone, cargoBody = env.cargo;
    const d = droneBody.translation(), c = cargoBody.translation();
    drone.current?.position.set(d.x, d.y, d.z); cargo.current?.position.set(c.x, c.y, c.z);
    const dr = droneBody.rotation(), cr = cargoBody.rotation();
    drone.current?.quaternion.set(dr.x, dr.y, dr.z, dr.w); cargo.current?.quaternion.set(cr.x, cr.y, cr.z, cr.w);
    const frame = cameraFrame(c, d, env.goal, size.width, size.height, compact);
    if (reducedMotion || generation.current !== env.generation) camera.position.copy(frame.position);
    else camera.position.lerp(frame.position, Math.min(1, delta * 5));
    camera.lookAt(frame.target); generation.current = env.generation;
  }, -1);
  return <>
    <color attach="background" args={['#09131b']} />
    <ambientLight intensity={.65} />
    <hemisphereLight args={['#b5d9ed', '#25333a', 1.1]} />
    <directionalLight position={[-4, 13, 6]} intensity={3.2} castShadow={!compact} shadow-mapSize={[1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-far={40} shadow-normalBias={.04} />
    <pointLight position={[6, 5, -2]} intensity={35} distance={18} color="#e8b66b" />
    <HangarFloor />
    <StaticHangar compact={compact} onStatus={onHangarStatus} />
    {env.solids.map(solid => <IndustrialSolid key={solid.id} solid={solid} />)}
    <MechanicalModel ref={cargo} kind="cargo" compact={compact} reducedMotion={reducedMotion} signals={signals} status={statuses.cargo} onStatus={onStatus} />
    <group ref={drone}>
      <MechanicalModel kind="drone" compact={compact} reducedMotion={reducedMotion} signals={signals} status={statuses.drone} onStatus={onStatus} />
      <ContactBeacon signals={signals} reducedMotion={reducedMotion} /><CommandBeacon signals={signals} />
      {/* Fixed, massless linkage already exists in simulation; this is decoration. */}
      <mesh position={[-1.05, 0, 0]}><boxGeometry args={[.5, .08, .08]} /><meshStandardMaterial color="#8d9ba1" metalness={.8} roughness={.4} /></mesh>
    </group>
    <MechanicalModel kind="dock" position={[env.goal.x, -.65, env.goal.z]} compact={compact} reducedMotion={reducedMotion} signals={signals} status={statuses.dock} onStatus={onStatus} />
  </>;
}

export default function Scene(props: SceneProps) {
  const signals = useRef(initialSignals());
  const [statuses, setStatuses] = useState<Statuses>({ drone: 'loading', cargo: 'loading', dock: 'loading' });
  const [hangarStatus, setHangarStatus] = useState<AssetStatus>('loading');
  const [graphics, setGraphics] = useState<GraphicsState>('checking');
  const [lifecycle] = useState(() => createGraphicsLifecycle(setGraphics));
  const canvas = useRef<HTMLCanvasElement>(null);
  const disposeGraphics = useRef(() => {});
  const [root, setRoot] = useState<ReconcilerRoot<HTMLCanvasElement> | null>(null);
  // App republishes simulation ticks and reset; read this generation's snapshot on render.
  const telemetry = props.env.telemetry;
  const summary = telemetry ? `${telemetry.outcome} · contacts ${telemetry.contacts} · action ${telemetry.action}` : 'Simulation textuelle active.';
  const onStatus = useCallback((kind: ModelKind, status: AssetStatus) => setStatuses(previous => ({ ...previous, [kind]: status })), []);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let sceneRoot: ReconcilerRoot<HTMLCanvasElement> | undefined;
    let observer: ResizeObserver | undefined;
    const stopObservingLoss = observeContextLoss(element, () => lifecycle.fail('lost'));
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      stopObservingLoss();
      sceneRoot?.unmount();
      renderer?.dispose();
    };
    disposeGraphics.current = dispose;
    // Defer past StrictMode's effect replay: the cancelled setup never creates a context.
    void Promise.resolve().then(() => {
      if (cancelled) return;
      return lifecycle.start(async () => {
        const context = getGraphicsContext(element);
        renderer = new THREE.WebGLRenderer({ canvas: element, context, antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.toneMapping = ACESFilmicToneMapping;
        sceneRoot = createRoot(element);
        const size = () => {
          const rect = element.parentElement!.getBoundingClientRect();
          return { width: rect.width, height: rect.height, top: 0, left: 0 };
        };
        await sceneRoot.configure({ gl: renderer, size: size(), camera: { position: [-5, 23, 20], near: .1, far: 160 } });
        if (cancelled || lifecycle.state !== 'checking') { dispose(); return; }
        setRoot(sceneRoot);
        observer = new ResizeObserver(() => {
          if (lifecycle.state !== 'available' || cancelled) return;
          void sceneRoot!.configure({ size: size() }).catch(() => lifecycle.fail());
        });
        observer.observe(element.parentElement!);
      });
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [lifecycle]);
  useEffect(() => {
    if (!root || graphics !== 'available') return;
    let current = true;
    void root.configure({ shadows: !props.compact, dpr: props.compact ? [1, 1.25] : [1, 1.75] }).then(() => {
      if (current && lifecycle.state === 'available') root.render(<GraphicsBoundary onError={() => lifecycle.fail()}>
        <World {...props} signals={signals} statuses={statuses} onStatus={onStatus} onHangarStatus={setHangarStatus} />
      </GraphicsBoundary>);
    }).catch(() => lifecycle.fail());
    return () => { current = false; };
  }, [root, graphics, props, statuses, onStatus, lifecycle]);
  useEffect(() => {
    if (graphics === 'failed' || graphics === 'lost') disposeGraphics.current();
  }, [graphics, root]);
  // Keep the accepted closed composition (24px summary + 4px padding). More
  // disclosure text extends the scroll flow instead of consuming render height.
  // Percent basis still follows the real viewport; ResizeObserver remains live.
  return <section aria-label="Vue 3D du dock spatial" style={{ position: 'relative', display: props.compact ? 'flex' : 'block', flexDirection: 'column', width: '100%', height: '100%', minHeight: props.compact ? 320 : 460, overflowY: props.compact ? 'auto' : undefined }}>
    <div style={{ position: 'relative', flex: props.compact ? '0 0 calc(100% - 28px)' : '1 1 0', minHeight: 0, height: props.compact ? undefined : '100%' }}>
      <GraphicsSurface state={graphics}>
        <canvas ref={canvas} style={{ display: 'block', width: '100%', height: '100%' }} />
      </GraphicsSurface>
    </div>
    <SceneSummary compact={props.compact} summary={summary} graphics={graphics} hangarStatus={hangarStatus} statuses={statuses} />
  </section>;
}

/** Native disclosure stays in layout on compact screens; alerts never hide inside it. */
export function SceneSummary({ compact, summary, graphics, hangarStatus, statuses }: {
  compact: boolean; summary: string; graphics: GraphicsState; hangarStatus: AssetStatus; statuses: Statuses;
}) {
  const fallback = Object.entries(statuses).filter(([, status]) => status === 'NONFINAL').map(([kind]) => kind);
  const guide = <p style={{ margin: 0 }}>Liaison fixe déjà établie. Rouge : contact général ; ambre : contre-poussée ; cyan/violet : lacet.</p>;
  const alerts = <>
    {hangarStatus === 'NONFINAL' && <HangarStatus graphics={graphics} status={hangarStatus} />}
    {graphics === 'available' && fallback.length > 0 && <p role="alert">NONFINAL — GLB absent : {fallback.join(', ')}. Repli géométrique provisoire.</p>}
  </>;
  const loading = graphics === 'available' && Object.values(statuses).some(status => status === 'loading') && <p role="status">Chargement des modèles…</p>;
  if (compact) return <div style={{ flex: '0 0 auto', padding: '2px 8px', background: '#09131b', color: '#eef3f5', fontSize: 12 }}>
    <details style={{ padding: 0, border: 0 }}>
      <summary aria-label={summary + ' — détails de la scène'} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '24px' }}>{summary}</summary>
      {guide}{hangarStatus !== 'NONFINAL' && <HangarStatus graphics={graphics} status={hangarStatus} />}{loading}
    </details>
    {alerts}
  </div>;
  return <div style={{ position: 'absolute', left: 8, bottom: 8, maxWidth: 'calc(100% - 16px)', padding: 8, background: '#09131bee', color: '#eef3f5', pointerEvents: 'none', fontSize: 12 }}>
    <p style={{ margin: 0 }}>{summary}</p>{guide}
    {hangarStatus !== 'NONFINAL' && <HangarStatus graphics={graphics} status={hangarStatus} />}{alerts}{loading}
  </div>;
}

/** DOM boundary: terminal graphics states never render the canvas or model subtree. */
export function GraphicsSurface({ state, children }: { state: GraphicsState; children?: ReactNode }) {
  if (state === 'failed' || state === 'lost') return <p role="alert" style={{ margin: 0, padding: 16, color: '#eef3f5', background: '#09131b' }}>
    {state === 'lost' ? 'Contexte WebGL perdu. Rechargez la vue pour rétablir le rendu.' : 'WebGL indisponible. La scène 3D ne peut pas être affichée.'}
  </p>;
  return <>{state === 'checking' && <p role="status" style={{ position: 'absolute', margin: 16 }}>Vérification du rendu WebGL…</p>}{children}</>;
}

/** This DOM status shares the terminal graphics gate with the mechanical assets. */
export function HangarStatus({ graphics, status }: { graphics: GraphicsState; status: AssetStatus }) {
  if (graphics !== 'available') return null;
  if (status === 'NONFINAL') return <p role="alert">NONFINAL — hangar GLB indisponible. Décor incomplet.</p>;
  return <p role="status">{status === 'loading' ? 'Chargement du hangar…' : 'Hangar chargé.'}</p>;
}
