
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Grid, Box, Environment, SpotLight } from '@react-three/drei'
import { RapierRigidBody, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import Logo3D from './logo-3d'
import SimpleAgent from './simple-agent'
import { DefaultTheme, ThemeProps } from './themes'
import { useTargetStore } from './store/targetStore'
import Target from './target'
/*-------------------IgnitionAI---------------------*/
import { DQNAgent } from '@ignitionai/backend-tfjs'
import { IgnitionEnv } from "@ignitionai/core"
/*--------------------------------------------------*/
// Propriétés pour l'expérience
interface ExperienceProps {
  theme?: ThemeProps;
}

// Composant pour créer un mur
function Wall({ position, size, color = DefaultTheme.materials.wall.color, materialProps = DefaultTheme.materials.wall }: 
  { position: [number, number, number], size: [number, number, number], color?: string, materialProps?: any }) {
  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      <Box args={size} castShadow receiveShadow>
        <meshStandardMaterial 
          color={color} 
          metalness={materialProps.metalness} 
          roughness={materialProps.roughness}
          emissive={materialProps.emissive}
          emissiveIntensity={materialProps.emissiveIntensity} 
        />
      </Box>
    </RigidBody>
  )
}

// Composant pour créer un obstacle
function Obstacle({ position, size = [2, 4, 2], color = DefaultTheme.materials.obstacle.color, materialProps = DefaultTheme.materials.obstacle, movementType = "none", movementSpeed = 1 }: 
  { position: [number, number, number], size?: [number, number, number], color?: string, materialProps?: any, movementType?: "none" | "horizontal" | "vertical" | "circular", movementSpeed?: number }) {
  
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
          <meshStandardMaterial 
            color={color} 
            metalness={materialProps.metalness} 
            roughness={materialProps.roughness} 
            emissive={materialProps.emissive} 
            emissiveIntensity={materialProps.emissiveIntensity} 
          />
        </Box>
      </group>
    </RigidBody>
  )
}

function Experience({ theme = DefaultTheme }: ExperienceProps) {
  const spotLightRef = useRef<THREE.SpotLight>(null)
  const { collected } = useTargetStore()

  const dqnAgent = new DQNAgent({
    inputSize: 5, // Augmenter pour inclure la distance à la cible
    actionSize: 4,
    lr: 0.001,
    gamma: 0.99,
    epsilon: 0.1,
    epsilonDecay: 0.999,
    minEpsilon: 0.01,
    batchSize: 32,
    memorySize: 10000
  })

  const env = new IgnitionEnv({
    agent: dqnAgent,
    getObservation: () => {
      // À implémenter: obtenir la position de l'agent et calculer la distance à la cible
      // et aux obstacles les plus proches
      return [0, 0, 0, 0, 0]
    },
    applyAction: (action: number | number[]) => {
      console.log(action)
      // À implémenter: déplacer l'agent en fonction de l'action choisie
      return [0, 0, 0, 0, 0]
    },
    computeReward: () => {
      // À implémenter: récompense positive si l'agent s'approche de la cible
      // récompense négative s'il s'approche des obstacles
      // récompense très positive s'il atteint la cible
      return 0
    },
    isDone: () => {
      // L'épisode se termine si l'agent touche un obstacle ou atteint la cible
      return false
    }
  })

  console.log(env)
  
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
      <ambientLight intensity={theme.lighting.ambient.intensity} />
      
      {/* Lumière principale */}
      <directionalLight 
        position={theme.lighting.directional.position} 
        intensity={theme.lighting.directional.intensity} 
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
        intensity={theme.lighting.spot.intensity}
        angle={theme.lighting.spot.angle}
        penumbra={theme.lighting.spot.penumbra}
        castShadow
        distance={theme.lighting.spot.distance}
        attenuation={5}
        anglePower={5}
        color={theme.lighting.spot.color}
      />
      
      {/* Sol avec physique */}
      <RigidBody type="fixed" colliders="cuboid">
        <Box 
          position={[0, -0.5, 0]} 
          args={[arenaSize, 1, arenaSize]} 
          receiveShadow
        >
          <meshStandardMaterial 
            color={theme.materials.floor.color} 
            metalness={theme.materials.floor.metalness}
            roughness={theme.materials.floor.roughness}
          />
        </Box>
      </RigidBody>
      
      {/* Grille de référence */}
      <Grid 
        position={[0, 0.01, 0]} 
        args={[arenaSize, arenaSize]} 
        cellSize={theme.grid.cellSize}
        cellThickness={theme.grid.cellThickness}
        cellColor={theme.colors.gridCell}
        sectionSize={theme.grid.sectionSize}
        sectionThickness={theme.grid.sectionThickness}
        sectionColor={theme.colors.gridSection}
        fadeDistance={arenaSize}
        fadeStrength={theme.grid.fadeStrength}
      />
      
      {/* Murs de l'arène */}
      <Wall 
        position={[0, wallHeight/2, arenaSize/2 + wallThickness/2]} 
        size={[arenaSize + wallThickness*2, wallHeight, wallThickness]} 
        color={theme.materials.wall.color}
        materialProps={theme.materials.wall}
      />
      <Wall 
        position={[0, wallHeight/2, -arenaSize/2 - wallThickness/2]} 
        size={[arenaSize + wallThickness*2, wallHeight, wallThickness]} 
        color={theme.materials.wall.color}
        materialProps={theme.materials.wall}
      />
      <Wall 
        position={[arenaSize/2 + wallThickness/2, wallHeight/2, 0]} 
        size={[wallThickness, wallHeight, arenaSize]} 
        color={theme.materials.wall.color}
        materialProps={theme.materials.wall}
      />
      <Wall 
        position={[-arenaSize/2 - wallThickness/2, wallHeight/2, 0]} 
        size={[wallThickness, wallHeight, arenaSize]} 
        color={theme.materials.wall.color}
        materialProps={theme.materials.wall}
      />
      
      {/* Obstacles dans l'arène */}
      <Obstacle 
        position={[8, 2, 8]} 
        movementType="horizontal" 
        movementSpeed={1.5} 
        color={theme.materials.obstacle.color}
        materialProps={theme.materials.obstacle}
      />
      <Obstacle 
        position={[-10, 2, 12]} 
        movementType="vertical" 
        movementSpeed={4.3} 
        color={theme.materials.obstacle.color}
        materialProps={theme.materials.obstacle}
      />
      <Obstacle 
        position={[12, 2, -5]} 
        movementType="circular" 
        movementSpeed={0.9} 
        color={theme.materials.obstacle.color}
        materialProps={theme.materials.obstacle}
      />
      <Obstacle 
        position={[-5, 2, -15]} 
        movementType="horizontal" 
        movementSpeed={1.9} 
        color={theme.materials.obstacle.color}
        materialProps={theme.materials.obstacle}
      />
      <Obstacle 
        position={[0, 2, 0]} 
        size={[3, 6, 3]} 
        color={theme.colors.accent}
        materialProps={theme.materials.obstacle}
        movementType="horizontal" 
        movementSpeed={1.4} 
      />
      
      {/* Agent */}
      <SimpleAgent position={[-15, 1, -15]} />
      
      {/* Target (cible) */}
      {!collected && <Target theme={theme} />}
      
      {/* Logo IgnitionAI */}
      <Logo3D />
      
      {/* Environnement HDRI pour les reflets */}
      <Environment preset="city" />
    </>
  )
}

export default Experience