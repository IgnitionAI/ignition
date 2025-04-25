import { useRef } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { DefaultTheme, ThemeProps } from './themes'

interface SimpleAgentProps {
  position?: [number, number, number];
  theme?: ThemeProps;
}

function SimpleAgent({ position = [0, 1, 0], theme = DefaultTheme }: SimpleAgentProps) {
  const bodyRef = useRef<THREE.Group>(null)
  
  // Animation simple pour donner vie à l'agent
//   useFrame((state) => {
//     if (bodyRef.current) {
//       // Légère oscillation pour simuler une respiration
//       bodyRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2) * 0.1 + position[1]
      
//       // Légère rotation pour plus de dynamisme
//       bodyRef.current.rotation.y = state.clock.getElapsedTime() * 0.5
//     }
//   })
  
  return (
    <RigidBody position={position} colliders="cuboid" type="dynamic">
      <group ref={bodyRef}>
        {/* Corps simple cubique comme dans Unity ML-Agents */}
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={theme.materials.agent.color} 
            metalness={theme.materials.agent.metalness} 
            roughness={theme.materials.agent.roughness} 
            emissive={theme.materials.agent.emissive}
            emissiveIntensity={theme.materials.agent.emissiveIntensity}
          />
        </mesh>
        
        {/* Yeux */}
        <group position={[0, 0.2, 0.51]}>
          {/* Œil gauche */}
          <mesh position={[-0.2, 0, 0]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial 
              color="white" 
              metalness={0.2} 
              roughness={0.3}
            />
          </mesh>
          
          {/* Pupille gauche */}
          <mesh position={[-0.2, 0, 0.08]} castShadow>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial 
              color="black" 
              metalness={0.5} 
              roughness={0.2}
            />
          </mesh>
          
          {/* Œil droit */}
          <mesh position={[0.2, 0, 0]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial 
              color="white" 
              metalness={0.2} 
              roughness={0.3}
            />
          </mesh>
          
          {/* Pupille droite */}
          <mesh position={[0.2, 0, 0.08]} castShadow>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial 
              color="black" 
              metalness={0.5} 
              roughness={0.2}
            />
          </mesh>
        </group>
        
        {/* Petit indicateur de direction (sous les yeux) */}
        <mesh position={[0, -0.2, 0.51]} castShadow>
          <boxGeometry args={[0.5, 0.1, 0.05]} />
          <meshStandardMaterial 
            color={theme.colors.secondary} 
            metalness={0.8} 
            roughness={0.1}
            emissive={theme.colors.secondary}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}

export default SimpleAgent