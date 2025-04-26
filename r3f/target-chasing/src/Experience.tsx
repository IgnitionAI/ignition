import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useRef, forwardRef, useImperativeHandle } from "react";
import { Vector3 } from "three";
import { DQNAgent } from "@ignitionai/backend-tfjs";
import { IgnitionEnv } from "@ignitionai/core";
import React from "react";
import { useTrainingStore } from "./store/trainingStore";

const MOVEMENT_SPEED = 100;

// Constantes pour les limites du plateau
const PLATEAU_LIMITS = {
  minX: -500, // Moitié de la largeur du ground (1000/2)
  maxX: 500,  // Moitié de la largeur du ground (1000/2)
  minY: -1,   // Légèrement en-dessous du ground
  maxY: 100,  // Hauteur maximale
  minZ: -500, // Moitié de la profondeur du ground (1000/2)
  maxZ: 500   // Moitié de la profondeur du ground (1000/2)
};

// Fonction pour générer une position aléatoire pour la cible
function getRandomTargetPosition(): [number, number, number] {
  // Limiter la zone où la cible peut apparaître pour éviter qu'elle soit trop près des bords
  const margin = 100; // Marge par rapport aux bords
  const x = Math.random() * (PLATEAU_LIMITS.maxX - PLATEAU_LIMITS.minX - 2 * margin) + PLATEAU_LIMITS.minX + margin;
  const y = 10; // Hauteur fixe pour la cible
  const z = Math.random() * (PLATEAU_LIMITS.maxZ - PLATEAU_LIMITS.minZ - 2 * margin) + PLATEAU_LIMITS.minZ + margin;
  
  return [x, y, z];
}

function Ground() {
  return (
    <RigidBody type="fixed">
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[1000, 1, 1000]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </RigidBody>
  );
}

function Cible({cibleRef, position}: {cibleRef: React.RefObject<RapierRigidBody | null>, position: [number, number, number]}) {
  // Utiliser la position fournie en prop
  return (
    <RigidBody  
      ref={cibleRef}
      type="kinematicPosition" 
      position={position} 
      shape="cuboid"
      linearDamping={0.5}
      mass={1}
      friction={0}
      lockRotations
      sensor // Ajouter cette propriété pour que la cible soit un capteur et non un objet solide
    >
      <mesh castShadow>
        <boxGeometry args={[20, 20, 20]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </RigidBody>
  );
}

const Agent = forwardRef(function Agent({targetPosition}: {targetPosition: [number, number, number]}, ref) { 
  // Références et états
  const bodyRef = useRef<RapierRigidBody>(null);
  const initialPosition: [number, number, number] = [100, 10, 100]; // Position de départ éloignée
  
  // Utiliser le store Zustand au lieu des useState - ne garder que ce qui est nécessaire
  const { 
    isTraining, setIsTraining,
    episodeCount, setEpisodeCount,
    setReward,
    bestReward, setBestReward,
    episodeSteps, setEpisodeSteps,
    setReachedTarget,
    episodeTime, setEpisodeTime,
    episodeStartTime, setEpisodeStartTime,
    setSuccessCount,
    difficulty, setDifficulty,
    setLastAction,
  } = useTrainingStore();
  
  // Référence à l'environnement (initialisé une seule fois)
  const envRef = useRef<IgnitionEnv | null>(null);
  
  // Référence à la dernière distance pour calculer la progression
  const lastDistance = useRef(Infinity);
  
  // Calculer la position initiale en fonction de la difficulté
  const getStartingPosition = (): [number, number, number] => {
    // Si difficulté = 0, on commence très proche de la cible
    if (difficulty === 0) {
      return [targetPosition[0] + 30, targetPosition[1], targetPosition[2] + 30];
    }
    // Si difficulté = 1, on commence à distance moyenne
    else if (difficulty === 1) {
      return [targetPosition[0] + 60, targetPosition[1], targetPosition[2] + 60];
    }
    // Sinon, on commence à la position normale
    return initialPosition;
  };
  
  // Créer l'environnement s'il n'existe pas encore
  if (!envRef.current) {
    console.log("🔄 Initialisation de l'environnement d'apprentissage");
    
    const dqnAgent = new DQNAgent({
      actionSize: 4,
      inputSize: 9,
      epsilon: 0.9,            // moins haut
      epsilonDecay: 0.97,      // decay plus rapide
      minEpsilon: 0.05,
      gamma: 0.99,
      lr: 0.001,
      batchSize: 128,          // batch plus large
      hiddenLayers: [64, 64],
      memorySize: 100000,
      targetUpdateFrequency: 200,
    });
    
    envRef.current = new IgnitionEnv({
      agent: dqnAgent,
      getObservation: () => {
        const pos = bodyRef.current?.translation() || { x: 0, y: 0, z: 0 };
        
        // Direction vers la cible (vecteur normalisé)
        const dirX = targetPosition[0] - pos.x;
        const dirY = targetPosition[1] - pos.y;
        const dirZ = targetPosition[2] - pos.z;
        const dirMagnitude = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
        
        // Normaliser les distances aux limites
        const distToMinX = (pos.x - PLATEAU_LIMITS.minX) / 1000;
        const distToMaxX = (PLATEAU_LIMITS.maxX - pos.x) / 1000;
        const distToMinZ = (pos.z - PLATEAU_LIMITS.minZ) / 1000;
        const distToMaxZ = (PLATEAU_LIMITS.maxZ - pos.z) / 1000;
        const distToGround = (pos.y - PLATEAU_LIMITS.minY) / 100;
        
        return [
          dirX / (dirMagnitude + 0.001),  // Direction normalisée X vers la cible
          dirY / (dirMagnitude + 0.001),  // Direction normalisée Y vers la cible 
          dirZ / (dirMagnitude + 0.001),  // Direction normalisée Z vers la cible
          dirMagnitude / 1000,            // Distance normalisée
          distToMinX,                     // Distance à la limite X minimale
          distToMaxX,                     // Distance à la limite X maximale
          distToGround,                   // Distance au sol
          distToMinZ,                     // Distance à la limite Z minimale
          distToMaxZ,                     // Distance à la limite Z maximale
        ];
      },
      applyAction: (action: number | number[]) => {
        // Incrémenter le compteur d'étapes à chaque action
        setEpisodeSteps(prev => prev + 1);
        
        // Tester si le Rigidbody existe
        if (!bodyRef.current) {
          console.error("❌ bodyRef.current est null!");
          return;
        }
        
        // Vérifier l'état actuel de l'agent
        const pos = bodyRef.current.translation();
        const shouldRandomize = episodeSteps < 20 && Math.random() < 0.5;
        
        if (Array.isArray(action)) {
          bodyRef.current.setLinvel(new Vector3(
            action[0] * MOVEMENT_SPEED, 
            action[1] * MOVEMENT_SPEED, 
            action[2] * MOVEMENT_SPEED
          ), true);
        } else {
          let finalAction = action;
          
          // Parfois, choisir une action aléatoire au début
          if (shouldRandomize) {
            finalAction = Math.floor(Math.random() * 4);
            console.log(`🎲 Action randomisée: ${finalAction}`);
          }
          
          setLastAction(finalAction);
          
          // TRÈS grandes forces pour s'assurer que l'agent bouge
          const velocity = MOVEMENT_SPEED * 5;
          
          // Utiliser setLinvel pour un mouvement direct plutôt que des impulsions
          switch(finalAction) {
            case 0: // Gauche
              console.log("⬅️ Mouvement: GAUCHE");
              bodyRef.current.setLinvel(new Vector3(-velocity, 0, 0), true); 
              break;
            case 1: // Droite
              console.log("➡️ Mouvement: DROITE");
              bodyRef.current.setLinvel(new Vector3(velocity, 0, 0), true); 
              break; 
            case 2: // Avant (vers la cible sur Z)
              console.log("⬆️ Mouvement: AVANT");
              bodyRef.current.setLinvel(new Vector3(0, 0, -velocity), true); 
              break;
            case 3: // Arrière
              console.log("⬇️ Mouvement: ARRIÈRE");
              bodyRef.current.setLinvel(new Vector3(0, 0, velocity), true); 
              break;
            default:
              bodyRef.current.setLinvel(new Vector3(0, 0, 0), true);
          }
          
          // Forcer les logs à chaque action pour débogage
          console.log(`Action: ${finalAction}, Position: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]`);
        }
      },
      computeReward: () => {
        const pos = bodyRef.current?.translation() || { x: 0, y: 0, z: 0 };
        const distance = Math.sqrt(
          Math.pow(pos.x - targetPosition[0], 2) +
          Math.pow(pos.y - targetPosition[1], 2) +
          Math.pow(pos.z - targetPosition[2], 2)
        );
        
        // Calculer la récompense
        let calculatedReward = 0;
        
        // Vérifier si l'agent est sorti du plateau - forte pénalité
        if (pos.x < PLATEAU_LIMITS.minX || pos.x > PLATEAU_LIMITS.maxX ||
            pos.y < PLATEAU_LIMITS.minY || pos.y > PLATEAU_LIMITS.maxY ||
            pos.z < PLATEAU_LIMITS.minZ || pos.z > PLATEAU_LIMITS.maxZ) {
          return -100; // Pénalité pour être sorti
        }
        
        // Vérifier si l'agent a atteint la cible - énorme récompense
        if (distance < 25) {
          console.log(`🏆 TOUCHÉ! Distance = ${distance.toFixed(2)}`);
          setReachedTarget(true);
          // Incrémenter immédiatement le succès pour s'assurer qu'il est compté
          setSuccessCount(prev => {
            console.log(`✅ Succès incrémenté: ${prev} -> ${prev + 1}`);
            // Augmenter la difficulté après plusieurs succès
            if ((prev + 1) % 3 === 0) {
              setDifficulty(prevDiff => Math.min(prevDiff + 1, 2));
              console.log(`🔼 Difficulté augmentée à ${Math.min((prev + 1) % 3 + 1, 3)}`);
            }
            return prev + 1;
          });
          return 100; // Récompense très élevée pour atteindre la cible
        }
        
        const proximityReward = Math.max(0, 2 * (1 - distance / 200)); // au lieu de 1x
        calculatedReward = proximityReward;
        
        // Récompense additionnelle si l'agent se rapproche de la cible
        const distanceDelta = lastDistance.current - distance;
        if (distanceDelta > 0) {
          // Bonus pour se rapprocher
          calculatedReward += 0.2; 
        } else {
          // Pénalité pour s'éloigner
          calculatedReward -= 0.1;
        }
        
        // Mettre à jour la dernière distance
        lastDistance.current = distance;
        
        // Log de débogage
        if (episodeSteps % 60 === 0) {
          console.log(`Distance: ${distance.toFixed(2)}, Récompense: ${calculatedReward.toFixed(2)}`);
        }
        
        // Mettre à jour les stats pour l'UI
        setReward(calculatedReward);
        if (calculatedReward > bestReward) {
          setBestReward(calculatedReward);
        }
        
        return calculatedReward;
      },
      isDone: () => {
        // Un épisode se termine si:
        // 1. L'agent a atteint la cible
        // 2. Plus de 20 secondes se sont écoulées
        // 3. L'agent est sorti du plateau (Ground)
        
        // Vérification immédiate si l'agent est sorti du plateau
        const pos = bodyRef.current?.translation() || { x: 0, y: 0, z: 0 };
        
        // Vérifier si l'agent est sorti du plateau
        if (pos.x < PLATEAU_LIMITS.minX || pos.x > PLATEAU_LIMITS.maxX ||
            pos.y < PLATEAU_LIMITS.minY || // Vérifie s'il est tombé sous le ground
            pos.z < PLATEAU_LIMITS.minZ || pos.z > PLATEAU_LIMITS.maxZ) {
          
          console.log(`L'agent est sorti du plateau: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]`);
          return true; // Terminer l'épisode immédiatement
        }
        
        // Vérifier si l'agent a atteint la cible
        const distance = Math.sqrt(
          Math.pow(pos.x - targetPosition[0], 2) +
          Math.pow(pos.y - targetPosition[1], 2) +
          Math.pow(pos.z - targetPosition[2], 2)
        );
        
        if (distance < 25) {
          console.log(`🎯 SUCCÈS! L'agent a atteint la cible!`);
          return true;
        }
        
        // Vérifier le temps écoulé (limite à 20 secondes)
        if (episodeTime >= 20) {
          console.log(`⏱️ Épisode terminé après ${episodeTime.toFixed(1)} secondes`);
          return true;
        }
        
        return false;
      },
      onReset: () => {
        // Réinitialiser la position de l'agent selon la difficulté actuelle
        const startPos = getStartingPosition();
        bodyRef.current?.setLinvel(new Vector3(0, 0, 0), true);
        bodyRef.current?.setTranslation(
          new Vector3(startPos[0], startPos[1], startPos[2]), 
          true
        );
        
        // Ne PAS mettre à jour le nombre de succès ici, car c'est déjà fait dans computeReward
        
        // Réinitialiser les compteurs
        setEpisodeSteps(0);
        setReachedTarget(false);
        setEpisodeCount(prev => prev + 1);
        setEpisodeTime(0);
        setEpisodeStartTime(Date.now());
        lastDistance.current = Infinity;
        
        // Générer une nouvelle position pour la cible à chaque épisode
        const { setTargetPosition } = useTrainingStore.getState();
        setTargetPosition(getRandomTargetPosition());
        
        console.log(`Épisode ${episodeCount} terminé.`);
      },
      stepIntervalMs: 1000 / 60, // 60fps
    });
  }
  
  // Test de mouvement périodique pour vérifier si l'agent peut bouger
  useFrame(({clock}) => {
    // Vérifier toutes les 5 secondes si l'agent ne bouge pas
    if (isTraining && clock.getElapsedTime() % 5 < 0.1 && bodyRef.current) {
      const pos = bodyRef.current.translation();
      const vel = bodyRef.current.linvel();
      console.log(`⏱️ Position actuelle: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]`);
      console.log(`🚀 Vitesse actuelle: [${vel.x.toFixed(2)}, ${vel.y.toFixed(2)}, ${vel.z.toFixed(2)}]`);
      
      // Si la vitesse est presque nulle, tenter un mouvement de test
      if (Math.abs(vel.x) < 0.1 && Math.abs(vel.z) < 0.1) {
        console.log("🔄 Test de mouvement (agent coincé?)");
        const testImpulse = MOVEMENT_SPEED * 10;
        bodyRef.current.applyImpulse(new Vector3(0, 0, -testImpulse), true);
      }
    }
  });
  
  // Boucle principale, mettre à jour le temps de l'épisode
  useFrame(() => {
    if (isTraining && envRef.current) {
      const { isTrainingInProgress, setIsTrainingInProgress } = useTrainingStore.getState();
      
      // Vérifier si un entraînement est déjà en cours
      if (!isTrainingInProgress) {
        // Marquer l'entraînement comme en cours
        setIsTrainingInProgress(true);
        
        // Exécuter step() de manière asynchrone
        Promise.resolve().then(async () => {
          try {
            // Appeler step() de manière sécurisée
            await envRef.current?.step();
          } catch (error) {
            console.error("Erreur pendant l'entraînement:", error);
          } finally {
            // Marquer l'entraînement comme terminé
            setIsTrainingInProgress(false);
          }
        });
      }
      
      // Mettre à jour le temps écoulé de l'épisode
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - episodeStartTime) / 1000;
      setEpisodeTime(elapsedSeconds);
      
      // Forcer l'arrêt de l'épisode après 20 secondes
      if (elapsedSeconds > 20 && envRef.current) {
        console.log("⚠️ Arrêt forcé de l'épisode après 20 secondes!");
        envRef.current.reset();
      }
    }
  });
  
  // Fonctions de contrôle
  const startTraining = () => {
    setIsTraining(true);
    if (envRef.current) {
      envRef.current.start();
    }
  };
  
  const stopTraining = () => {
    setIsTraining(false);
    if (envRef.current) {
      envRef.current.stop();
    }
  };
  
  const resetEnvironment = () => {
    if (envRef.current) {
      // Générer une nouvelle position pour la cible
      const { setTargetPosition } = useTrainingStore.getState();
      setTargetPosition(getRandomTargetPosition());
      
      envRef.current.reset();
    }
  };
  
  // Exposer les méthodes via useImperativeHandle
  useImperativeHandle(ref, () => ({
    startTraining,
    stopTraining,
    resetEnvironment,
    // Ajouter une méthode pour obtenir la position actuelle de l'agent
    getAgentPosition: () => {
      if (bodyRef.current) {
        return bodyRef.current.translation();
      }
      return { x: 0, y: 0, z: 0 };
    },
    // Ajouter une méthode pour gérer quand l'agent atteint la cible
    handleTargetReached: () => {
      // Incrémenter le compteur de succès
      setSuccessCount(prev => {
        console.log(`✅ Succès incrémenté: ${prev} -> ${prev + 1}`);
        // Augmenter la difficulté après plusieurs succès
        if ((prev + 1) % 3 === 0) {
          setDifficulty(prevDiff => Math.min(prevDiff + 1, 2));
          console.log(`🔼 Difficulté augmentée à ${Math.min((prev + 1) % 3 + 1, 3)}`);
        }
        return prev + 1;
      });
      
      // Réinitialiser l'environnement
      if (envRef.current) {
        // Générer une nouvelle position pour la cible
        const { setTargetPosition } = useTrainingStore.getState();
        setTargetPosition(getRandomTargetPosition());
        
        // Réinitialiser l'agent
        envRef.current.reset();
      }
    }
  }));
  
  return (
    <>
      <RigidBody 
        ref={bodyRef}
        position={getStartingPosition()}
        type="dynamic" 
        shape="cuboid"
        linearDamping={0.1}  // Réduire l'amortissement pour que l'agent puisse bouger plus facilement
        mass={0.5}           // Réduire la masse pour faciliter le mouvement 
        friction={0}
        lockRotations
      >
        <mesh castShadow>
          <boxGeometry args={[20, 20, 20]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </RigidBody>
    </>
  );
});

const Experience = forwardRef(function Experience(_, ref) {
  const cibleRef = useRef<RapierRigidBody | null>(null);
  const { targetPosition, setTargetPosition } = useTrainingStore();
  const agentRef = useRef<any>(null);
  
  // Référence pour la détection de collision stable
  const collisionDetectionRef = useRef({
    consecutiveCollisions: 0,
    lastCollisionTime: 0,
    collisionInProgress: false
  });
  
  // Exposer les méthodes de contrôle via useImperativeHandle
  useImperativeHandle(ref, () => ({
    startTraining: () => {
      if (agentRef.current) {
        agentRef.current.startTraining();
      }
    },
    stopTraining: () => {
      if (agentRef.current) {
        agentRef.current.stopTraining();
      }
    },
    resetEnvironment: () => {
      if (agentRef.current) {
        agentRef.current.resetEnvironment();
      }
    }
  }));
  
  // Initialiser la position de la cible au premier rendu
  React.useEffect(() => {
    setTargetPosition(getRandomTargetPosition());
  }, [setTargetPosition]);
  
  // Ajouter un gestionnaire de collision pour détecter quand l'agent touche la cible
  React.useEffect(() => {
    // Fonction pour vérifier les collisions manuellement
    const checkCollisions = () => {
      if (!agentRef.current || !cibleRef.current) return;
      
      // Obtenir les positions
      const agentPos = agentRef.current.getAgentPosition();
      const ciblePos = cibleRef.current.translation();
      
      // Calculer la distance
      const distance = Math.sqrt(
        Math.pow(agentPos.x - ciblePos.x, 2) +
        Math.pow(agentPos.y - ciblePos.y, 2) +
        Math.pow(agentPos.z - ciblePos.z, 2)
      );
      
      // Ajuster le seuil de collision en fonction de la taille réelle des objets
      // La taille de l'agent et de la cible est de 20 unités chacun, donc une distance de 20 unités
      // signifie que les bords se touchent. Utilisons une valeur légèrement plus petite pour être sûr.
      const collisionThreshold = 22; // Somme des rayons (10+10) + une petite marge d'erreur (2)
      
      // Si la distance est inférieure au seuil, il y a potentiellement une collision
      if (distance < collisionThreshold) {
        // Incrémenter le compteur de collisions consécutives
        collisionDetectionRef.current.consecutiveCollisions++;
        collisionDetectionRef.current.lastCollisionTime = Date.now();
        
        // Si nous avons détecté plusieurs collisions consécutives et qu'aucune collision n'est en cours
        if (collisionDetectionRef.current.consecutiveCollisions >= 2 && !collisionDetectionRef.current.collisionInProgress) {
          console.log(`🎯 Collision confirmée! Distance: ${distance.toFixed(2)}`);
          // Marquer qu'une collision est en cours pour éviter les déclenchements multiples
          collisionDetectionRef.current.collisionInProgress = true;
          
          // Déclencher manuellement la récompense et la réinitialisation
          if (agentRef.current) {
            agentRef.current.handleTargetReached();
          }
          
          // Réinitialiser le compteur après un certain délai
          setTimeout(() => {
            collisionDetectionRef.current.consecutiveCollisions = 0;
            collisionDetectionRef.current.collisionInProgress = false;
          }, 1000);
        }
      } else {
        // Si la distance est supérieure au seuil, réinitialiser le compteur
        // mais seulement si un certain temps s'est écoulé depuis la dernière collision
        const timeSinceLastCollision = Date.now() - collisionDetectionRef.current.lastCollisionTime;
        if (timeSinceLastCollision > 300) {
          collisionDetectionRef.current.consecutiveCollisions = 0;
        }
      }
    };
    
    // Réduire la fréquence des vérifications pour éviter les faux positifs
    const interval = setInterval(checkCollisions, 200);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  useFrame(() => {
    if (cibleRef.current) {
      // Mettre à jour la position du RigidBody de la cible
      cibleRef.current.setTranslation(
        new Vector3(targetPosition[0], targetPosition[1], targetPosition[2]),
        true
      );
      
      // Mettre à jour la position dans le store (pour l'agent)
      const pos = cibleRef.current.translation();
      if (pos.x !== targetPosition[0] || pos.y !== targetPosition[1] || pos.z !== targetPosition[2]) {
        setTargetPosition([pos.x, pos.y, pos.z]);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Agent ref={agentRef} targetPosition={targetPosition} />
      <Cible cibleRef={cibleRef} position={targetPosition} />
      <Ground />
    </>
  );
});

export default Experience;