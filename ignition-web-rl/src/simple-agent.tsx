import { useRef, forwardRef } from 'react'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { DefaultTheme, ThemeProps } from './themes'

interface SimpleAgentProps {
  position?: [number, number, number];
  theme?: ThemeProps;
}

const SimpleAgent = forwardRef<RapierRigidBody, SimpleAgentProps>(({ position = [0, 1, 0], theme = DefaultTheme }, ref) => {
  const bodyRef = useRef<THREE.Group>(null)
  
  return (
    <RigidBody 
    ref={ref} 
    name="agent"
    position={position} 
    colliders="cuboid" 
    type="dynamic" 
    lockRotations={true} 
    lockTranslations={true}  
    angularDamping={5} 
    linearDamping={1}
    mass={1}
    restitution={0.1}>
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
})

export default SimpleAgent