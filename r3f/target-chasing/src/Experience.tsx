import {  useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import {  useRef } from "react";
import { Controls } from "./App";
import { Vector3 } from "three";

const MOVEMENT_SPEED = 100;

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

function Cible() {

  return (
    <RigidBody  
    type="dynamic" 
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

function Agent() { 
  const bodyRef = useRef<RapierRigidBody>(null);
  const initialPosition: [number, number, number] = [100, 10, 100];
  const [, get] = useKeyboardControls();
  const velocity = new Vector3();
  
  useFrame(() => {
    velocity.x = 0;
    velocity.y = 0;
    velocity.z = 0;
    if (get()[Controls.forward]) {
      velocity.z -= MOVEMENT_SPEED;
    }
    if (get()[Controls.back]) {
      velocity.z += MOVEMENT_SPEED;
    }
    if (get()[Controls.left]) {
      velocity.x -= MOVEMENT_SPEED;
    }
    if (get()[Controls.right]) {
      velocity.x += MOVEMENT_SPEED;
    }
    if (get()[Controls.jump]) {
      velocity.y += MOVEMENT_SPEED;
    }
    bodyRef.current?.setLinvel(velocity, true);
  });
  
  return (
    <RigidBody 
      ref={bodyRef}
      position={initialPosition}
      type="dynamic"
      shape="cuboid"
      linearDamping={0.5}
      mass={1}
      friction={0}
      lockRotations
    >
      <mesh castShadow>
        <boxGeometry args={[20, 20, 20]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    </RigidBody>
  );
}

function Experience() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Agent />
      <Cible />
      <Ground />
    </>
  );
}

export default Experience;