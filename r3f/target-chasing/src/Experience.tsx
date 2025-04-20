import { RigidBody } from "@react-three/rapier";

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
    <RigidBody  type="fixed" position={[0, 10, 0]}>
      <mesh castShadow>
        <boxGeometry args={[20, 20, 20]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </RigidBody>
  );
}

function Agent() {
  
  return (
    <>
      <RigidBody 
        type="dynamic" 
        position={[0, 10, 100]}
        linearDamping={0.05}  // Très faible amortissement
        angularDamping={0.9}
        friction={0}         // Aucune friction pour maximiser le glissement
        restitution={0}
        lockRotations={true}
        gravityScale={0.05}  // Très légère gravité pour maintenir le contact
      >
        <mesh castShadow>
          <boxGeometry args={[20, 20, 20]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </RigidBody>
    </>
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