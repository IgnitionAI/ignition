import { useRef, forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react'
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
  isTraining?: boolean;
  onEpisodeCountChange?: (count: number) => void;
  onTotalRewardChange?: (reward: number) => void;
  onEpisodeTimeChange?: (timeElapsed: number) => void;
  onEnvironmentReady?: (controls: {
    startTraining: () => void;
    stopTraining: () => void;
    resetEnvironment: () => void;
  }) => void;
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
  { position: [number, number, number], size?: [number, number, number], color?: string, materialProps?: any, movementType?: "none" | "horizontal" | "vertical" | "circular" | "fixed", movementSpeed?: number }, 
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
        case "fixed":
          // Ne pas bouger
          break
      }
      
      // Maintenir la hauteur Y constante (au niveau du sol + moitié de la hauteur)
      newPosition[1] = initialPosition.current[1]
      
      obstacleRef.current.setTranslation(new THREE.Vector3(newPosition[0], newPosition[1], newPosition[2]), true)
    }
  })
  
  return (
    <RigidBody 
      ref={obstacleRef} 
      type="kinematicPosition" 
      position={position} 
      colliders="cuboid" 
      name="obstacle"
      friction={1}
      restitution={0.2}
    >
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

function Experience({ theme = DefaultTheme, isTraining, onEpisodeCountChange, onTotalRewardChange, onEpisodeTimeChange, onEnvironmentReady }: ExperienceProps) {
  const spotLightRef = useRef<THREE.SpotLight>(null)
  const { collected, position: targetPosition } = useTargetStore()
  
  // Références pour l'agent et les obstacles
  const agentRef = useRef<RapierRigidBody>(null)
  const obstaclesRef = useRef<RapierRigidBody[]>([])
  const [hasCollidedWithObstacle, setHasCollidedWithObstacle] = useState(false)
  const [episodeCount, setEpisodeCount] = useState(0);
  const [episodeStartTime, setEpisodeStartTime] = useState<number>(Date.now());
  const [_timeElapsed, setTimeElapsed] = useState<number>(0);
  
  // Références pour suivre les actions et pénaliser les rotations excessives
  const lastActionRef = useRef<number | null>(null);
  const rotationCountRef = useRef<number>(0);
  
  // Fonction pour gérer la collision avec un obstacle
  const handleObstacleCollision = () => {
    console.log("Collision détectée avec un obstacle!");
    setHasCollidedWithObstacle(true)
  }

  // Fonction pour générer une position aléatoire dans l'arène
const getRandomPosition = (maxDistance: number): [number, number, number] => {
  const x = (Math.random() * 2 - 1) * maxDistance;
  const z = (Math.random() * 2 - 1) * maxDistance;
  return [x, 1, z]; // y est fixé à 1 (hauteur du sol + hauteur de l'agent/2)
};
  
  // Dimensions de l'arène
  const arenaSize = 40
  const wallHeight = 6
  const wallThickness = 1
  
  // Fonction pour calculer la distance à l'obstacle le plus proche dans une direction donnée
  const getRaycastDistance = (position: THREE.Vector3, angle: number): number => {
    try {
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
      
      // Filtrer les obstacles valides avant de les parcourir
      const validObstacles = obstaclesRef.current.filter(obs => {
        if (!obs) return false;
        try {
          // Vérifier si l'obstacle est toujours valide en essayant d'accéder à une méthode
          obs.translation();
          return true;
        } catch (e) {
          return false;
        }
      });
      
      // Vérifier les obstacles
      for (const obstacle of validObstacles) {
        try {
          // Vérifier si l'obstacle est toujours valide
          if (!obstacle) continue;
          
          // Essayer d'obtenir la position de l'obstacle de manière sécurisée
          let obstaclePos;
          try {
            obstaclePos = obstacle.translation();
          } catch (error) {
            // Si on ne peut pas obtenir la position, passer à l'obstacle suivant
            continue;
          }
          
          // Vérifier que les coordonnées sont valides
          if (obstaclePos === null || 
              obstaclePos.x === undefined || 
              obstaclePos.y === undefined || 
              obstaclePos.z === undefined) {
            continue;
          }
          
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
        } catch (error) {
          // Ignorer les erreurs pour cet obstacle et continuer avec le suivant
          continue;
        }
      }
      
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
    } catch (error) {
      console.error("Erreur lors du calcul de la distance à l'obstacle le plus proche", error);
      return arenaSize;
    }
  };

  const dqnAgent = new DQNAgent({
    inputSize: 10, // Distance à la cible, angle à la cible, 8 distances aux obstacles/murs
    actionSize: 4,
    lr: 0.005,         // Augmenter davantage le taux d'apprentissage
    gamma: 0.9,        // Réduire encore le facteur d'actualisation pour plus de focus sur les récompenses immédiates
    epsilon: 0.5,      // Augmenter considérablement l'exploration initiale
    epsilonDecay: 0.99, // Ralentir encore la décroissance d'epsilon
    minEpsilon: 0.1,   // Augmenter l'epsilon minimum pour maintenir l'exploration
    batchSize: 64,     // Maintenir la taille du batch
    memorySize: 10000
  })

  const env = new IgnitionEnv({
    agent: dqnAgent,
    getObservation: () => {
      // Vérifier si l'agent est initialisé
      if (!agentRef.current) return Array(10).fill(0);
      
      try {
        // Position et rotation de l'agent
        let agentPos, agentRot;
        try {
          agentPos = agentRef.current.translation();
          agentRot = agentRef.current.rotation();
        } catch (error) {
          console.warn("Erreur lors de l'accès à la position ou rotation de l'agent", error);
          return Array(10).fill(0);
        }
        
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
      } catch (error) {
        console.error("Erreur lors de la génération de l'observation", error);
        return Array(10).fill(0);
      }
    },
applyAction: (action: number | number[]) => {
  // Convertir l'action en nombre si c'est un tableau
  const actionIndex = Array.isArray(action) ? action.indexOf(Math.max(...action)) : action;
  
  // Vérifier si l'agent est initialisé
  if (!agentRef.current) return;
  
  try {
    // Paramètres de mouvement
    const speed = 1.0; // Augmenter la vitesse de déplacement
    const rotationSpeed = Math.PI / 32; // Réduire la vitesse de rotation
    
    // Obtenir la position et rotation actuelles
    let agentPos, agentRot;
    try {
      agentPos = agentRef.current.translation();
      agentRot = agentRef.current.rotation();
    } catch (error) {
      console.warn("Erreur lors de l'accès à la position ou rotation de l'agent", error);
      return;
    }
    
    // Convertir en types Three.js
    const position = new THREE.Vector3(agentPos.x, agentPos.y, agentPos.z);
    const rotation = new THREE.Quaternion(agentRot.x, agentRot.y, agentRot.z, agentRot.w);
    
    // Calculer la direction de l'agent
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(rotation);
    
    // Appliquer l'action en fonction de l'index
    switch(actionIndex) {
      case 0: // Avancer
        // Calculer la nouvelle position
        const newPosition = new THREE.Vector3(
          position.x + direction.x * speed,
          position.y,
          position.z + direction.z * speed
        );
        
        // Appliquer la nouvelle position
        agentRef.current.setTranslation(newPosition, true);
        break;
        
      case 1: // Tourner à gauche
        // Créer un quaternion pour la rotation à gauche
        const leftRotation = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), 
          rotationSpeed
        );
        
        // Appliquer la rotation relative (combiner avec la rotation actuelle)
        const newLeftRotation = rotation.clone().multiply(leftRotation);
        agentRef.current.setRotation(newLeftRotation, true);
        
        // Mettre à jour la référence de la dernière action
        lastActionRef.current = 1;
        rotationCountRef.current += 1;
        break;
        
      case 2: // Tourner à droite
        // Créer un quaternion pour la rotation à droite
        const rightRotation = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), 
          -rotationSpeed
        );
        
        // Appliquer la rotation relative (combiner avec la rotation actuelle)
        const newRightRotation = rotation.clone().multiply(rightRotation);
        agentRef.current.setRotation(newRightRotation, true);
        
        // Mettre à jour la référence de la dernière action
        lastActionRef.current = 2;
        rotationCountRef.current += 1;
        break;
        
      case 3: // Reculer
        // Calculer la nouvelle position (inverse de la direction)
        const newBackPosition = new THREE.Vector3(
          position.x - direction.x * speed,
          position.y,
          position.z - direction.z * speed
        );
        
        // Appliquer la nouvelle position
        agentRef.current.setTranslation(newBackPosition, true);
        break;
    }
    
    // Réinitialiser le compteur de rotation si l'action n'est pas une rotation
    if (actionIndex !== 1 && actionIndex !== 2) {
      rotationCountRef.current = 0;
    }
  } catch (error) {
    console.error("Erreur lors de l'application de l'action", error);
  }
},
computeReward: () => {
  // Vérifier si l'agent est initialisé
  if (!agentRef.current) return 0;
  
  try {
    // Position de l'agent
    let agentPos;
    try {
      agentPos = agentRef.current.translation();
    } catch (error) {
      console.warn("Erreur lors de l'accès à la position de l'agent", error);
      return 0;
    }
    
    // Convertir en Vector3 de Three.js
    const agentPosition = new THREE.Vector3(agentPos.x, agentPos.y, agentPos.z);
    
    // Position de la cible
    const targetVec = new THREE.Vector3(...targetPosition);
    
    // 1. Récompense basée sur la distance à la cible
    const distanceToTarget = agentPosition.distanceTo(targetVec);
    
    // Récompense inversement proportionnelle à la distance
    // Plus l'agent est proche de la cible, plus la récompense est grande
    let reward = 1 / (1 + distanceToTarget);
    
    // 2. Bonus si très proche de la cible (< 2 unités)
    if (distanceToTarget < 2) {
      reward += 5;
    }
    
    // 3. Pénalité pour proximité avec obstacles
    // Vérifier les obstacles proches
    let minObstacleDistance = Infinity;
    
    // Filtrer les obstacles valides avant de les parcourir
    const validObstacles = obstaclesRef.current.filter(obs => {
      if (!obs) return false;
      try {
        // Vérifier si l'obstacle est toujours valide en essayant d'accéder à une méthode
        obs.translation();
        return true;
      } catch (e) {
        return false;
      }
    });
    
    for (const obstacle of validObstacles) {
      try {
        // Vérifier si l'obstacle est toujours valide
        if (!obstacle) continue;
        
        // Essayer d'obtenir la position de l'obstacle de manière sécurisée
        let obstaclePos;
        try {
          obstaclePos = obstacle.translation();
        } catch (error) {
          // Si on ne peut pas obtenir la position, passer à l'obstacle suivant
          console.warn("Erreur lors de l'accès à la position d'un obstacle", error);
          continue;
        }
        
        // Vérifier que les coordonnées sont valides
        if (obstaclePos === null || 
            obstaclePos.x === undefined || 
            obstaclePos.y === undefined || 
            obstaclePos.z === undefined) {
          continue;
        }
        
        const obstaclePosition = new THREE.Vector3(obstaclePos.x, obstaclePos.y, obstaclePos.z);
        const distance = agentPosition.distanceTo(obstaclePosition);
        
        if (distance < minObstacleDistance) {
          minObstacleDistance = distance;
        }
      } catch (error) {
        // Ignorer les erreurs pour cet obstacle et continuer avec le suivant
        console.warn("Erreur lors du calcul de la distance à un obstacle", error);
        continue;
      }
    }
    
    // Pénalité si trop proche d'un obstacle (< 5 unités)
    if (minObstacleDistance < 5) {
      // Plus l'agent est proche, plus la pénalité est grande
      reward -= 5 * (1 - minObstacleDistance/5);
    }
    
    // 4. Pénalité pour proximité avec les murs
    const distanceToWallX = arenaSize/2 - Math.abs(agentPosition.x);
    const distanceToWallZ = arenaSize/2 - Math.abs(agentPosition.z);
    const minWallDistance = Math.min(distanceToWallX, distanceToWallZ);
    
    if (minWallDistance < 2) {
      reward -= 2 * (1 - minWallDistance/2);
    }
    
    // 5. Forte pénalité si collision avec obstacle (devrait rarement arriver grâce à isDone)
    if (hasCollidedWithObstacle) {
      reward -= 50; // Augmenter la pénalité pour collision
    }
    
    // 6. Pénalité pour les rotations excessives (décourager l'agent de tourner sur lui-même)
    if (rotationCountRef.current > 3) {
      reward -= 0.5 * (rotationCountRef.current - 3);
    }
    
    // 7. Petite pénalité de temps pour encourager l'efficacité
    reward -= 0.01;
    
    return reward;
  } catch (error) {
    console.error("Erreur lors du calcul de la récompense", error);
    return 0;
  }
},
isDone: () => {
  // Vérifier si l'agent est initialisé
  if (!agentRef.current) return false;
  
  try {
    // 1. Vérifier si l'agent a touché un obstacle
    if (hasCollidedWithObstacle) {
      return true;
    }
    
    // 2. Vérifier si l'épisode a dépassé la durée maximale
    const currentTime = Date.now();
    if (currentTime - episodeStartTime > 60 * 1000) {
      console.log("Épisode terminé : durée maximale atteinte (60 secondes)");
      return true;
    }
    
    // 3. Vérifier si l'agent a atteint la cible
    let agentPos;
    try {
      agentPos = agentRef.current.translation();
    } catch (error) {
      console.warn("Erreur lors de l'accès à la position de l'agent", error);
      return false;
    }
    
    const agentPosition = new THREE.Vector3(agentPos.x, agentPos.y, agentPos.z);
    const targetVec = new THREE.Vector3(...targetPosition);
    
    // Si l'agent est assez proche de la cible, l'épisode est terminé
    if (agentPosition.distanceTo(targetVec) < 2) {
      return true;
    }
    
    // 4. Vérifier si l'agent est sorti de l'arène
    const distanceToWallX = arenaSize/2 - Math.abs(agentPosition.x);
    const distanceToWallZ = arenaSize/2 - Math.abs(agentPosition.z);
    
    if (distanceToWallX < 0 || distanceToWallZ < 0) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification de fin d'épisode", error);
    return false;
  }
},
onReset: () => {
  // Réinitialiser l'état de collision
  setHasCollidedWithObstacle(false);
  
  // Réinitialiser la position de l'agent
  if (agentRef.current) {
    // Position initiale de l'agent
    const randomPos = getRandomPosition(arenaSize/2);
    const initialPosition = new THREE.Vector3(randomPos[0], randomPos[1], randomPos[2]);
    agentRef.current.setTranslation(initialPosition, true);
    
    // Réinitialiser la rotation de l'agent (orientation vers l'avant)
    agentRef.current.setRotation(new THREE.Quaternion(), true);
    
    // Réinitialiser les vitesses
    agentRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    agentRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }
  // Incrémenter le compteur d'épisodes
  setEpisodeCount(prev => {
    const newCount = prev + 1;
    console.log(`Incrémentation du compteur d'épisodes: ${prev} -> ${newCount}`);
    // Notifier le changement d'épisode si le callback est fourni
    if (onEpisodeCountChange) {
      console.log("Appel du callback onEpisodeCountChange");
      onEpisodeCountChange(newCount);
    }
    return newCount;
  });
  // Réinitialiser le temps de début de l'épisode
  setEpisodeStartTime(Date.now());
}
  })
  
  // Exposer les contrôles d'entraînement
  useEffect(() => {
    if (onEnvironmentReady) {
      onEnvironmentReady({
        startTraining: () => env.start(),
        stopTraining: () => env.stop(),
        resetEnvironment: () => env.reset()
      });
    }
  }, [onEnvironmentReady]);
  
  // Mettre à jour les compteurs lors de l'entraînement
  useEffect(() => {
    if (!isTraining) return;
    
    // Fonction pour suivre les épisodes et les récompenses
    const trackProgress = () => {
      // Mettre à jour le compteur d'épisodes
      if (onEpisodeCountChange) {
        onEpisodeCountChange(env.stepCount);
      }
      
      // Calculer la récompense approximative
      if (onTotalRewardChange && agentRef.current) {
        const agentPos = agentRef.current.translation();
        const agentPosition = new THREE.Vector3(agentPos.x, agentPos.y, agentPos.z);
        const targetVec = new THREE.Vector3(...targetPosition);
        const distanceToTarget = agentPosition.distanceTo(targetVec);
        const reward = 1 / (1 + distanceToTarget);
        onTotalRewardChange(reward);
      }
    };
    
    // Suivre les progrès toutes les 500ms
    const intervalId = setInterval(trackProgress, 500);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isTraining, onEpisodeCountChange, onTotalRewardChange]);
  
  // Mettre à jour le temps écoulé toutes les secondes
  useEffect(() => {
    if (!isTraining) return;
    
    const intervalId = setInterval(() => {
      const elapsed = Math.min(Math.floor((Date.now() - episodeStartTime) / 1000), 60);
      setTimeElapsed(elapsed);
      
      // Notifier le composant parent du temps écoulé
      if (onEpisodeTimeChange) {
        onEpisodeTimeChange(elapsed);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [episodeStartTime, isTraining, onEpisodeTimeChange]);
  
  useFrame((state) => {
    if (spotLightRef.current) {
      spotLightRef.current.position.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 15
      spotLightRef.current.position.z = Math.cos(state.clock.getElapsedTime() * 0.5) * 15
    }
  })
  
  // Vérifier manuellement les collisions entre l'agent et les obstacles
  useFrame(() => {
    // Vérifier que l'agent existe
    if (!agentRef.current) return;
    
    try {
      // Vérifier qu'il y a des obstacles valides
      const validObstacles = obstaclesRef.current.filter(obs => {
        if (!obs) return false;
        try {
          // Vérifier si l'obstacle est toujours valide en essayant d'accéder à une méthode
          obs.translation();
          return true;
        } catch (e) {
          return false;
        }
      });
      if (validObstacles.length === 0) return;
      
      // Essayer d'obtenir la position de l'agent
      let agentPosition: THREE.Vector3;
      try {
        const agentPos = agentRef.current.translation();
        agentPosition = new THREE.Vector3(agentPos.x, agentPos.y, agentPos.z);
      } catch (e) {
        // Si on ne peut pas obtenir la position, sortir
        return;
      }
      
      // Rayon de collision de l'agent (moitié de sa taille + marge)
      const agentRadius = 0.6;
      
      // Vérifier la collision avec chaque obstacle
      for (const obstacle of validObstacles) {
        try {
          // Essayer d'obtenir la position de l'obstacle
          const obstaclePos = obstacle.translation();
          const obstaclePosition = new THREE.Vector3(obstaclePos.x, obstaclePos.y, obstaclePos.z);
          
          // Distance entre l'agent et l'obstacle
          const distance = agentPosition.distanceTo(obstaclePosition);
          
          // Rayon de collision de l'obstacle (approximation)
          const obstacleRadius = 1.0;
          
          // Si la distance est inférieure à la somme des rayons, il y a collision
          if (distance < (agentRadius + obstacleRadius)) {
            console.log("Collision détectée dans useFrame!");
            handleObstacleCollision();
            
            // Réinitialiser l'agent à une position aléatoire
            if (env) {
              console.log("Réinitialisation de l'environnement via env.reset()");
              env.reset();
              
              // Réinitialiser le temps de début de l'épisode
              setEpisodeStartTime(Date.now());
              
              // Incrémenter manuellement le compteur d'épisodes
              setEpisodeCount(prev => {
                const newCount = prev + 1;
                console.log(`Incrémentation du compteur d'épisodes: ${prev} -> ${newCount}`);
                // Notifier le changement d'épisode si le callback est fourni
                if (onEpisodeCountChange) {
                  console.log("Appel du callback onEpisodeCountChange");
                  onEpisodeCountChange(newCount);
                }
                return newCount;
              });
            } else {
              // Réinitialisation manuelle si nécessaire
              const randomPos = getRandomPosition(arenaSize/2);
              const newPosition = new THREE.Vector3(randomPos[0], randomPos[1], randomPos[2]);
              agentRef.current.setTranslation(newPosition, true);
              agentRef.current.setLinvel(new THREE.Vector3(0, 0, 0), true);
              agentRef.current.setAngvel(new THREE.Vector3(0, 0, 0), true);
              
              // Incrémenter manuellement le compteur d'épisodes
              setEpisodeCount(prev => {
                const newCount = prev + 1;
                console.log(`Incrémentation du compteur d'épisodes: ${prev} -> ${newCount}`);
                // Notifier le changement d'épisode si le callback est fourni
                if (onEpisodeCountChange) {
                  console.log("Appel du callback onEpisodeCountChange");
                  onEpisodeCountChange(newCount);
                }
                return newCount;
              });
            }
            
            break; // Sortir après la première collision détectée
          }
        } catch (error) {
          // Ignorer les erreurs pour cet obstacle et continuer avec le suivant
          continue;
        }
      }
    } catch (error) {
      // Ignorer les erreurs générales
      console.warn("Erreur lors de la vérification des collisions", error);
    }
  });
  
  // Fonction pour ajouter un obstacle à la liste des références
  const addObstacleRef = (obstacle: RapierRigidBody | null) => {
    if (obstacle && !obstaclesRef.current.includes(obstacle)) {
      obstaclesRef.current = [...obstaclesRef.current, obstacle];
    }
  };
  
  // Fonction pour nettoyer les références invalides
  const cleanupRefs = useCallback(() => {
    // Filtrer les références invalides
    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      if (!obs) return false;
      try {
        // Vérifier si l'obstacle est toujours valide en essayant d'accéder à une méthode
        obs.translation();
        return true;
      } catch (e) {
        return false;
      }
    });
  }, []);
  
  // Nettoyer les références à chaque frame
  useFrame(() => {
    cleanupRefs();
  });
  
  useEffect(() => {
    console.log(`Épisode actuel: ${episodeCount}`);
  }, [episodeCount]);
  
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
        shadow-camera-top={-arenaSize/2}
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