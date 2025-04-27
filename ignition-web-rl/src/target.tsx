import { useRef, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { DefaultTheme, ThemeProps } from './themes'
import { useTargetStore } from './store/targetStore'

interface TargetProps {
  theme?: ThemeProps;
}

const Target = forwardRef<RapierRigidBody, TargetProps>(({ theme = DefaultTheme }, ref) => {
  const targetRef = useRef<THREE.Group>(null)
  const { position, collectTarget } = useTargetStore()
  
  // Animation pour rendre la cible plus visible et attractive
  useFrame((state) => {
    if (targetRef.current) {
      // Rotation continue
      targetRef.current.rotation.y = state.clock.getElapsedTime() * 2
      
      // Légère oscillation verticale
      targetRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 3) * 0.2 + position[1]
    }
  })
  
  return (
    <RigidBody 
      ref={ref}
      position={position} 
      colliders="ball"
      type="fixed"
      sensor
      onIntersectionEnter={(e) => {
        console.log('🚀 Intersection detected with:', e.rigidBodyObject?.name)
        if (e.rigidBodyObject?.name === 'agent') {
          collectTarget()
        }
      }}
    >
      <group ref={targetRef} name="target">
        {/* Sphère principale */}
        <mesh castShadow>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial 
            color={theme.materials.target.color} 
            metalness={theme.materials.target.metalness} 
            roughness={theme.materials.target.roughness} 
            emissive={theme.materials.target.emissive}
            emissiveIntensity={theme.materials.target.emissiveIntensity}
          />
        </mesh>
        
        {/* Anneaux décoratifs */}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.1, 16, 32]} />
          <meshStandardMaterial 
            color={theme.colors.secondary} 
            metalness={0.9} 
            roughness={0.1}
            emissive={theme.colors.secondary}
            emissiveIntensity={0.6}
          />
        </mesh>
        
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[1, 0.1, 16, 32]} />
          <meshStandardMaterial 
            color={theme.colors.secondary} 
            metalness={0.9} 
            roughness={0.1}
            emissive={theme.colors.secondary}
            emissiveIntensity={0.6}
          />
        </mesh>
        
        {/* Particules lumineuses autour de la cible */}
        {[...Array(8)].map((_, i) => (
          <mesh 
            key={i} 
            position={[
              Math.cos(i / 8 * Math.PI * 2) * 1.2,
              Math.sin(i / 8 * Math.PI * 2) * 1.2,
              0
            ]}
            castShadow
          >
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial 
              color={theme.colors.primary} 
              metalness={0.9} 
              roughness={0.1}
              emissive={theme.colors.primary}
              emissiveIntensity={0.8}
            />
          </mesh>
        ))}
      </group>
    </RigidBody>
  )
})

export default Target