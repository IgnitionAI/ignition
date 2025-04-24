import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Grid, Box, Environment, SpotLight } from '@react-three/drei'
import { RapierRigidBody, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import Logo3D from './logo-3d'
import SimpleAgent from './simple-agent'

// Composant pour créer un mur
function Wall({ position, size, color = "#0c8cbf" }: { position: [number, number, number], size: [number, number, number], color?: string }) {
  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      <Box args={size} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
      </Box>
    </RigidBody>
  )
}

// Composant pour créer un obstacle
function Obstacle({ position, size = [2, 4, 2], color = "#a5f3fc", movementType = "none", movementSpeed = 1 }: 
  { position: [number, number, number], size?: [number, number, number], color?: string, movementType?: "none" | "horizontal" | "vertical" | "circular", movementSpeed?: number }) {
  
  const obstacleRef = useRef<RapierRigidBody>(null)
  const initialPosition = useRef<[number, number, number]>([...position])
  
  useFrame((state) => {
    if (obstacleRef.current && movementType !== "none") {
      const time = state.clock.getElapsedTime() * movementSpeed
      let newPosition = [...initialPosition.current] as [number, number, number]
      
      switch (movementType) {
        case "horizontal":
          newPosition[0] = initialPosition.current[0] + Math.sin(time) * 12
          break
        case "vertical":
          // Au lieu de monter/descendre, on fait un mouvement avant/arrière
          newPosition[2] = initialPosition.current[2] + Math.sin(time) * 7
          break
        case "circular":
          newPosition[0] = initialPosition.current[0] + Math.sin(time) * 3
          newPosition[2] = initialPosition.current[2] + Math.cos(time) * 3
          break
      }
      
      // Maintenir la hauteur Y constante (au niveau du sol + moitié de la hauteur)
      newPosition[1] = initialPosition.current[1]
      
      obstacleRef.current.setTranslation(new THREE.Vector3(newPosition[0], newPosition[1], newPosition[2]), true)
    }
  })
  
  return (
    <RigidBody ref={obstacleRef} type="kinematicPosition" position={position} colliders="cuboid">
      <group>
        <Box args={size} castShadow receiveShadow>
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.1} emissive={color} emissiveIntensity={0.2} />
        </Box>
      </group>
    </RigidBody>
  )
}

function Experience() {
  const spotLightRef = useRef<THREE.SpotLight>(null)
  
  useFrame((state) => {
    if (spotLightRef.current) {
      spotLightRef.current.position.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 15
      spotLightRef.current.position.z = Math.cos(state.clock.getElapsedTime() * 0.5) * 15
    }
  })
  
  // Dimensions de l'arène
  const arenaSize = 40
  const wallHeight = 6
  const wallThickness = 1
  
  return (
    <>
      {/* Éclairage ambiant */}
      <ambientLight intensity={0.3} />
      
      {/* Lumière principale */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-arenaSize/2}
        shadow-camera-right={arenaSize/2}
        shadow-camera-top={arenaSize/2}
        shadow-camera-bottom={-arenaSize/2}
      />
      
      {/* Lumière spot qui se déplace */}
      <SpotLight
        ref={spotLightRef}
        position={[0, 15, 0]}
        intensity={1}
        angle={0.6}
        penumbra={0.5}
        castShadow
        distance={50}
        attenuation={5}
        anglePower={5}
        color="#0c8cbf"
      />
      
      {/* Sol avec physique */}
      <RigidBody type="fixed" colliders="cuboid">
        <Box 
          position={[0, -0.5, 0]} 
          args={[arenaSize, 1, arenaSize]} 
          receiveShadow
        >
          <meshStandardMaterial 
            color="#171730" 
            metalness={0.8}
            roughness={0.2}
          />
        </Box>
      </RigidBody>
      
      {/* Grille de référence */}
      <Grid 
        position={[0, 0.01, 0]} 
        args={[arenaSize, arenaSize]} 
        cellSize={2}
        cellThickness={0.6}
        cellColor="#3f4e8d"
        sectionSize={10}
        sectionThickness={1.5}
        sectionColor="#0c8cbf"
        fadeDistance={arenaSize}
        fadeStrength={1}
      />
      
      {/* Murs de l'arène */}
      <Wall 
        position={[0, wallHeight/2, arenaSize/2 + wallThickness/2]} 
        size={[arenaSize + wallThickness*2, wallHeight, wallThickness]} 
      />
      <Wall 
        position={[0, wallHeight/2, -arenaSize/2 - wallThickness/2]} 
        size={[arenaSize + wallThickness*2, wallHeight, wallThickness]} 
      />
      <Wall 
        position={[arenaSize/2 + wallThickness/2, wallHeight/2, 0]} 
        size={[wallThickness, wallHeight, arenaSize]} 
      />
      <Wall 
        position={[-arenaSize/2 - wallThickness/2, wallHeight/2, 0]} 
        size={[wallThickness, wallHeight, arenaSize]} 
      />
      
      {/* Obstacles dans l'arène */}
      <Obstacle position={[8, 2, 8]} movementType="horizontal" movementSpeed={1.5} />
      <Obstacle position={[-10, 2, 12]} movementType="vertical" movementSpeed={4.3} />
      <Obstacle position={[12, 2, -5]} movementType="circular" movementSpeed={0.9} />
      <Obstacle position={[-5, 2, -15]} movementType="horizontal" movementSpeed={1.9} />
      <Obstacle position={[0, 2, 0]} size={[3, 6, 3]} color="#3f4e8d" movementType="horizontal" movementSpeed={1.4} />
      
      {/* Agent */}
      <SimpleAgent position={[-15, 1, -15]} />
      
      {/* Logo IgnitionAI */}
      <Logo3D />
      
      {/* Environnement HDRI pour les reflets */}
      <Environment preset="city" />
    </>
  )
}

export default Experience