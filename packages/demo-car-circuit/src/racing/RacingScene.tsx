import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import type { LearnedRace } from "./learned-race";
import { RacingCamera } from "./camera";
import { referenceAction } from "./reference";
import { RaceWorld } from "./race";
import { DrivingWorld, DRIVING_CONTRACT, RacingTrack } from "./driving";

export function Vehicle({
  world,
  model,
}: {
  world: DrivingWorld;
  model: string;
}) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/${model}.glb`);
  const group = useRef<THREE.Group>(null);
  const object = useMemo(() => {
    const copy = scene.clone(true),
      box = new THREE.Box3().setFromObject(copy),
      size = box.getSize(new THREE.Vector3());
    const scale = 4.4 / Math.max(size.x, size.z);
    copy.scale.setScalar(scale);
    const center = box.getCenter(new THREE.Vector3());
    copy.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    copy.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return copy;
  }, [scene]);
  useFrame(() => {
    if (group.current) {
      const c = world.car;
      group.current.position.set(c.x, 0.04, c.z);
      group.current.rotation.y = -c.angle + Math.PI / 2;
    }
  });
  return (
    <group ref={group}>
      <primitive object={object} />
    </group>
  );
}
function Road({ track }: { track: RacingTrack }) {
  const geometry = useMemo(() => {
    const positions: number[] = [],
      colors: number[] = [];
    for (let i = 0; i < 400; i++) {
      const a = track.sample(i / 400),
        b = track.sample((i + 1) / 400);
      for (const [l, r, color] of [
        [-5.3, -4.5, i % 8 < 4 ? "#f4efdf" : "#d74332"],
        [-4.5, 4.5, "#30383b"],
        [4.5, 5.3, i % 8 < 4 ? "#f4efdf" : "#d74332"],
      ] as [number, number, string][]) {
        const v = (p: typeof a, s: number) => [
          p.x - Math.sin(p.angle) * s,
          0.02,
          p.z + Math.cos(p.angle) * s,
        ];
        const verts = [v(a, l), v(a, r), v(b, r), v(a, l), v(b, r), v(b, l)],
          c = new THREE.Color(color);
        verts.forEach((p) => {
          positions.push(...p);
          colors.push(c.r, c.g, c.b);
        });
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [track]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.94}
        />
      </mesh>
      <Rails track={track} />
      {Array.from({ length: 10 }, (_, i) => {
        const p = track.sample(0);
        return (
          <mesh
            key={i}
            position={[
              p.x - Math.sin(p.angle) * (i - 4.5) * 0.9,
              0.04,
              p.z + Math.cos(p.angle) * (i - 4.5) * 0.9,
            ]}
            rotation={[0, -p.angle, 0]}
          >
            <boxGeometry args={[1.1, 0.025, 0.9]} />
            <meshStandardMaterial color={i % 2 ? "#111" : "#fff"} />
          </mesh>
        );
      })}
    </>
  );
}
/** Continuous rails share their offset and thickness with the collision contract. */
function Rails({ track }: { track: RacingTrack }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const { barrierOffset, barrierThickness } = DRIVING_CONTRACT;
    for (const side of [-1, 1]) for (let i = 0; i < 400; i++) {
      const endpoints = [track.sample(i / 400), track.sample((i + 1) / 400)];
      const vertices = endpoints.flatMap(p => [0, 1].flatMap(y => [-1, 1].map(edge => {
        const offset = side * barrierOffset + edge * barrierThickness / 2;
        return [p.x - Math.sin(p.angle) * offset, y, p.z + Math.cos(p.angle) * offset];
      })));
      for (const face of [[0,4,6,2], [1,3,7,5], [2,6,7,3]]) {
        for (const index of [face[0],face[1],face[2],face[0],face[2],face[3]]) positions.push(...vertices[index]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.computeVertexNormals();
    return g;
  }, [track]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#ced3ca" side={THREE.DoubleSide} /></mesh>;
}
function Driver({
  world,
  keys,
  paused,
  onStats,
  race,
  reference = false,
  learned,
}: {
  world: DrivingWorld;
  keys: Set<string>;
  paused: boolean;
  onStats: (speed: number) => void;
  race?: RaceWorld;
  reference?: boolean;
  learned?: LearnedRace;
}) {
  const { active: loading } = useProgress();
  const accumulator = useRef(0),
    statsElapsed = useRef(0),
    cameraRig = useRef(new RacingCamera()),
    cameraWorld = useRef(world);
  useFrame(({ camera }, delta) => {
    if (!paused && !loading) {
      accumulator.current += Math.min(delta, 0.1);
      while (accumulator.current >= DRIVING_CONTRACT.dt) {
        const steer =
          (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) -
          (keys.has("ArrowLeft") || keys.has("KeyA") || keys.has("KeyQ")
            ? 1
            : 0);
        const throttle =
          keys.has("ArrowDown") || keys.has("KeyS")
            ? -1
            : keys.has("ArrowUp") || keys.has("KeyW") || keys.has("KeyZ")
              ? 1
              : 0;
        const action = (throttle + 1) * 3 + steer + 1;
        if (learned) learned.step(action);
        else if (race)
          race.step(
            race.drivers.map((d, i) =>
              reference || i > 0 ? referenceAction(d.world) : action,
            ),
          );
        else world.step(action);
        accumulator.current -= DRIVING_CONTRACT.dt;
      }
    } else accumulator.current = 0;
    const c = world.car;
    cameraRig.current.update(c, paused ? 0 : delta, cameraWorld.current !== world);
    cameraWorld.current = world;
    camera.position.copy(cameraRig.current.position);
    camera.up.set(0, 1, 0);
    camera.lookAt(cameraRig.current.target);
    statsElapsed.current += delta;
    if (statsElapsed.current >= 0.1) {
      statsElapsed.current = 0;
      onStats(c.speed * 3.6);
    }
  });
  return null;
}
export function RacingScene(props: {
  world: DrivingWorld;
  keys: Set<string>;
  paused: boolean;
  model: string;
  onStats: (speed: number) => void;
  race?: RaceWorld;
  reference?: boolean;
  learned?: LearnedRace;
}) {
  return (
    <Canvas shadows camera={{ fov: 55, near: 0.1, far: 600 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#a6c4c8"]} />
      <fog attach="fog" args={["#a6c4c8", 100, 350]} />
      <hemisphereLight args={["#e4f5ff", "#5c6949", 2]} />
      <directionalLight
        position={[30, 70, -25]}
        intensity={3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-far={200}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#6d805a" roughness={1} />
      </mesh>
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i * Math.PI * 2) / 24;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 190, 0, Math.sin(a) * 180]}
            scale={[1.4, 0.45, 1.2]}
          >
            <sphereGeometry args={[32 + (i % 4) * 7, 10, 6]} />
            <meshStandardMaterial color={i % 2 ? "#677b6a" : "#7d8c71"} />
          </mesh>
        );
      })}
      <Road track={props.world.track} />
      <Suspense fallback={null}>
        {props.race ? (
          props.race.drivers.map((d) => (
            <Vehicle
              key={d.id}
              world={d.world}
              model={
                props.learned?.competitors[d.id]?.model ??
                (d.id % 2 ? "sedan-sports" : props.model)
              }
            />
          ))
        ) : (
          <Vehicle world={props.world} model={props.model} />
        )}
      </Suspense>
      <Driver {...props} />
    </Canvas>
  );
}
