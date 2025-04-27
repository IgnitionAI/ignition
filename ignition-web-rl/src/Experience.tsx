import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Grid, Box, Environment, SpotLight } from '@react-three/drei'
import { RapierRigidBody, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import Logo3D from './logo-3d'
import SimpleAgent from './simple-agent'
import { DefaultTheme, ThemeProps } from './themes'
import { useTargetStore } from './store/targetStore'
import Target from './target'
import { useTrainingStore } from './store/trainingStore'

/*-------------------IgnitionAI---------------------*/
import { DQNAgent } from '@ignitionai/backend-tfjs'
import { IgnitionEnv } from "@ignitionai/core"
/*--------------------------------------------------*/
// Propriétés pour l'expérience
interface ExperienceProps {
  theme?: ThemeProps;
}

const MOVEMENT_SPEED = 5;

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
  const agentRef = useRef<RapierRigidBody>(null)
  const targetRef = useRef<RapierRigidBody>(null)
  const episodeStartTime = useRef<number>(Date.now());
  const { collected } = useTargetStore()

  const dqnAgent = new DQNAgent({
    inputSize: 9,           // ⚡ Maintenant 9 entrées
    actionSize: 4,
    lr: 0.001,
    gamma: 0.99,
    epsilon: 0.1,
    epsilonDecay: 0.999,
    minEpsilon: 0.01,
    batchSize: 64,          // 🔥 un peu plus gros pour stabiliser
    memorySize: 20000,      // 🔥 plus de mémoire
    hiddenLayers: [128, 128] // 🧠 un peu plus gros pour mieux exploiter l'info
  });
  
  const env = new IgnitionEnv({
    agent: dqnAgent,
    getObservation: () => {
      const agentPos = agentRef.current?.translation() || { x: 0, y: 0, z: 0 };
      const targetPos = targetRef.current?.translation() || { x: 0, y: 0, z: 0 };
    
      const distanceToTarget = Math.sqrt(
        Math.pow(agentPos.x - targetPos.x, 2) + 
        Math.pow(agentPos.z - targetPos.z, 2)
      );
    
      const arenaHalfSize = 20; // ton arène fait 40x40
      const distLeftWall = agentPos.x + arenaHalfSize;
      const distRightWall = arenaHalfSize - agentPos.x;
      const distTopWall = arenaHalfSize - agentPos.z;
      const distBottomWall = agentPos.z + arenaHalfSize;
    
      const normalize = (d: number) => Math.min(1, d / arenaHalfSize);
    
      return [
        normalize(agentPos.x),
        normalize(agentPos.z),
        normalize(targetPos.x),
        normalize(targetPos.z),
        normalize(distanceToTarget / (arenaHalfSize * 2)),
        normalize(distLeftWall),
        normalize(distRightWall),
        normalize(distTopWall),
        normalize(distBottomWall),
      ];
    },
    
    applyAction: (action: number | number[]) => {
      if (!agentRef.current) {
        console.warn('Agent body ref not found');
        return;
      }
    
      const speed = MOVEMENT_SPEED;        // Base speed
      const boostFactor = 1.5;              // Boost multiplié par 1.5
      const frictionFactor = 0.9;           // Ralentissement naturel (ex: 90% de la vitesse précédente)
      const velocity = agentRef.current.linvel();  // Vitesse actuelle
    
      // Détecter s'il est quasiment arrêté
      const isAlmostStopped = Math.abs(velocity.x) < 0.1 && Math.abs(velocity.z) < 0.1;
      
      // Boost uniquement si l'agent est quasi arrêté (exploration facilitée)
      const currentSpeed = isAlmostStopped ? speed * boostFactor : speed;
    
      let newVelocity = new THREE.Vector3(0, 0, 0);
    
      if (typeof action === 'number') {
        switch (action) {
          case 0: // Gauche
            newVelocity.set(-currentSpeed, 0, 0);
            break;
          case 1: // Droite
            newVelocity.set(currentSpeed, 0, 0);
            break;
          case 2: // Avant (vers le -Z)
            newVelocity.set(0, 0, -currentSpeed);
            break;
          case 3: // Arrière (vers le +Z)
            newVelocity.set(0, 0, currentSpeed);
            break;
          default:
            // Pas d'action valide = ralentissement naturel
            newVelocity.set(velocity.x * frictionFactor, 0, velocity.z * frictionFactor);
        }
      }
    
      // Appliquer la nouvelle vitesse
      agentRef.current.setLinvel(newVelocity, true);
    
      // Log optionnel pour debug
      console.log(`Action ${action}: Set velocity to [${newVelocity.x.toFixed(2)}, ${newVelocity.y.toFixed(2)}, ${newVelocity.z.toFixed(2)}]`);
    },
    computeReward: () => {
      if (!agentRef.current || !targetRef.current) return 0;
    
      const agentPos = agentRef.current.translation();
      const targetPos = targetRef.current.translation();
    
      const distanceToTarget = Math.sqrt(
        Math.pow(agentPos.x - targetPos.x, 2) + 
        Math.pow(agentPos.z - targetPos.z, 2)
      );
    
      const arenaHalfSize = 20;
    
      // Calcul de la distance aux murs
      const distLeftWall = agentPos.x + arenaHalfSize;
      const distRightWall = arenaHalfSize - agentPos.x;
      const distTopWall = arenaHalfSize - agentPos.z;
      const distBottomWall = agentPos.z + arenaHalfSize;
    
      const minWallDist = Math.min(distLeftWall, distRightWall, distTopWall, distBottomWall);
    
      let reward = 0;
    
      // ➔ Bonus pour se rapprocher de la cible
      reward += 1 / (1 + distanceToTarget);
    
      // ➔ Très gros bonus si atteint la cible
      if (distanceToTarget < 1.5) {
        reward += 10;
      }
    
      // ➔ Pénalité si trop proche d'un mur
      if (minWallDist < 2) {
        reward -= 2; // pénalité immédiate
      }
      useTrainingStore.getState().addReward(reward); 
      return reward;
    },    
    isDone: () => {
      if (!agentRef.current) return false;
    
      const now = Date.now();
      const elapsedSeconds = (now - episodeStartTime.current) / 1000; // en secondes
    
      const agentPos = agentRef.current.translation();
      const arenaHalfSize = 20;
    
      // Timeout après 30 secondes max
      if (elapsedSeconds > 30) {
        console.log('⏳ Temps écoulé, fin de l’épisode.');
        useTrainingStore.getState().incrementEpisode();
        return true;
      }
      
      // Agent sorti de l'arène
      if (Math.abs(agentPos.x) > arenaHalfSize || Math.abs(agentPos.z) > arenaHalfSize) {
        console.log('❌ Agent sorti de l’arène');
        useTrainingStore.getState().incrementEpisode();
        return true;
      }
    
      // Agent atteint la cible
      if (targetRef.current) {
        const targetPos = targetRef.current.translation();
        const distanceToTarget = Math.sqrt(
          Math.pow(agentPos.x - targetPos.x, 2) + 
          Math.pow(agentPos.z - targetPos.z, 2)
        );
        if (distanceToTarget < 1.5) {
          console.log('🏆 Agent a atteint la cible');
          useTrainingStore.getState().incrementEpisode();
          return true;
        }
      }
    
      return false;
    },    
    onReset: () => {
      if (agentRef.current) {
        agentRef.current.setLinvel(new THREE.Vector3(0, 0, 0), true);
        agentRef.current.setAngvel(new THREE.Vector3(0, 0, 0), true);
        agentRef.current.setTranslation(new THREE.Vector3(
          -15 + Math.random() * 30,  // Random spawn
          1,
          -15 + Math.random() * 30
        ), true);
    
        console.log('🔄 Agent repositionné proprement');
      }
      episodeStartTime.current = Date.now();
    }
  })

 // console.log(env)

  useEffect(() => {
    if (agentRef.current) {
      // Reset de l'agent proprement
      agentRef.current.setLinvel(new THREE.Vector3(0, 0, 0), true)
      agentRef.current.setAngvel(new THREE.Vector3(0, 0, 0), true)
      agentRef.current.setTranslation(new THREE.Vector3(-15, 1, -15), true)

      console.log('🛠️ Agent bien réinitialisé')
    }
  }, [])
  
  useFrame((state, delta) => {
    const trainingStore = useTrainingStore.getState();
  
    if (trainingStore.isTraining) {
      // ➔ Ajouter ici le temps écoulé
      trainingStore.incrementElapsedTime(delta);
  
      // ➔ Calculer la progression vers la target
      if (agentRef.current && targetRef.current) {
        const agentPos = agentRef.current.translation();
        const targetPos = targetRef.current.translation();
        const maxDistance = 40; // Distance max possible (si arenaSize = 40)
  
        const distance = Math.sqrt(
          Math.pow(agentPos.x - targetPos.x, 2) + 
          Math.pow(agentPos.z - targetPos.z, 2)
        );
  
        // Progression inversée (plus on est proche, plus la progress approche de 1)
        const progress = Math.min(1, 1 - (distance / maxDistance));
        trainingStore.setProgressToTarget(progress);
      }
  
      env.step(); // ➔ Très important : continuer à faire avancer l'agent
    }
  
    if (spotLightRef.current) {
      spotLightRef.current.position.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 15;
      spotLightRef.current.position.z = Math.cos(state.clock.getElapsedTime() * 0.5) * 15;
    }
  });
  
  
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
      <SimpleAgent ref={agentRef} position={[-15, 1, -15]} theme={theme} />
      
      {/* Target (cible) */}
      {!collected && <Target ref={targetRef} theme={theme} />}
      
      {/* Logo IgnitionAI */}
      <Logo3D theme={theme} />
      
      {/* Environnement HDRI pour les reflets */}
      <Environment preset="city" />
    </>
  )
}
export default Experience