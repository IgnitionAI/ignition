import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useRef, useState } from "react";
import { Vector3 } from "three";
import { DQNAgent } from "@ignitionai/backend-tfjs";
import { IgnitionEnv } from "@ignitionai/core";
import React from "react";

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

function Cible({cibleRef}: {cibleRef: React.RefObject<RapierRigidBody | null>}) {
  return (
    <RigidBody  
      ref={cibleRef}
      type="kinematicPosition" 
      position={[0, 10, 0]} 
      shape="cuboid"
      linearDamping={0.5}
      mass={1}
      friction={0}
      lockRotations
    >
      <mesh castShadow>
        <boxGeometry args={[20, 20, 20]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </RigidBody>
  );
}

function Agent({targetPosition}: {targetPosition: [number, number, number]}) { 
  // Références et états
  const bodyRef = useRef<RapierRigidBody>(null);
  const initialPosition: [number, number, number] = [100, 10, 100]; // Position de départ éloignée
  
  // États d'entraînement
  const [isTraining, setIsTraining] = useState(false);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [reward, setReward] = useState(0);
  const [bestReward, setBestReward] = useState(-Infinity);
  const [episodeSteps, setEpisodeSteps] = useState(0);
  const [reachedTarget, setReachedTarget] = useState(false);
  const [episodeTime, setEpisodeTime] = useState(0);
  const [episodeStartTime, setEpisodeStartTime] = useState(Date.now());
  const [successCount, setSuccessCount] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [lastAction, setLastAction] = useState(-1);
  
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
      epsilon: 0.95,     // Très forte exploration au début
      epsilonDecay: 0.99, // Décroissance lente
      lr: 0.001,
      batchSize: 32,
      gamma: 0.99,
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
        
        // Ajouter un peu d'aléatoire aux premières étapes
        const randomFactor = Math.min(1, 100 / (episodeCount + 1));
        const shouldRandomize = Math.random() < randomFactor && episodeSteps < 5;
        
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
        
        // Récompense proportionnelle à la proximité (plus simple)
        // Coefficient entre 0 et 1 basé sur la distance (1 = proche, 0 = loin)
        const proximityReward = Math.max(0, 1 - distance / 200);
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
      // Mode entraînement: IA contrôle l'agent
      envRef.current.step();
      
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
      envRef.current.reset();
    }
  };
  
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
      
      {/* Interface utilisateur pour contrôler l'entraînement */}
      <Html position={[100, 100, 0]} style={{ width: '300px', height: 'auto', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px', color: 'white' }}>
        <div>
          <h3>Contrôle d'entraînement</h3>
          <div>Épisodes: {episodeCount}</div>
          <div>Succès: {successCount} / {episodeCount}</div>
          <div>Difficulté: {difficulty + 1}/3</div>
          <div>Temps: {episodeTime.toFixed(1)}s</div>
          <div>Dernière action: {lastAction !== -1 ? ['Gauche', 'Droite', 'Avant', 'Arrière'][lastAction] : 'Aucune'}</div>
          <div>Récompense: {reward.toFixed(2)}</div>
          <div style={{ marginTop: '10px' }}>
            {!isTraining ? (
              <button onClick={startTraining}>Démarrer l'entraînement</button>
            ) : (
              <button onClick={stopTraining}>Arrêter l'entraînement</button>
            )}
            <button onClick={resetEnvironment} style={{ marginLeft: '10px' }}>Réinitialiser</button>
          </div>
        </div>
      </Html>
    </>
  );
}

function Experience() {
  const cibleRef = useRef<RapierRigidBody | null>(null);
  const [targetPosition, setTargetPosition] = useState<[number, number, number]>([0, 10, 0]);
  
  useFrame(() => {
    if (cibleRef.current) {
      const pos = cibleRef.current.translation();
      setTargetPosition([pos.x, pos.y, pos.z]);
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
      <Agent targetPosition={targetPosition} />
      <Cible cibleRef={cibleRef} />
      <Ground />
    </>
  );
}

export default Experience;