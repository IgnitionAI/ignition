/// <reference types="vite/client" />
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Trail } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { ACESFilmicToneMapping, CanvasTexture, Color, DoubleSide, Group, Mesh, MeshStandardMaterial, PerspectiveCamera, PointLight, SRGBColorSpace, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Box3 } from 'three';
import type { BallThrustEnv } from './ball-thrust-env';
import { BALL_RADIUS, GOAL_RADIUS, SOLIDS } from './physics';

function deckTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#182832'; context.fillRect(0, 0, 512, 512);
  context.strokeStyle = '#31434d'; context.lineWidth = 3;
  for (let n = 0; n <= 512; n += 128) {
    context.beginPath(); context.moveTo(n, 0); context.lineTo(n, 512); context.stroke();
    context.beginPath(); context.moveTo(0, n); context.lineTo(512, n); context.stroke();
  }
  context.fillStyle = '#53616a';
  for (let x = 12; x < 512; x += 128) for (let y = 12; y < 512; y += 128) {
    context.beginPath(); context.arc(x, y, 3, 0, Math.PI * 2); context.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = 1000;
  texture.repeat.set(4, 4);
  return texture;
}

function Cage({ compact }: { compact: boolean }) {
  const [model, setModel] = useState<Group | null>(null);
  useEffect(() => {
    let active = true;
    let loaded: Group | null = null;
    new GLTFLoader().load(`${import.meta.env.BASE_URL}models/cage-blender.glb`, gltf => {
      if (!active) return;
      loaded = gltf.scene;
      const bounds = new Box3().setFromObject(loaded);
      const size = bounds.getSize(new Vector3());
      const center = bounds.getCenter(new Vector3());
      const scale = 14.2 / Math.max(size.x, size.z);
      loaded.scale.setScalar(scale);
      loaded.position.set(-center.x * scale, -bounds.min.y * scale - 0.58, -center.z * scale);
      loaded.traverse(object => {
        if (!(object instanceof Mesh)) return;
        object.castShadow = !compact; object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!(material instanceof MeshStandardMaterial)) continue;
          material.roughness = Math.max(material.roughness, 0.62);
          material.metalness = Math.min(material.metalness, 0.72);
        }
      });
      setModel(loaded);
    }, undefined, error => console.warn('Cage Blender absente : arène construite conservée.', error));
    return () => { active = false; };
  }, [compact]);
  return model ? <primitive object={model} /> : null;
}

function Goal({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const beam = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 1.8) * 0.07;
    group.current?.scale.setScalar(pulse);
    if (beam.current) beam.current.rotation.y = clock.elapsedTime * 0.16;
  });
  return <group ref={group}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[GOAL_RADIUS * 0.78, GOAL_RADIUS, 64]} />
      <meshBasicMaterial color={new Color(1.1, 2.3, 0.55)} side={DoubleSide} toneMapped={false} />
    </mesh>
    <mesh ref={beam} position={[0, 0.8, 0]}>
      <cylinderGeometry args={[0.08, 0.42, 1.6, 24, 1, true]} />
      <meshBasicMaterial color="#9be866" transparent opacity={0.09} side={DoubleSide} depthWrite={false} />
    </mesh>
    <mesh position={[0, 0.5, 0]}>
      <octahedronGeometry args={[0.2]} />
      <meshStandardMaterial color="#b7ee76" emissive="#8fc952" emissiveIntensity={2.2} roughness={0.3} />
    </mesh>
    <pointLight position={[0, 0.65, 0]} color="#a4ec68" intensity={2.2} distance={2.8} />
  </group>;
}

function Ball({ env }: { env: BallThrustEnv }) {
  const group = useRef<Group>(null);
  const glow = useRef<PointLight>(null);
  // BallThrustEnv is the only simulation owner. Rendering copies Rapier and never steps it.
  useFrame(() => {
    if (!group.current) return;
    group.current.position.copy(env.ball.translation());
    group.current.quaternion.copy(env.ball.rotation());
    if (glow.current) {
      const velocity = env.ball.linvel();
      glow.current.intensity = 1.4 + Math.min(4, Math.hypot(velocity.x, velocity.y, velocity.z) * 0.65);
    }
  });
  return <group ref={group}>
    <mesh castShadow>
      <sphereGeometry args={[BALL_RADIUS, 40, 28]} />
      <meshStandardMaterial color="#43aebd" emissive="#1a9db4" emissiveIntensity={1.25} metalness={0.64} roughness={0.2} />
    </mesh>
    <mesh scale={1.015}>
      <sphereGeometry args={[BALL_RADIUS, 16, 12]} />
      <meshBasicMaterial color="#8bf3ff" wireframe transparent opacity={0.2} />
    </mesh>
    <pointLight ref={glow} color="#46d8ed" intensity={1.4} distance={3.4} decay={2} />
  </group>;
}

function Arena({ env, compact, reducedMotion }: { env: BallThrustEnv; compact: boolean; reducedMotion: boolean }) {
  const texture = useMemo(deckTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const { goal } = env;
  const ball = <Ball env={env} />;
  return <>
    <Cage compact={compact} />
    {SOLIDS.map(solid => <group key={solid.id} position={[...solid.position]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[...solid.size]} />
        {solid.id === 'floor'
          ? <meshStandardMaterial map={texture} color="#71818a" metalness={0.58} roughness={0.7} />
          : <meshStandardMaterial color={solid.id.startsWith('obstacle') ? '#202c34' : '#293c48'} metalness={0.65} roughness={0.58} />}
      </mesh>
      {solid.id.startsWith('obstacle') && <group position={[0, solid.size[1] / 2 + 0.018, 0]}>
        {[-1, 1].map(side => <mesh key={`z${side}`} position={[0, 0, side * solid.size[2] / 2]}>
          <boxGeometry args={[solid.size[0] + 0.025, 0.035, 0.045]} />
          <meshStandardMaterial color="#c87a35" emissive="#a14c17" emissiveIntensity={0.65} metalness={0.45} roughness={0.5} />
        </mesh>)}
        {[-1, 1].map(side => <mesh key={`x${side}`} position={[side * solid.size[0] / 2, 0, 0]}>
          <boxGeometry args={[0.045, 0.035, solid.size[2] + 0.025]} />
          <meshStandardMaterial color="#c87a35" emissive="#a14c17" emissiveIntensity={0.65} metalness={0.45} roughness={0.5} />
        </mesh>)}
      </group>}
      {solid.id !== 'floor' && !solid.id.startsWith('obstacle') && <mesh position={[0, solid.size[1] / 2 + 0.025, 0]}>
        <boxGeometry args={[solid.size[0] + 0.02, 0.045, solid.size[2] + 0.02]} />
        <meshStandardMaterial color="#527487" emissive="#294d60" emissiveIntensity={0.45} metalness={0.7} roughness={0.45} />
      </mesh>}
    </group>)}
    <group position={[goal.x, 0.025, goal.z]}><Goal reducedMotion={reducedMotion} /></group>
    {reducedMotion ? ball : <Trail width={0.75} length={3.2} color="#48c9de" attenuation={width => width}>{ball}</Trail>}
  </>;
}

function CameraFraming() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspectCorrection = Math.max(1, 1.35 / (size.width / size.height));
    camera.fov = 2 * Math.atan(Math.tan(48 * Math.PI / 360) * aspectCorrection) * 180 / Math.PI;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function Diagnostics({ env }: { env: BallThrustEnv }) {
  const { gl } = useThree();
  const samples = useRef<number[]>([]);
  useEffect(() => {
    if (new URLSearchParams(location.search).get('debug') !== '1') return;
    gl.info.autoReset = false;
    const context = gl.getContext();
    const extension = context.getExtension('WEBGL_debug_renderer_info');
    const target = window as unknown as { __BALL_VISUAL?: unknown };
    target.__BALL_VISUAL = {
      state: () => ({ position: env.ball.translation(), velocity: env.ball.linvel() }),
      metrics: () => {
        const sorted = [...samples.current].sort((a, b) => a - b);
        const at = (p: number) => sorted.length ? sorted[Math.ceil(sorted.length * p) - 1] : 0;
        return {
          backend: extension ? context.getParameter(extension.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER),
          calls: gl.info.render.calls, triangles: gl.info.render.triangles,
          textures: gl.info.memory.textures, geometries: gl.info.memory.geometries,
          frameTimesMs: { median: at(0.5), p95: at(0.95), p99: at(0.99), count: sorted.length },
        };
      },
    };
    return () => { delete target.__BALL_VISUAL; };
  }, [env, gl]);
  useFrame((_, delta) => {
    gl.info.reset();
    samples.current.push(delta * 1000);
    if (samples.current.length > 300) samples.current.shift();
  });
  return null;
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

export function Scene({ env }: { env: BallThrustEnv }) {
  const [supported] = useState(supportsWebGL);
  const compact = innerWidth < 700;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supported) return <p className="scene-message" role="alert">
    WebGL indisponible. Activez l’accélération graphique ou utilisez un navigateur compatible.
  </p>;
  return <Canvas shadows={!compact} dpr={compact ? 1 : [1, 1.5]} camera={{ position: [0, 13.5, 12.5], fov: 48, near: 0.1, far: 70 }}
    gl={{ antialias: true, powerPreference: 'high-performance' }}
    onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
    fallback={<p role="alert">WebGL indisponible. Activez l’accélération graphique ou utilisez un navigateur compatible.</p>}>
    <color attach="background" args={['#071018']} />
    <fog attach="fog" args={['#071018', 18, 43]} />
    <ambientLight intensity={0.55} color="#8aa5b7" />
    <hemisphereLight args={['#7298ad', '#0b1218', 0.65]} />
    <directionalLight position={[-4, 12, 5]} intensity={2.8} color="#c4e2ef" castShadow={!compact}
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8}
      shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={0.03} />
    <pointLight position={[5, 3, -4]} intensity={13} distance={13} color="#d27a34" />
    <Suspense fallback={null}><Arena env={env} compact={compact} reducedMotion={reducedMotion} /></Suspense>
    <CameraFraming />
    <OrbitControls makeDefault target={[0, 0, 0]} minDistance={11} maxDistance={25}
      minPolarAngle={0.15} maxPolarAngle={Math.PI / 2.3} enablePan={false} />
    {!compact && <EffectComposer multisampling={0}><Bloom intensity={0.55} luminanceThreshold={0.95} luminanceSmoothing={0.22} mipmapBlur /><Vignette eskil={false} offset={0.25} darkness={0.48} /></EffectComposer>}
    <Diagnostics env={env} />
  </Canvas>;
}
