import { useRef, forwardRef, useImperativeHandle, useState } from 'react'
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
    <RigidBody type="fixed" position={position} colliders="cuboid" name="wall">
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
const Obstacle = forwardRef(({ position, size = [2, 4, 2], color = DefaultTheme.materials.obstacle.color, materialProps = DefaultTheme.materials.obstacle, movementType = "none", movementSpeed = 1 }: 
  { position: [number, number, number], size?: [number, number, number], color?: string, materialProps?: any, movementType?: "none" | "horizontal" | "vertical" | "circular", movementSpeed?: number }, 
  ref) => {
  
  const obstacleRef = useRef<RapierRigidBody>(null)
  const initialPosition = useRef<[number, number, number]>([...position])
  
  // Exposer la référence
  useImperativeHandle(ref, () => obstacleRef.current)
  
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
    <RigidBody ref={obstacleRef} type="kinematicPosition" position={position} colliders="cuboid" name="obstacle">
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
})

function Experience({ theme = DefaultTheme }: ExperienceProps) {
  const spotLightRef = useRef<THREE.SpotLight>(null)
  const { collected, position: targetPosition } = useTargetStore()
  
  // Références pour l'agent et les obstacles
  const agentRef = useRef<RapierRigidBody>(null)
  const obstaclesRef = useRef<RapierRigidBody[]>([])
  const [hasCollidedWithObstacle, setHasCollidedWithObstacle] = useState(false)
  
  // Fonction pour gérer la collision avec un obstacle
  const handleObstacleCollision = () => {
    setHasCollidedWithObstacle(true)
  }
  
  // Dimensions de l'arène
  const arenaSize = 40
  const wallHeight = 6
  const wallThickness = 1
  
  // Fonction pour calculer la distance à l'obstacle le plus proche dans une direction donnée
  const getRaycastDistance = (position: THREE.Vector3, angle: number): number => {
    // Direction du rayon
    const direction = new THREE.Vector3(
      Math.cos(angle),
      0,
      Math.sin(angle)
    );
    
    // Créer un rayon
    const rayOrigin = new THREE.Vector3(position.x, position.y, position.z);
    const rayDirection = direction.normalize();
    
    // Longueur maximale du rayon
    const maxDistance = arenaSize;
    
    // Vérifier les collisions avec les obstacles
    let closestDistance = maxDistance;
    
    // Vérifier les obstacles
    obstaclesRef.current.forEach(obstacle => {
      if (!obstacle) return;
      
      const obstaclePos = obstacle.translation();
      // Convertir la position de l'obstacle en Vector3 de Three.js
      const obstaclePosition = new THREE.Vector3(obstaclePos.x, obstaclePos.y, obstaclePos.z);
      const obstacleSize = new THREE.Vector3(2, 4, 2); // Taille par défaut des obstacles
      
      // Simplification: vérifier si le rayon intersecte une boîte englobante
      const box = new THREE.Box3().setFromCenterAndSize(
        obstaclePosition,
        obstacleSize
      );
      
      // Calculer l'intersection
      const ray = new THREE.Ray(rayOrigin, rayDirection);
      const intersection = new THREE.Vector3();
      if (ray.intersectBox(box, intersection)) {
        const distance = rayOrigin.distanceTo(intersection);
        if (distance < closestDistance) {
          closestDistance = distance;
        }
      }
    });
    
    // Vérifier les murs
    // Mur avant (Z+)
    const frontWallZ = arenaSize/2;
    if (rayDirection.z > 0) {
      const t = (frontWallZ - rayOrigin.z) / rayDirection.z;
      if (t > 0) {
        const intersectX = rayOrigin.x + rayDirection.x * t;
        const intersectY = rayOrigin.y + rayDirection.y * t;
        if (Math.abs(intersectX) < arenaSize/2 && intersectY >= 0 && intersectY < wallHeight) {
          const distance = t;
          if (distance < closestDistance) {
            closestDistance = distance;
          }
        }
      }
    }
    
    // Mur arrière (Z-)
    const backWallZ = -arenaSize/2;
    if (rayDirection.z < 0) {
      const t = (backWallZ - rayOrigin.z) / rayDirection.z;
      if (t > 0) {
        const intersectX = rayOrigin.x + rayDirection.x * t;
        const intersectY = rayOrigin.y + rayDirection.y * t;
        if (Math.abs(intersectX) < arenaSize/2 && intersectY >= 0 && intersectY < wallHeight) {
          const distance = t;
          if (distance < closestDistance) {
            closestDistance = distance;
          }
        }
      }
    }
    
    // Mur droit (X+)
    const rightWallX = arenaSize/2;
    if (rayDirection.x > 0) {
      const t = (rightWallX - rayOrigin.x) / rayDirection.x;
      if (t > 0) {
        const intersectZ = rayOrigin.z + rayDirection.z * t;
        const intersectY = rayOrigin.y + rayDirection.y * t;
        if (Math.abs(intersectZ) < arenaSize/2 && intersectY >= 0 && intersectY < wallHeight) {
          const distance = t;
          if (distance < closestDistance) {
            closestDistance = distance;
          }
        }
      }
    }
    
    // Mur gauche (X-)
    const leftWallX = -arenaSize/2;
    if (rayDirection.x < 0) {
      const t = (leftWallX - rayOrigin.x) / rayDirection.x;
      if (t > 0) {
        const intersectZ = rayOrigin.z + rayDirection.z * t;
        const intersectY = rayOrigin.y + rayDirection.y * t;
        if (Math.abs(intersectZ) < arenaSize/2 && intersectY >= 0 && intersectY < wallHeight) {
          const distance = t;
          if (distance < closestDistance) {
            closestDistance = distance;
          }
        }
      }
    }
    
    return closestDistance;
  };

  const dqnAgent = new DQNAgent({
    inputSize: 10, // Distance à la cible, angle à la cible, 4 distances aux obstacles, 4 distances aux murs
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
      // Vérifier si l'agent est initialisé
      if (!agentRef.current) return Array(10).fill(0);
      
      // Position et rotation de l'agent
      const agentPos = agentRef.current.translation();
      const agentRot = agentRef.current.rotation();
      // Convertir en types Three.js
      const agentPosition = new THREE.Vector3(agentPos.x, agentPos.y, agentPos.z);
      const agentRotation = new THREE.Quaternion(agentRot.x, agentRot.y, agentRot.z, agentRot.w);
      
      // 1. Position relative de la cible
      const targetVec = new THREE.Vector3(...targetPosition);
      
      // Distance à la cible (normalisée)
      const distanceToTarget = agentPosition.distanceTo(targetVec) / (arenaSize/2);
      
      // Direction vers la cible dans le repère local de l'agent
      const targetDirection = targetVec.clone().sub(agentPosition).normalize();
      const agentForward = new THREE.Vector3(0, 0, 1).applyQuaternion(agentRotation);
      const angleToTarget = Math.atan2(
        agentForward.cross(targetDirection).y,
        agentForward.dot(targetDirection)
      ) / Math.PI; // Normalisé entre -1 et 1
      
      // 2. Distances aux obstacles dans différentes directions
      const raycastAngles = [
        0,           // avant
        Math.PI/4,   // avant-droite
        Math.PI/2,   // droite
        3*Math.PI/4, // arrière-droite
        Math.PI,     // arrière
        -3*Math.PI/4,// arrière-gauche
        -Math.PI/2,  // gauche
        -Math.PI/4   // avant-gauche
      ];
      
      // Calculer les distances normalisées
      const obstacleDistances = raycastAngles.map(angle => {
        const worldAngle = Math.atan2(
          Math.sin(angle) * agentForward.x + Math.cos(angle) * agentForward.z,
          Math.cos(angle) * agentForward.x - Math.sin(angle) * agentForward.z
        );
        
        const distance = getRaycastDistance(agentPosition, worldAngle);
        return Math.min(distance / 15, 1); // Normaliser entre 0 et 1
      });
      
      // Retourner l'observation complète
      return [
        distanceToTarget,
        angleToTarget,
        ...obstacleDistances.slice(0, 8) // Prendre les 8 premières directions
      ];
    },
    applyAction: (action: number | number[]) => {
      console.log(action)
      // À implémenter: déplacer l'agent en fonction de l'action choisie
      // 0: avancer, 1: tourner gauche, 2: tourner droite
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    computeReward: () => {
      // À implémenter: récompense positive si l'agent s'approche de la cible
      // récompense négative s'il s'approche des obstacles
      // récompense très positive s'il atteint la cible
      // récompense très négative si l'agent touche un obstacle ou un mur
      return 0
    },
    isDone: () => {
      // L'épisode se termine si l'agent touche un obstacle ou atteint la cible
      return hasCollidedWithObstacle
    }
  })

  console.log(env)
  
  useFrame((state) => {
    if (spotLightRef.current) {
      spotLightRef.current.position.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 15
      spotLightRef.current.position.z = Math.cos(state.clock.getElapsedTime() * 0.5) * 15
    }
  })
  
  // Fonction pour ajouter un obstacle à la liste des références
  const addObstacleRef = (obstacle: RapierRigidBody | null) => {
    if (obstacle && !obstaclesRef.current.includes(obstacle)) {
      obstaclesRef.current.push(obstacle);
    }
  };
  
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
        ref={addObstacleRef}
        position={[8, 2, 8]} 
        movementType="horizontal" 
        movementSpeed={1.5} 
        color={theme.materials.obstacle.color}
        materialProps={theme.materials.obstacle}
      />
      <Obstacle 
        ref={addObstacleRef}
        position={[-10, 2, 12]} 
        movementType="vertical" 
        movementSpeed={4.3} 
        color={theme.materials.obstacle.color}
        materialProps={theme.materials.obstacle}
      />
      <Obstacle 
        ref={addObstacleRef}
        position={[12, 2, -5]} 
        movementType="circular" 
        movementSpeed={0.9} 
        color={theme.materials.obstacle.color}
        materialProps={theme.materials.obstacle}
      />
      <Obstacle 
        ref={addObstacleRef}
        position={[-5, 2, -15]} 
        movementType="horizontal" 
        movementSpeed={1.9} 
        color={theme.materials.obstacle.color}
        materialProps={theme.materials.obstacle}
      />
      <Obstacle 
        ref={addObstacleRef}
        position={[0, 2, 0]} 
        size={[3, 6, 3]} 
        color={theme.colors.accent}
        materialProps={theme.materials.obstacle}
        movementType="horizontal" 
        movementSpeed={1.4} 
      />
      
      {/* Agent */}
      <SimpleAgent 
        ref={agentRef}
        position={[-15, 1, -15]} 
        onObstacleCollision={handleObstacleCollision}
      />
      
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