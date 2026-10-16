import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, ContactShadows, Grid } from '@react-three/drei'
import * as THREE from 'three'
import type { DroneEnv } from './drone-env'

// Drone mesh: central body + 4 rotor cylinders
function Drone({ env }: { env: DroneEnv }) {
  const groupRef = useRef<THREE.Group>(null!)
  const rotorRefs = [
    useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!),
  ]

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.position.copy(env.position)
    groupRef.current.rotation.set(
      env.orientation.x,
      env.orientation.y,
      env.orientation.z,
    )
    // Spin rotors proportionally to their thrust
    rotorRefs.forEach((ref, i) => {
      if (!ref.current) return
      ref.current.rotation.y += env.motorThrusts[i] * 1.2
    })
  })

  const armLen = 0.25
  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.08, 0.3]} />
        <meshStandardMaterial color="#6366F1" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Arms */}
      <mesh position={[armLen, 0, armLen]}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-armLen, 0, armLen]}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[armLen, 0, -armLen]}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-armLen, 0, -armLen]}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Rotors */}
      <mesh ref={rotorRefs[0]} position={[armLen, 0.05, -armLen]}>
        <cylinderGeometry args={[0.12, 0.12, 0.01, 16]} />
        <meshStandardMaterial color="#A5B4FC" transparent opacity={0.4} />
      </mesh>
      <mesh ref={rotorRefs[1]} position={[-armLen, 0.05, -armLen]}>
        <cylinderGeometry args={[0.12, 0.12, 0.01, 16]} />
        <meshStandardMaterial color="#A5B4FC" transparent opacity={0.4} />
      </mesh>
      <mesh ref={rotorRefs[2]} position={[armLen, 0.05, armLen]}>
        <cylinderGeometry args={[0.12, 0.12, 0.01, 16]} />
        <meshStandardMaterial color="#A5B4FC" transparent opacity={0.4} />
      </mesh>
      <mesh ref={rotorRefs[3]} position={[-armLen, 0.05, armLen]}>
        <cylinderGeometry args={[0.12, 0.12, 0.01, 16]} />
        <meshStandardMaterial color="#A5B4FC" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

function Target({ env }: { env: DroneEnv }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.copy(env.target)
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15
    ref.current.scale.setScalar(pulse)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.3, 24, 24]} />
      <meshStandardMaterial
        color="#F8FAFC"
        emissive="#818CF8"
        emissiveIntensity={1.2}
        transparent
        opacity={0.85}
      />
    </mesh>
  )
}

function ChaseCamera({ env }: { env: DroneEnv }) {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3())
  const targetLook = useRef(new THREE.Vector3())

  useFrame(() => {
    targetPos.current.set(
      env.position.x + 3,
      env.position.y + 2.5,
      env.position.z + 4,
    )
    targetLook.current.copy(env.position)
    camera.position.lerp(targetPos.current, 0.05)
    camera.lookAt(targetLook.current)
  })
  return null
}

export function Scene3D({ env }: { env: DroneEnv }) {
  return (
    <Canvas
      shadows
      camera={{ position: [3, 4, 5], fov: 55 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0a0a1a']} />
      <fog attach="fog" args={['#0a0a1a', 8, 25]} />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <Grid
        position={[0, 0.01, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#1e293b"
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor="#312e81"
        fadeDistance={20}
        fadeStrength={1}
      />

      <Drone env={env} />
      <Target env={env} />

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.5}
        scale={12}
        blur={2}
      />

      <Environment preset="night" />
      <ChaseCamera env={env} />
    </Canvas>
  )
}
