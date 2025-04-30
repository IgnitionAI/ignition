import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'; // Added useEffect

import { Vector3 } from 'three';

import { DQNAgent } from '@ignitionai/backend-tfjs';
import { IgnitionEnv } from '@ignitionai/core';
import { useFrame } from '@react-three/fiber';
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from '@react-three/rapier'; // Added CuboidCollider

import { useTrainingStore } from './store/trainingStore';

// Define the structure for agent configuration (matching App.tsx)
interface AgentConfig {
  inputSize: number;
  actionSize: number;
  hiddenLayers: number[];
  epsilon: number;
  epsilonDecay: number;
  minEpsilon: number;
  gamma: number;
  lr: number;
  batchSize: number;
  memorySize: number;
}

const MOVEMENT_SPEED = 100;

// Constants for the plateau limits
const PLATEAU_LIMITS = {
  minX: -500, maxX: 500,
  minY: -1,   maxY: 100,
  minZ: -500, maxZ: 500
};

// Function to generate a random target position
function getRandomTargetPosition(): [number, number, number] {
  const margin = 100;
  const x = Math.random() * (PLATEAU_LIMITS.maxX - PLATEAU_LIMITS.minX - 2 * margin) + PLATEAU_LIMITS.minX + margin;
  const y = 10;
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

function Cible({ cibleRef, position }: { cibleRef: React.RefObject<RapierRigidBody | null>, position: [number, number, number] }) {
  return (
    <RigidBody
      ref={cibleRef}
      type="kinematicPosition"
      position={position}
      colliders={false} // Disable default collider
      linearDamping={0.5}
      mass={1}
      friction={0}
      lockRotations
    >
      <mesh castShadow>
        <boxGeometry args={[20, 20, 20]} />
        <meshStandardMaterial color="red" />
      </mesh>
      {/* Add a sensor collider for detecting collision */}
      <CuboidCollider args={[10, 10, 10]} sensor />
    </RigidBody>
  );
}

// Define props for the Agent component, including agentConfig
interface AgentProps {
  targetPosition: [number, number, number];
  agentConfig: AgentConfig; // Receive agent configuration
}

const Agent = forwardRef(function Agent({ targetPosition, agentConfig }: AgentProps, ref) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const initialPosition: [number, number, number] = [100, 10, 100];

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
    setIsTrainingInProgress, // Get the setter for training progress
  } = useTrainingStore();

  const envRef = useRef<IgnitionEnv | null>(null);
  const agentRefInternal = useRef<DQNAgent | null>(null); // Store the agent instance
  const lastDistance = useRef(Infinity);

  const getStartingPosition = (): [number, number, number] => {
    if (difficulty === 0) return [targetPosition[0] + 30, targetPosition[1], targetPosition[2] + 30];
    if (difficulty === 1) return [targetPosition[0] + 60, targetPosition[1], targetPosition[2] + 60];
    return initialPosition;
  };

  // Function to initialize or re-initialize the environment and agent
  const initializeEnvironment = (config: AgentConfig) => {
    console.log("🔄 Initializing/Re-initializing environment with config:", config);

    // Dispose previous agent model if exists to free up GPU memory
    agentRefInternal.current?.dispose();

    const dqnAgent = new DQNAgent({
      actionSize: config.actionSize,
      inputSize: config.inputSize,
      hiddenLayers: config.hiddenLayers,
      epsilon: config.epsilon,
      epsilonDecay: config.epsilonDecay,
      minEpsilon: config.minEpsilon,
      gamma: config.gamma,
      lr: config.lr,
      batchSize: config.batchSize,
      memorySize: config.memorySize,
      targetUpdateFrequency: 200, // Keep this or make it configurable
    });
    agentRefInternal.current = dqnAgent; // Store the new agent instance

    envRef.current = new IgnitionEnv({
      agent: dqnAgent,
      getObservation: () => {
        const pos = bodyRef.current?.translation() || { x: 0, y: 0, z: 0 };
        const dirX = targetPosition[0] - pos.x;
        const dirY = targetPosition[1] - pos.y;
        const dirZ = targetPosition[2] - pos.z;
        const dirMagnitude = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        const distToMinX = (pos.x - PLATEAU_LIMITS.minX) / 1000;
        const distToMaxX = (PLATEAU_LIMITS.maxX - pos.x) / 1000;
        const distToMinZ = (pos.z - PLATEAU_LIMITS.minZ) / 1000;
        const distToMaxZ = (PLATEAU_LIMITS.maxZ - pos.z) / 1000;
        const distToGround = (pos.y - PLATEAU_LIMITS.minY) / 100;

        return [
          dirX / (dirMagnitude + 0.001),
          dirY / (dirMagnitude + 0.001),
          dirZ / (dirMagnitude + 0.001),
          dirMagnitude / 1000,
          distToMinX, distToMaxX, distToGround, distToMinZ, distToMaxZ,
        ];
      },
      applyAction: (action: number | number[]) => {
        setEpisodeSteps(prev => prev + 1);
        if (!bodyRef.current) return;

        const pos = bodyRef.current.translation();
        const shouldRandomize = episodeSteps < 20 && Math.random() < 0.5;
        let finalAction = Array.isArray(action) ? -1 : action; // Handle array case if needed

        if (!Array.isArray(action)) {
          if (shouldRandomize) {
            finalAction = Math.floor(Math.random() * config.actionSize);
          }
          setLastAction(finalAction);
          const velocity = MOVEMENT_SPEED * 5;
          switch (finalAction) {
            case 0: bodyRef.current.setLinvel(new Vector3(-velocity, 0, 0), true); break; // Left
            case 1: bodyRef.current.setLinvel(new Vector3(velocity, 0, 0), true); break; // Right
            case 2: bodyRef.current.setLinvel(new Vector3(0, 0, -velocity), true); break; // Forward
            case 3: bodyRef.current.setLinvel(new Vector3(0, 0, velocity), true); break; // Backward
            // Add more cases if actionSize > 4
            default: bodyRef.current.setLinvel(new Vector3(0, 0, 0), true);
          }
        }
        // console.log(`Action: ${finalAction}, Position: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]`);
      },
      computeReward: () => {
        const pos = bodyRef.current?.translation() || { x: 0, y: 0, z: 0 };
        const distance = Math.sqrt(Math.pow(pos.x - targetPosition[0], 2) + Math.pow(pos.y - targetPosition[1], 2) + Math.pow(pos.z - targetPosition[2], 2));
        let calculatedReward = 0;

        if (pos.x < PLATEAU_LIMITS.minX || pos.x > PLATEAU_LIMITS.maxX || pos.y < PLATEAU_LIMITS.minY || pos.y > PLATEAU_LIMITS.maxY || pos.z < PLATEAU_LIMITS.minZ || pos.z > PLATEAU_LIMITS.maxZ) {
          return -100; // Out of bounds penalty
        }

        if (distance < 25) {
          setReachedTarget(true);
          setSuccessCount(prev => {
            if ((prev + 1) % 3 === 0) {
              setDifficulty(prevDiff => Math.min(prevDiff + 1, 2));
            }
            return prev + 1;
          });
          return 100; // Target reached reward
        }

        const proximityReward = Math.max(0, 2 * (1 - distance / 200));
        calculatedReward = proximityReward;
        const distanceDelta = lastDistance.current - distance;
        calculatedReward += (distanceDelta > 0) ? 0.2 : -0.1; // Reward progress, penalize moving away
        lastDistance.current = distance;

        setReward(calculatedReward);
        if (calculatedReward > bestReward) setBestReward(calculatedReward);
        return calculatedReward;
      },
      isDone: () => {
        const pos = bodyRef.current?.translation() || { x: 0, y: 0, z: 0 };
        if (pos.x < PLATEAU_LIMITS.minX || pos.x > PLATEAU_LIMITS.maxX || pos.y < PLATEAU_LIMITS.minY || pos.z < PLATEAU_LIMITS.minZ || pos.z > PLATEAU_LIMITS.maxZ) {
          return true; // Out of bounds
        }
        const distance = Math.sqrt(Math.pow(pos.x - targetPosition[0], 2) + Math.pow(pos.y - targetPosition[1], 2) + Math.pow(pos.z - targetPosition[2], 2));
        if (distance < 25) return true; // Reached target
        if (episodeTime >= 20) return true; // Time limit
        return false;
      },
      onReset: () => {
        const startPos = getStartingPosition();
        bodyRef.current?.setLinvel(new Vector3(0, 0, 0), true);
        bodyRef.current?.setTranslation(new Vector3(startPos[0], startPos[1], startPos[2]), true);
        setEpisodeSteps(0);
        setReachedTarget(false);
        setEpisodeCount(prev => prev + 1);
        setEpisodeTime(0);
        setEpisodeStartTime(Date.now());
        lastDistance.current = Infinity;
        const { setTargetPosition } = useTrainingStore.getState();
        setTargetPosition(getRandomTargetPosition());
        console.log(`Episode ${episodeCount + 1} started.`);
      },
      stepIntervalMs: 1000 / 60, // 60fps
    });
  };

  // Initialize environment when component mounts or config changes
  useEffect(() => {
    initializeEnvironment(agentConfig);
    // If training was active, stop it before re-initializing
    if (isTraining) {
      stopTraining();
    }
  }, [agentConfig]); // Re-initialize if agentConfig changes

  // Main training loop
  useFrame(() => {
    if (isTraining && envRef.current) {
      const { isTrainingInProgress } = useTrainingStore.getState();
      if (!isTrainingInProgress) {
        setIsTrainingInProgress(true);
        Promise.resolve().then(async () => {
          try {
            await envRef.current?.step();
          } catch (error) {
            console.error("Training step error:", error);
          } finally {
            setIsTrainingInProgress(false);
          }
        });
      }
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - episodeStartTime) / 1000;
      setEpisodeTime(elapsedSeconds);
      if (elapsedSeconds > 20 && envRef.current) {
        envRef.current.reset(); // Force reset after time limit
      }
    }
  });

  // Control functions
  const startTraining = (config: AgentConfig) => {
    // Ensure environment is initialized with the latest config before starting
    if (JSON.stringify(config) !== JSON.stringify(agentConfig)) {
        initializeEnvironment(config);
    }
    setIsTraining(true);
    if (envRef.current) {
      envRef.current.start();
      setEpisodeStartTime(Date.now()); // Reset start time
      console.log("Training started...");
    }
  };

  const stopTraining = () => {
    setIsTraining(false);
    if (envRef.current) {
      envRef.current.stop();
      console.log("Training stopped.");
    }
  };

  const resetEnvironment = (config: AgentConfig) => {
    // Ensure environment is initialized with the latest config before resetting
    if (JSON.stringify(config) !== JSON.stringify(agentConfig)) {
        initializeEnvironment(config);
    }
    if (envRef.current) {
      envRef.current.reset();
      console.log("Environment reset.");
    }
  };

  // Expose methods via useImperativeHandle
  useImperativeHandle(ref, () => ({
    startTraining,
    stopTraining,
    resetEnvironment,
  }));

  return (
    <>
      <RigidBody
        ref={bodyRef}
        position={getStartingPosition()} // Use dynamic starting position
        type="dynamic"
        colliders="cuboid"
        linearDamping={0.1}
        mass={0.5}
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

// Define props for the Experience component
interface ExperienceProps {
  agentConfig: AgentConfig;
}

const Experience = forwardRef(function Experience({ agentConfig }: ExperienceProps, ref) {
  const cibleRef = useRef<RapierRigidBody | null>(null);
  const { targetPosition, setTargetPosition } = useTrainingStore();
  const agentComponentRef = useRef<any>(null); // Ref for the Agent component

  // Update target position visually
  useEffect(() => {
    if (cibleRef.current) {
      cibleRef.current.setTranslation(new Vector3(targetPosition[0], targetPosition[1], targetPosition[2]), true);
    }
  }, [targetPosition]);

  // Expose Agent's control methods through Experience's ref
  useImperativeHandle(ref, () => ({
    startTraining: (config: AgentConfig) => agentComponentRef.current?.startTraining(config),
    stopTraining: () => agentComponentRef.current?.stopTraining(),
    resetEnvironment: (config: AgentConfig) => agentComponentRef.current?.resetEnvironment(config),
  }));

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 100, 50]} intensity={1} castShadow />
      <Ground />
      <Cible cibleRef={cibleRef} position={targetPosition} />
      {/* Pass agentConfig down to the Agent component */}
      <Agent ref={agentComponentRef} targetPosition={targetPosition} agentConfig={agentConfig} />
    </>
  );
});

export default Experience;

