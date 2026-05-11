import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useMazeStore } from './store'
import { MAZE_LAYOUT, CELL_SIZE } from './maze-env'

function Wall({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x * CELL_SIZE, CELL_SIZE / 2, z * CELL_SIZE]} castShadow receiveShadow>
      <boxGeometry args={[CELL_SIZE, CELL_SIZE, CELL_SIZE]} />
      <meshStandardMaterial color="#334155" roughness={0.9} />
    </mesh>
  )
}

function Floor() {
  const rows = MAZE_LAYOUT.length
  const cols = MAZE_LAYOUT[0].length
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[((cols - 1) * CELL_SIZE) / 2, 0, ((rows - 1) * CELL_SIZE) / 2]} receiveShadow>
      <planeGeometry args={[cols * CELL_SIZE, rows * CELL_SIZE]} />
      <meshStandardMaterial color="#0f172a" roughness={1} />
    </mesh>
  )
}

function Key({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 2
      ref.current.position.y = CELL_SIZE * 0.6 + Math.sin(Date.now() * 0.003) * 0.15
    }
  })
  return (
    <mesh ref={ref} position={[x * CELL_SIZE, CELL_SIZE * 0.6, z * CELL_SIZE]}>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
    </mesh>
  )
}

function Door({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x * CELL_SIZE, CELL_SIZE / 2, z * CELL_SIZE]}>
      <boxGeometry args={[CELL_SIZE * 0.9, CELL_SIZE * 0.9, CELL_SIZE * 0.9]} />
      <meshStandardMaterial color="#8b5cf6" transparent opacity={0.4} />
    </mesh>
  )
}

function Trap({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (ref.current) {
      const s = 1 + Math.sin(Date.now() * 0.005) * 0.1
      ref.current.scale.set(s, s, s)
    }
  })
  return (
    <group ref={ref} position={[x * CELL_SIZE, 0.1, z * CELL_SIZE]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 0.6, 4]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function Exit({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.z += delta
      ref.current.rotation.x += delta * 0.5
    }
  })
  return (
    <mesh ref={ref} position={[x * CELL_SIZE, CELL_SIZE * 0.7, z * CELL_SIZE]}>
      <torusGeometry args={[0.4, 0.1, 8, 16]} />
      <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={1} />
    </mesh>
  )
}

function Agent() {
  const { agentPos, agentAngle, hasKey } = useMazeStore()
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('./robot.glb')

  useFrame(() => {
    if (groupRef.current) {
      const targetX = agentPos.x * CELL_SIZE
      const targetZ = agentPos.z * CELL_SIZE
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.2
      groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.2
      // RobotExpressive faces +Z by default; rotate to match maze angle
      groupRef.current.rotation.y = -agentAngle + Math.PI
    }
  })

  return (
    <group
      ref={groupRef}
      position={[agentPos.x * CELL_SIZE, 0, agentPos.z * CELL_SIZE]}
      scale={0.5}
    >
      <primitive object={scene.clone()} castShadow />
      {/* Key glow indicator */}
      {hasKey && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} />
        </mesh>
      )}
    </group>
  )
}

function Scene() {
  const grid = useMemo(() => MAZE_LAYOUT, [])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#6366f1" />

      <Floor />

      {grid.map((row, z) =>
        row.map((cell, x) => {
          if (cell === 1) return <Wall key={`w-${x}-${z}`} x={x} z={z} />
          if (cell === 2) return <Key key={`k-${x}-${z}`} x={x} z={z} />
          if (cell === 3) return <Door key={`d-${x}-${z}`} x={x} z={z} />
          if (cell === 4) return <Exit key={`e-${x}-${z}`} x={x} z={z} />
          if (cell === 5) return <Trap key={`t-${x}-${z}`} x={x} z={z} />
          return null
        })
      )}

      <Agent />

      <OrbitControls
        target={[MAZE_LAYOUT[0].length * CELL_SIZE * 0.5, 0, MAZE_LAYOUT.length * CELL_SIZE * 0.5]}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
      />
    </>
  )
}

export default function Maze3D() {
  return (
    <Canvas shadows camera={{ position: [5, 8, 12], fov: 50 }}>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 15, 35]} />
      <Scene />
    </Canvas>
  )
}
