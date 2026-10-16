import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RobotPrefabProps {
  hasKey?: boolean
  isWalking?: boolean
}

/**
 * Low-poly robot prefab — built from scratch with Three.js primitives.
 * Head: cube with glowing visor
 * Body: rounded box with chest plate
 * Arms: segmented cylinders with joints
 * Legs: blocky with knee joints
 * Antenna: rod + glowing tip
 * Backpack: vented box
 */
export default function RobotPrefab({ hasKey = false, isWalking = false }: RobotPrefabProps) {
  const groupRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const antennaRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (isWalking) {
      // Walking animation
      leftLegRef.current!.rotation.x = Math.sin(t * 8) * 0.4
      rightLegRef.current!.rotation.x = Math.sin(t * 8 + Math.PI) * 0.4
      leftArmRef.current!.rotation.x = Math.sin(t * 8 + Math.PI) * 0.3
      rightArmRef.current!.rotation.x = Math.sin(t * 8) * 0.3
    } else {
      // Idle breathing
      leftLegRef.current!.rotation.x = 0
      rightLegRef.current!.rotation.x = 0
      leftArmRef.current!.rotation.x = Math.sin(t * 2) * 0.05
      rightArmRef.current!.rotation.x = Math.sin(t * 2 + Math.PI) * 0.05
    }
    // Antenna pulse
    if (antennaRef.current) {
      const mat = antennaRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1 + Math.sin(t * 4) * 0.5
    }
  })

  const metalDark = '#475569'
  const metalLight = '#94a3b8'
  const accent = hasKey ? '#fbbf24' : '#3b82f6'
  const accentEmissive = hasKey ? '#f59e0b' : '#2563eb'

  return (
    <group ref={groupRef} scale={0.6}>
      {/* === BODY === */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.35]} />
        <meshStandardMaterial color={metalDark} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Chest plate */}
      <mesh position={[0, 0.75, 0.18]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.05]} />
        <meshStandardMaterial color={accent} emissive={accentEmissive} emissiveIntensity={0.3} roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Chest core light */}
      <mesh position={[0, 0.75, 0.21]}>
        <circleGeometry args={[0.06, 16]} />
        <meshStandardMaterial color="#ffffff" emissive={accentEmissive} emissiveIntensity={2} />
      </mesh>

      {/* === HEAD === */}
      <group position={[0, 1.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.35, 0.4]} />
          <meshStandardMaterial color={metalLight} roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Visor */}
        <mesh position={[0, 0.02, 0.2]}>
          <boxGeometry args={[0.3, 0.12, 0.03]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.08, 0.02, 0.22]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={3} />
        </mesh>
        <mesh position={[0.08, 0.02, 0.22]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={3} />
        </mesh>
        {/* Antenna */}
        <mesh position={[0.12, 0.22, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 6]} />
          <meshStandardMaterial color={metalDark} />
        </mesh>
        <mesh ref={antennaRef} position={[0.12, 0.33, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color={accent} emissive={accentEmissive} emissiveIntensity={1} />
        </mesh>
      </group>

      {/* === BACKPACK === */}
      <mesh position={[0, 0.75, -0.25]} castShadow>
        <boxGeometry args={[0.4, 0.45, 0.15]} />
        <meshStandardMaterial color={metalDark} roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Vents */}
      {[-0.1, 0, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.75, -0.33]}>
          <boxGeometry args={[0.06, 0.3, 0.02]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}

      {/* === LEFT ARM === */}
      <group ref={leftArmRef} position={[-0.35, 0.85, 0]}>
        {/* Shoulder joint */}
        <mesh>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={metalLight} />
        </mesh>
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.12, 0.25, 0.12]} />
          <meshStandardMaterial color={metalDark} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshStandardMaterial color={metalLight} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.48, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color={accent} emissive={accentEmissive} emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* === RIGHT ARM === */}
      <group ref={rightArmRef} position={[0.35, 0.85, 0]}>
        <mesh>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={metalLight} />
        </mesh>
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.12, 0.25, 0.12]} />
          <meshStandardMaterial color={metalDark} />
        </mesh>
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshStandardMaterial color={metalLight} />
        </mesh>
        <mesh position={[0, -0.48, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color={accent} emissive={accentEmissive} emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* === LEFT LEG === */}
      <group ref={leftLegRef} position={[-0.12, 0.35, 0]}>
        {/* Hip joint */}
        <mesh>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={metalLight} />
        </mesh>
        {/* Thigh */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.14, 0.25, 0.14]} />
          <meshStandardMaterial color={metalDark} />
        </mesh>
        {/* Knee */}
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={metalLight} />
        </mesh>
        {/* Shin */}
        <mesh position={[0, -0.42, 0]} castShadow>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color={metalDark} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.55, 0.04]} castShadow>
          <boxGeometry args={[0.14, 0.06, 0.18]} />
          <meshStandardMaterial color={metalLight} />
        </mesh>
      </group>

      {/* === RIGHT LEG === */}
      <group ref={rightLegRef} position={[0.12, 0.35, 0]}>
        <mesh>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={metalLight} />
        </mesh>
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.14, 0.25, 0.14]} />
          <meshStandardMaterial color={metalDark} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={metalLight} />
        </mesh>
        <mesh position={[0, -0.42, 0]} castShadow>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color={metalDark} />
        </mesh>
        <mesh position={[0, -0.55, 0.04]} castShadow>
          <boxGeometry args={[0.14, 0.06, 0.18]} />
          <meshStandardMaterial color={metalLight} />
        </mesh>
      </group>

      {/* === KEY GLOW (when collected) === */}
      {hasKey && (
        <mesh position={[0, 1.6, 0]}>
          <octahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={3} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  )
}
